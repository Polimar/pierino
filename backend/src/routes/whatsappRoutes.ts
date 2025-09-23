import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import whatsappBusinessService from '../services/whatsappBusinessService';

const router = Router();

// Webhook verification (GET) - pubblico per Facebook
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe') {
    whatsappBusinessService.verifyWebhook(token as string, challenge as string)
      .then(result => {
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(403).send('Forbidden');
        }
      })
      .catch(() => res.status(500).send('Error'));
  } else {
    res.status(400).send('Bad Request');
  }
});

// Webhook messages (POST) - pubblico per Facebook  
router.post('/webhook', async (req, res) => {
  try {
    await whatsappBusinessService.processWebhook(req.body);
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// GET /api/whatsapp/status - stato configurazione
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await whatsappBusinessService.getStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/whatsapp/config - configurazione attuale
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = whatsappBusinessService.getConfig();
    // Rimuovi dati sensibili
    const safeConfig = config ? {
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      appId: config.appId,
      webhookVerifyToken: config.webhookVerifyToken,
      aiEnabled: config.aiEnabled,
      aiModel: config.aiModel,
      autoReply: config.autoReply,
      businessHours: config.businessHours
    } : null;
    res.json({ success: true, data: safeConfig });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/whatsapp/config - aggiorna configurazione
router.post('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await whatsappBusinessService.updateConfig(req.body);
    res.json({ success: true, message: 'Configurazione aggiornata' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/whatsapp/messages - ultimi messaggi
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { limit } = req.query as any;
    const n = limit ? parseInt(limit, 10) : 50;
    const msgs = await whatsappBusinessService.getMessages(n);
    res.json({ success: true, data: msgs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/whatsapp/send - invia messaggio
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ success: false, message: 'to e text richiesti' });
    }
    const success = await whatsappBusinessService.sendMessage(to, text);
    if (success) {
      res.json({ success: true, message: 'Messaggio inviato' });
    } else {
      res.status(500).json({ success: false, message: 'Errore invio messaggio' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/whatsapp/test-connection - test connessione API
router.post('/test-connection', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await whatsappBusinessService.testConnection();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/whatsapp/test-ai - test AI
router.post('/test-ai', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await whatsappBusinessService.testAI();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/whatsapp/generate-token - genera nuovo webhook token
router.post('/generate-token', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newToken = whatsappBusinessService.generateWebhookToken();
    await whatsappBusinessService.updateConfig({ webhookVerifyToken: newToken });
    res.json({ success: true, data: { token: newToken } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/whatsapp/models - lista modelli Ollama disponibili
router.get('/models', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const models = await whatsappBusinessService.getAvailableModels();
    res.json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/whatsapp/pull-model - scarica nuovo modello Ollama
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

// POST /api/whatsapp/test-webhook - test webhook endpoint
router.post('/test-webhook', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await whatsappBusinessService.testWebhook();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
