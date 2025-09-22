import { NotificationType, Priority, Role } from '@prisma/client';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';
import socketService from '../socketService';
import emailService from '../emailService';
import whatsappService from '../whatsappService';

const logger = createLogger('NotificationService');

interface CreateNotificationData {
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: Priority;
  expiresAt?: Date;
}

class NotificationService {
  async createNotification(notificationData: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          ...notificationData,
          priority: notificationData.priority || Priority.MEDIUM,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Send real-time notification
      if (notification.userId) {
        socketService.sendNotificationToUser(notification.userId, notification);
      }

      logger.info(`Notification created: ${notification.title} for user ${notification.userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async createBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationData, 'userId'>) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.createNotification({ ...notificationData, userId }))
      );

      logger.info(`Bulk notifications created: ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  async createRoleNotification(role: Role, notificationData: Omit<CreateNotificationData, 'userId'>) {
    try {
      // Get all users with the specified role
      const users = await prisma.user.findMany({
        where: { role, isActive: true },
        select: { id: true },
      });

      const userIds = users.map(user => user.id);
      return await this.createBulkNotifications(userIds, notificationData);
    } catch (error) {
      logger.error('Error creating role notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, filters: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: Priority;
    limit?: number;
    offset?: number;
  } = {}) {
    const { isRead, type, priority, limit = 50, offset = 0 } = filters;

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    // Only show non-expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

    return await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: { 
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: { isRead: true },
      });

      logger.debug(`Notification marked as read: ${notificationId}`);
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: { 
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getNotificationCounts(userId: string) {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        prisma.notification.count({
          where: { 
            userId,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        }),
        prisma.notification.count({
          where: { 
            userId,
            isRead: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { 
            userId,
            isRead: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          _count: true,
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { 
            userId,
            isRead: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          _count: true,
        }),
      ]);

      return {
        total,
        unread,
        byType,
        byPriority,
      };
    } catch (error) {
      logger.error('Error getting notification counts:', error);
      throw error;
    }
  }

  // Specific notification creators
  async notifyPracticeDeadline(practiceId: string) {
    try {
      const practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        include: { client: true },
      });

      if (!practice || !practice.dueDate) return;

      const daysUntilDue = Math.ceil(
        (practice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority = Priority.MEDIUM;
      if (daysUntilDue <= 1) priority = Priority.URGENT;
      else if (daysUntilDue <= 3) priority = Priority.HIGH;

      await this.createRoleNotification(Role.GEOMETRA, {
        type: NotificationType.PRACTICE_DEADLINE,
        title: 'Scadenza Pratica',
        message: `La pratica "${practice.title}" per ${practice.client?.firstName} ${practice.client?.lastName} scade ${daysUntilDue <= 0 ? 'oggi' : `tra ${daysUntilDue} giorni`}`,
        data: { practiceId, clientId: practice.clientId, daysUntilDue },
        priority,
      });

      // Send real-time update
      socketService.notifyPracticeDeadline({
        practiceId,
        title: practice.title,
        clientName: `${practice.client?.firstName} ${practice.client?.lastName}`,
        daysUntilDue,
        priority,
      });

    } catch (error) {
      logger.error('Error notifying practice deadline:', error);
    }
  }

  async notifyWhatsAppMessage(messageData: any) {
    try {
      // Find users who should be notified
      const users = await prisma.user.findMany({
        where: { 
          isActive: true,
          role: { in: [Role.SECRETARY, Role.GEOMETRA, Role.ADMIN] },
        },
        select: { id: true },
      });

      await this.createBulkNotifications(
        users.map(u => u.id),
        {
          type: NotificationType.WHATSAPP_MESSAGE,
          title: 'Nuovo messaggio WhatsApp',
          message: `Messaggio ricevuto da ${messageData.client?.firstName} ${messageData.client?.lastName}`,
          data: { 
            messageId: messageData.id,
            clientId: messageData.clientId,
            preview: messageData.content?.substring(0, 100),
          },
          priority: messageData.aiPriority || Priority.MEDIUM,
        }
      );

      // Send real-time notification
      socketService.notifyWhatsAppMessage(messageData);

    } catch (error) {
      logger.error('Error notifying WhatsApp message:', error);
    }
  }

  async notifyEmailReceived(emailData: any) {
    try {
      const users = await prisma.user.findMany({
        where: { 
          isActive: true,
          role: { in: [Role.SECRETARY, Role.GEOMETRA, Role.ADMIN] },
        },
        select: { id: true },
      });

      await this.createBulkNotifications(
        users.map(u => u.id),
        {
          type: NotificationType.EMAIL_RECEIVED,
          title: 'Nuova email ricevuta',
          message: `Email da ${emailData.fromEmail}: ${emailData.subject}`,
          data: { 
            emailId: emailData.id,
            clientId: emailData.clientId,
            subject: emailData.subject,
          },
          priority: Priority.MEDIUM,
        }
      );

      // Send real-time notification
      socketService.notifyEmailReceived(emailData);

    } catch (error) {
      logger.error('Error notifying email received:', error);
    }
  }

  async notifyAppointmentReminder(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      });

      if (!appointment) return;

      const hoursUntilAppointment = Math.ceil(
        (appointment.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      );

      await this.createRoleNotification(Role.GEOMETRA, {
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Promemoria Appuntamento',
        message: `Appuntamento con ${appointment.client?.firstName} ${appointment.client?.lastName} ${hoursUntilAppointment <= 1 ? 'tra meno di un\'ora' : `tra ${hoursUntilAppointment} ore`}`,
        data: { 
          appointmentId,
          clientId: appointment.clientId,
          startTime: appointment.startTime,
        },
        priority: hoursUntilAppointment <= 1 ? Priority.HIGH : Priority.MEDIUM,
      });

    } catch (error) {
      logger.error('Error notifying appointment reminder:', error);
    }
  }

  async notifyPaymentDue(practiceId: string) {
    try {
      const practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        include: { client: true },
      });

      if (!practice || practice.isPaid) return;

      await this.createRoleNotification(Role.ADMIN, {
        type: NotificationType.PAYMENT_DUE,
        title: 'Pagamento in Sospeso',
        message: `Pagamento in sospeso per "${practice.title}" - ${practice.client?.firstName} ${practice.client?.lastName} (€${practice.amount})`,
        data: { 
          practiceId,
          clientId: practice.clientId,
          amount: practice.amount,
        },
        priority: Priority.HIGH,
      });

    } catch (error) {
      logger.error('Error notifying payment due:', error);
    }
  }

  async notifySystemAlert(message: string, priority: Priority = Priority.MEDIUM) {
    try {
      await this.createRoleNotification(Role.ADMIN, {
        type: NotificationType.SYSTEM_ALERT,
        title: 'Alert di Sistema',
        message,
        priority,
      });

      // Send real-time notification
      socketService.notifySystemStatus({
        service: 'system',
        status: 'alert',
        message,
        priority,
      });

    } catch (error) {
      logger.error('Error notifying system alert:', error);
    }
  }

  // Cleanup old notifications
  async cleanupExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      logger.info(`Cleaned up ${result.count} expired notifications`);
      return result;
    } catch (error) {
      logger.error('Error cleaning up notifications:', error);
      throw error;
    }
  }

  // Auto-cleanup old read notifications (keep last 30 days)
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      logger.info(`Cleaned up ${result.count} old read notifications`);
      return result;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
