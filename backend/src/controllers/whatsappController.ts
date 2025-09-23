import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { whatsappBusinessService } from '../services/whatsappBusinessService';
import { createLogger } from '../utils/logger';

const logger = createLogger('WhatsAppBusinessController');

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const config = whatsappBusinessService.getConfig();
    const status = {
      configured: config && config.accessToken && config.phoneNumberId,
      aiEnabled: config?.aiEnabled || false,
      model: config?.aiModel || 'mistral:7b',
      autoReply: config?.autoReply || false
    };
    
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

export const getConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = whatsappBusinessService.getConfig();
    
    // Non inviare dati sensibili
    const safeConfig = config ? {
      ...config,
      accessToken: config.accessToken ? '***' : '',
      appSecret: config.appSecret ? '***' : ''
    } : null;
    
    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    logger.error('Get WhatsApp config error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della configurazione WhatsApp',
    });
  }
};

export const updateConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = req.body;
    await whatsappBusinessService.updateConfig(config);
    
    res.json({
      success: true,
      message: 'Configurazione WhatsApp aggiornata con successo',
    });
  } catch (error) {
    logger.error('Update WhatsApp config error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione WhatsApp',
    });
  }
};

export const testConnection = async (req: AuthRequest, res: Response) => {
  try {
    const result = await whatsappBusinessService.testConnection();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Test WhatsApp connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel test della connessione WhatsApp',
    });
  }
};

export const testAI = async (req: AuthRequest, res: Response) => {
  try {
    const result = await whatsappBusinessService.testAI();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Test AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel test dell\'AI',
    });
  }
};

export const testWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const result = await whatsappBusinessService.testWebhook();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel test del webhook',
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        success: false,
        message: 'Destinatario e testo sono richiesti',
      });
    }

    const result = await whatsappBusinessService.sendMessage(to, text);
    
    res.json({
      success: true,
      message: 'Messaggio inviato con successo',
      data: result,
    });
  } catch (error) {
    logger.error('Send WhatsApp message error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio del messaggio',
    });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    
    const messages = await whatsappBusinessService.getMessages(
      limit ? parseInt(limit as string) : 50
    );
    
    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Get WhatsApp messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei messaggi',
    });
  }
};

export const getModels = async (req: AuthRequest, res: Response) => {
  try {
    const models = await whatsappBusinessService.getAvailableModels();
    
    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    logger.error('Get AI models error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei modelli AI',
    });
  }
};

export const pullModel = async (req: AuthRequest, res: Response) => {
  try {
    const { modelName } = req.body;

    if (!modelName) {
      return res.status(400).json({
        success: false,
        message: 'Nome del modello richiesto',
      });
    }

    const result = await whatsappBusinessService.pullModel(modelName);
    
    res.json({
      success: true,
      message: 'Download del modello avviato',
      data: result,
    });
  } catch (error) {
    logger.error('Pull model error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel download del modello',
    });
  }
};

// Webhook handlers
export const webhookVerify = async (req: Request, res: Response) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = req.query;
    
    if (mode === 'subscribe') {
      const result = await whatsappBusinessService.verifyWebhook(verifyToken as string, challenge as string);
      
      if (result) {
        res.status(200).send(result);
      } else {
        res.status(403).send('Forbidden');
      }
    } else {
      res.status(400).send('Bad Request');
    }
  } catch (error) {
    logger.error('Webhook verify error:', error);
    res.status(500).send('Internal Server Error');
  }
};

export const webhookReceive = async (req: Request, res: Response) => {
  try {
    await whatsappBusinessService.processWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Webhook receive error:', error);
    res.status(500).send('Internal Server Error');
  }
};