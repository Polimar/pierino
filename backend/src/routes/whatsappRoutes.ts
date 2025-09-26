import { Router } from 'express';
import { authenticateToken, requireAdmin, type AuthRequest } from '../middleware/auth';
import { whatsappBusinessService } from '../services/whatsappBusinessService';

const router = Router();

// Webhook verification (GET)
router.get('/webhook', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe') {
    const result = await whatsappBusinessService.verifyWebhook(token, challenge);
    if (result) return res.status(200).send(result);
    return res.status(403).send('Forbidden');
  }

  return res.status(400).send('Bad Request');
});

router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook POST received:', JSON.stringify(req.body, null, 2));
    await whatsappBusinessService.processWebhook(req.body);
    console.log('Webhook processed successfully');
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// STATUS & CONFIG
router.get('/status', authenticateToken, async (_req, res) => {
  try {
    const status = await whatsappBusinessService.getStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/config', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const config = await whatsappBusinessService.getConfig();
    if (!config) return res.json({ success: true, data: null });

    const safeConfig = {
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      appId: config.appId,
      webhookVerifyToken: config.webhookVerifyToken,
      aiEnabled: config.aiEnabled,
      aiModel: config.aiModel,
      autoReply: config.autoReply,
      businessHours: {
        enabled: config.businessHoursEnabled,
        start: config.businessHoursStart,
        end: config.businessHoursEnd,
        timezone: config.businessHoursTimezone,
      },
      aiPrompt: config.aiPrompt,
      maxContextMessages: config.maxContextMessages,
    };

    res.json({ success: true, data: safeConfig });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await whatsappBusinessService.updateConfig(req.body);
    res.json({ success: true, message: 'Configurazione aggiornata' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CONVERSATIONS & MESSAGES
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Utente non autenticato' });
    }
    const conversations = await whatsappBusinessService.getConversations(authReq.user);
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const messages = await whatsappBusinessService.getConversationMessages(id, limit);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/conversations/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    await whatsappBusinessService.assignConversation(id, userId || null);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ success: false, message: 'to e text richiesti' });
    }

    const authReq = req as AuthRequest;
    const message = await whatsappBusinessService.sendMessage(to, text, authReq.user ?? null);
    res.json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE CONVERSATION
router.delete('/conversations/:conversationId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    await whatsappBusinessService.deleteConversation(conversationId);
    res.json({ success: true, message: 'Conversazione eliminata con successo' });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// UTILITIES
router.post('/test-connection', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const result = await whatsappBusinessService.testConnection();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/test-ai', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const result = await whatsappBusinessService.testAI();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/generate-token', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const newToken = await whatsappBusinessService.regenerateWebhookToken();
    res.json({ success: true, data: { token: newToken } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/models', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const models = await whatsappBusinessService.getAvailableModels();
    res.json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/pull-model', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { modelName } = req.body;
    if (!modelName) {
      return res.status(400).json({ success: false, message: 'modelName richiesto' });
    }
    const result = await whatsappBusinessService.pullModel(modelName);
    res.json({ success: result.success, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
