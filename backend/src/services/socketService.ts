import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import config from '@/config/env';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SocketService');

interface AuthenticatedSocket {
  id: string;
  userId: string;
  email: string;
  role: Role;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private authenticatedSockets = new Map<string, AuthenticatedSocket>();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.CORS_ORIGIN.split(','),
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupAuthentication();
    this.setupEventHandlers();

    logger.info('Socket.IO server initialized');
  }

  private setupAuthentication() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        
        if (decoded.type !== 'access') {
          return next(new Error('Invalid token type'));
        }

        // Store user info in socket
        (socket as any).user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = (socket as any).user;
      
      this.authenticatedSockets.set(socket.id, {
        id: socket.id,
        userId: user.userId,
        email: user.email,
        role: user.role,
      });

      logger.info(`User connected: ${user.email} (${socket.id})`);

      // Join user to their personal room
      socket.join(`user:${user.userId}`);
      
      // Join role-based rooms
      socket.join(`role:${user.role}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.authenticatedSockets.delete(socket.id);
        logger.info(`User disconnected: ${user.email} (${socket.id})`);
      });

      // Handle real-time updates subscription
      socket.on('subscribe:notifications', () => {
        socket.join(`notifications:${user.userId}`);
        logger.debug(`User subscribed to notifications: ${user.email}`);
      });

      socket.on('subscribe:whatsapp', () => {
        socket.join('whatsapp:updates');
        logger.debug(`User subscribed to WhatsApp updates: ${user.email}`);
      });

      socket.on('subscribe:practices', (practiceIds: string[]) => {
        practiceIds.forEach(id => {
          socket.join(`practice:${id}`);
        });
        logger.debug(`User subscribed to practices: ${practiceIds.length} practices`);
      });

      socket.on('subscribe:clients', (clientIds: string[]) => {
        clientIds.forEach(id => {
          socket.join(`client:${id}`);
        });
        logger.debug(`User subscribed to clients: ${clientIds.length} clients`);
      });

      // Handle typing indicators for WhatsApp
      socket.on('whatsapp:typing', (data: { clientId: string; isTyping: boolean }) => {
        socket.to(`client:${data.clientId}`).emit('whatsapp:typing', {
          userId: user.userId,
          isTyping: data.isTyping,
        });
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        user: {
          id: user.userId,
          email: user.email,
          role: user.role,
        },
      });
    });
  }

  // Notification methods
  sendNotificationToUser(userId: string, notification: any) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('notification', notification);
    logger.debug(`Notification sent to user ${userId}: ${notification.title}`);
  }

  sendNotificationToRole(role: Role, notification: any) {
    if (!this.io) return;
    
    this.io.to(`role:${role}`).emit('notification', notification);
    logger.debug(`Notification sent to role ${role}: ${notification.title}`);
  }

  broadcastNotification(notification: any) {
    if (!this.io) return;
    
    this.io.emit('notification', notification);
    logger.debug(`Broadcast notification: ${notification.title}`);
  }

  // WhatsApp real-time updates
  notifyWhatsAppMessage(messageData: any) {
    if (!this.io) return;
    
    this.io.to('whatsapp:updates').emit('whatsapp:message', messageData);
    
    // Also notify specific client watchers
    if (messageData.clientId) {
      this.io.to(`client:${messageData.clientId}`).emit('whatsapp:message', messageData);
    }
    
    logger.debug(`WhatsApp message notification sent`);
  }

  notifyWhatsAppStatus(status: any) {
    if (!this.io) return;
    
    this.io.to('whatsapp:updates').emit('whatsapp:status', status);
    logger.debug(`WhatsApp status update sent: ${status.status}`);
  }

  // Practice updates
  notifyPracticeUpdate(practiceId: string, updateData: any) {
    if (!this.io) return;
    
    this.io.to(`practice:${practiceId}`).emit('practice:update', updateData);
    logger.debug(`Practice update sent for practice ${practiceId}`);
  }

  notifyPracticeDeadline(practiceData: any) {
    if (!this.io) return;
    
    // Notify all authenticated users about deadline
    this.io.emit('practice:deadline', practiceData);
    logger.debug(`Practice deadline notification sent: ${practiceData.title}`);
  }

  // Client updates
  notifyClientUpdate(clientId: string, updateData: any) {
    if (!this.io) return;
    
    this.io.to(`client:${clientId}`).emit('client:update', updateData);
    logger.debug(`Client update sent for client ${clientId}`);
  }

  // Email notifications
  notifyEmailReceived(emailData: any) {
    if (!this.io) return;
    
    this.io.emit('email:received', emailData);
    
    // Notify specific client watchers
    if (emailData.clientId) {
      this.io.to(`client:${emailData.clientId}`).emit('email:received', emailData);
    }
    
    logger.debug(`Email received notification sent`);
  }

  // System notifications
  notifySystemStatus(status: any) {
    if (!this.io) return;
    
    this.io.emit('system:status', status);
    logger.debug(`System status update sent: ${status.service}`);
  }

  // Dashboard real-time updates
  sendDashboardUpdate(data: any) {
    if (!this.io) return;
    
    this.io.emit('dashboard:update', data);
    logger.debug('Dashboard update sent');
  }

  // Utility methods
  getConnectedUsers(): AuthenticatedSocket[] {
    return Array.from(this.authenticatedSockets.values());
  }

  getConnectedUserCount(): number {
    return this.authenticatedSockets.size;
  }

  isUserConnected(userId: string): boolean {
    return Array.from(this.authenticatedSockets.values()).some(socket => socket.userId === userId);
  }

  disconnectUser(userId: string) {
    if (!this.io) return;
    
    const userSockets = Array.from(this.authenticatedSockets.entries())
      .filter(([_, socket]) => socket.userId === userId);
    
    userSockets.forEach(([socketId]) => {
      const socket = this.io?.sockets.sockets.get(socketId);
      socket?.disconnect();
    });
  }
}

export const socketService = new SocketService();
export default socketService;
