import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { fileStorage } from '../services/fileStorageService';

const router = Router();

// GET /api/settings - Recupera tutte le impostazioni (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = fileStorage.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero delle impostazioni' });
  }
});

// PUT /api/settings/ai - Aggiorna impostazioni AI
router.put('/ai', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { model, temperature, maxTokens } = req.body;

    if (model && !['llama3.2', 'llama3.1', 'codellama', 'mistral'].includes(model)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Modello AI non supportato' 
      });
    }

    if (temperature && (temperature < 0 || temperature > 2)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Temperature deve essere tra 0 e 2' 
      });
    }

    if (maxTokens && (maxTokens < 100 || maxTokens > 8192)) {
      return res.status(400).json({ 
        success: false, 
        message: 'MaxTokens deve essere tra 100 e 8192' 
      });
    }

    const updatedSettings = fileStorage.updateSettings({
      ai: { model, temperature, maxTokens }
    });

    res.json({ success: true, data: updatedSettings.ai });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni AI' });
  }
});

// PUT /api/settings/whatsapp - Aggiorna impostazioni WhatsApp
router.put('/whatsapp', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { enabled, phoneNumber, apiKey } = req.body;

    if (enabled && (!phoneNumber || !apiKey)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Numero di telefono e API key sono obbligatori quando WhatsApp è abilitato' 
      });
    }

    if (phoneNumber && !/^\+\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato numero di telefono non valido (es: +393331234567)' 
      });
    }

    const updatedSettings = fileStorage.updateSettings({
      whatsapp: { enabled, phoneNumber, apiKey }
    });

    res.json({ success: true, data: updatedSettings.whatsapp });
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni WhatsApp' });
  }
});

// PUT /api/settings/email - Aggiorna impostazioni Email
router.put('/email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { provider, host, port, username, password, secure } = req.body;

    if (provider && !['gmail', 'outlook', 'custom'].includes(provider)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provider email non supportato' 
      });
    }

    if (port && (port < 1 || port > 65535)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Porta non valida' 
      });
    }

    const updatedSettings = fileStorage.updateSettings({
      email: { provider, host, port, username, password, secure }
    });

    res.json({ success: true, data: updatedSettings.email });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni email' });
  }
});

// PUT /api/settings/general - Aggiorna impostazioni generali
router.put('/general', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { companyName, timezone, language } = req.body;

    if (language && !['it', 'en', 'fr', 'de', 'es'].includes(language)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lingua non supportata' 
      });
    }

    const updatedSettings = fileStorage.updateSettings({
      general: { companyName, timezone, language }
    });

    res.json({ success: true, data: updatedSettings.general });
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni generali' });
  }
});

// POST /api/settings/test-connection - Test connessioni (email/whatsapp)
router.post('/test-connection', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['email', 'whatsapp'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo di connessione non valido' 
      });
    }

    const settings = fileStorage.getSettings();

    if (type === 'email') {
      // Simula test connessione email
      const emailSettings = settings.email;
      if (!emailSettings.username || !emailSettings.password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Credenziali email mancanti' 
        });
      }

      // Simula successo (in produzione qui ci sarebbe la logica reale)
      res.json({ 
        success: true, 
        message: 'Connessione email testata con successo',
        data: { connected: true, lastTest: new Date().toISOString() }
      });
    }

    if (type === 'whatsapp') {
      // Simula test connessione WhatsApp
      const whatsappSettings = settings.whatsapp;
      if (!whatsappSettings.enabled || !whatsappSettings.apiKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'WhatsApp non configurato o disabilitato' 
        });
      }

      // Simula successo (in produzione qui ci sarebbe la logica reale)
      res.json({ 
        success: true, 
        message: 'Connessione WhatsApp testata con successo',
        data: { connected: true, lastTest: new Date().toISOString() }
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ success: false, message: 'Errore nel test della connessione' });
  }
});

export default router;