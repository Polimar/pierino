import { Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import emailService from '@/services/emailService';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EmailController');

export const getEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, isRead, limit, offset } = req.query;
    
    const emails = await emailService.getEmails({
      clientId: clientId as string,
      isRead: isRead ? isRead === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    
    res.json({
      success: true,
      data: { emails },
    });
  } catch (error) {
    logger.error('Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle email',
    });
  }
};

export const sendEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, body, html, attachments } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Destinatario, oggetto e corpo email sono richiesti',
      });
    }

    const messageId = await emailService.sendEmail(to, subject, body, html, attachments);
    
    res.json({
      success: true,
      message: 'Email inviata con successo',
      data: { messageId },
    });
  } catch (error) {
    logger.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio dell\'email',
    });
  }
};

export const sendTemplateEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, to, variables, attachments } = req.body;

    if (!templateId || !to || !variables) {
      return res.status(400).json({
        success: false,
        message: 'Template ID, destinatario e variabili sono richiesti',
      });
    }

    const messageId = await emailService.sendTemplateEmail(templateId, to, variables, attachments);
    
    res.json({
      success: true,
      message: 'Email template inviata con successo',
      data: { messageId },
    });
  } catch (error) {
    logger.error('Send template email error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio dell\'email template',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await emailService.markEmailAsRead(id);
    
    res.json({
      success: true,
      message: 'Email contrassegnata come letta',
    });
  } catch (error) {
    logger.error('Mark email as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel contrassegnare l\'email come letta',
    });
  }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = emailService.getTemplates();
    
    res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei template',
    });
  }
};

export const getEmailStatus = async (req: AuthRequest, res: Response) => {
  try {
    const isReady = emailService.isServiceReady();
    
    res.json({
      success: true,
      data: { 
        isReady,
        status: isReady ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    logger.error('Get email status error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello stato email',
    });
  }
};

export const sendPracticeReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;

    await emailService.sendPracticeReminder(practiceId);
    
    res.json({
      success: true,
      message: 'Promemoria pratica inviato con successo',
    });
  } catch (error) {
    logger.error('Send practice reminder error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio del promemoria',
    });
  }
};

export const sendPracticeCompleted = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;

    await emailService.sendPracticeCompletedNotification(practiceId);
    
    res.json({
      success: true,
      message: 'Notifica completamento pratica inviata con successo',
    });
  } catch (error) {
    logger.error('Send practice completed notification error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio della notifica',
    });
  }
};

export const sendAppointmentReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId } = req.params;

    await emailService.sendAppointmentReminder(appointmentId);
    
    res.json({
      success: true,
      message: 'Promemoria appuntamento inviato con successo',
    });
  } catch (error) {
    logger.error('Send appointment reminder error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio del promemoria',
    });
  }
};
