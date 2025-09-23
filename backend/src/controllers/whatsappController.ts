import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import whatsappService from '../services/whatsappService';
import aiService from '../services/aiService';
import { createLogger } from '../utils/logger';
import { validateId } from '../utils/validation';

const logger = createLogger('WhatsAppController');

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const status = whatsappService.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Get WhatsApp status error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello stato WhatsApp',
    });
  }
};

export const connect = async (req: AuthRequest, res: Response) => {
  try {
    await whatsappService.connect();
    
    res.json({
      success: true,
      message: 'Connessione WhatsApp avviata',
    });
  } catch (error) {
    logger.error('WhatsApp connect error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella connessione WhatsApp',
    });
  }
};

export const disconnect = async (req: AuthRequest, res: Response) => {
  try {
    await whatsappService.disconnect();
    
    res.json({
      success: true,
      message: 'WhatsApp disconnesso con successo',
    });
  } catch (error) {
    logger.error('WhatsApp disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella disconnessione WhatsApp',
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Destinatario e messaggio sono richiesti',
      });
    }

    const messageId = await whatsappService.sendMessage(to, message);
    
    res.json({
      success: true,
      message: 'Messaggio inviato con successo',
      data: { messageId },
    });
  } catch (error) {
    logger.error('Send WhatsApp message error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio del messaggio',
    });
  }
};

export const sendMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { to, caption } = req.body;
    const file = req.file;

    if (!to || !file) {
      return res.status(400).json({
        success: false,
        message: 'Destinatario e file sono richiesti',
      });
    }

    const messageId = await whatsappService.sendMedia(to, file.path, caption);
    
    res.json({
      success: true,
      message: 'Media inviato con successo',
      data: { messageId },
    });
  } catch (error) {
    logger.error('Send WhatsApp media error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio del media',
    });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, limit } = req.query;
    
    const messages = await whatsappService.getMessages(
      limit ? parseInt(limit as string) : 50
    );
    
    res.json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    logger.error('Get WhatsApp messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei messaggi',
    });
  }
};

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const chats = await whatsappService.getChats();
    
    res.json({
      success: true,
      data: { chats },
    });
  } catch (error) {
    logger.error('Get WhatsApp chats error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nel recupero delle chat',
    });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await whatsappService.getContacts();
    
    res.json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    logger.error('Get WhatsApp contacts error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nel recupero dei contatti',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    
    const { error } = validateId(messageId);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID messaggio non valido',
      });
    }

    await whatsappService.markAsRead(messageId);
    
    res.json({
      success: true,
      message: 'Messaggio contrassegnato come letto',
    });
  } catch (error) {
    logger.error('Mark WhatsApp message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel contrassegnare il messaggio come letto',
    });
  }
};

export const analyzeMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    
    const { error } = validateId(messageId);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID messaggio non valido',
      });
    }

    // Get message from database
    const message = await whatsappService.getMessages();
    const targetMessage = message.find(m => m.messageId === messageId);
    
    if (!targetMessage) {
      return res.status(404).json({
        success: false,
        message: 'Messaggio non trovato',
      });
    }

    // Analyze with AI
    const clientContext = targetMessage.client 
      ? `Cliente: ${targetMessage.client.firstName} ${targetMessage.client.lastName}`
      : undefined;

    const analysis = await aiService.analyzeWhatsAppMessage(
      targetMessage.content,
      clientContext
    );
    
    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    logger.error('Analyze WhatsApp message error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'analisi del messaggio',
    });
  }
};

export const generateResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    
    const { error } = validateId(messageId);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID messaggio non valido',
      });
    }

    // Get message from database
    const messages = await whatsappService.getMessages();
    const targetMessage = messages.find(m => m.messageId === messageId);
    
    if (!targetMessage) {
      return res.status(404).json({
        success: false,
        message: 'Messaggio non trovato',
      });
    }

    // Get recent conversation history
    const conversationHistory = messages
      .filter(m => m.clientId === targetMessage.clientId)
      .slice(0, 10)
      .reverse()
      .map(m => ({
        role: m.fromMe ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

    const context = `
Genera una risposta professionale per questo messaggio WhatsApp da parte di uno studio geometra.
${targetMessage.client ? `Cliente: ${targetMessage.client.firstName} ${targetMessage.client.lastName}` : ''}

Mantieni un tono professionale ma cordiale. Rispondi in italiano.
`;

    const response = await aiService.chat([
      { role: 'system', content: context },
      ...conversationHistory,
    ]);
    
    res.json({
      success: true,
      data: { 
        suggestedResponse: response.content,
        messageId: targetMessage.messageId,
      },
    });
  } catch (error) {
    logger.error('Generate WhatsApp response error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella generazione della risposta',
    });
  }
};
