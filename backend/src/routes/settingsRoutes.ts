import { Router } from 'express';
import axios from 'axios';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('SettingsRoutes');
const router = Router();

type AppSettings = {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
    prompt: string;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    documentsEnabled: boolean;
    autoReply: boolean;
    businessHoursEnabled: boolean;
    businessHoursStart: string;
    businessHoursEnd: string;
    businessHoursTimezone: string;
    maxContextMessages: number;
  };
  aiTimeouts: {
    whatsapp: number;
    email: number;
    documents: number;
    general: number;
    calendar: number;
    practices: number;
  };
  email: {
    provider: string;
    host: string;
    port: number;
    username: string;
    password: string;
    secure: boolean;
  };
  general: {
    companyName: string;
    timezone: string;
    language: string;
  };
};

const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    model: 'mistral:7b',
    temperature: 0.7,
    maxTokens: 2048,
    prompt: "Sei l'assistente AI di Studio Gori, studio tecnico di geometri. Rispondi in modo professionale, conciso e in italiano.",
    whatsappEnabled: false,
    emailEnabled: false,
    documentsEnabled: false,
    autoReply: false,
    businessHoursEnabled: false,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessHoursTimezone: 'Europe/Rome',
    maxContextMessages: 5,
  },
  aiTimeouts: {
    whatsapp: 60000,      // 60 secondi per WhatsApp
    email: 45000,         // 45 secondi per Email  
    documents: 90000,     // 90 secondi per ricerca documenti
    general: 30000,       // 30 secondi per chat generale
    calendar: 30000,      // 30 secondi per calendario
    practices: 60000,     // 60 secondi per gestione pratiche
  },
  email: {
    provider: 'gmail',
    host: '',
    port: 465,
    username: '',
    password: '',
    secure: true,
  },
  general: {
    companyName: 'Studio Gori',
    timezone: 'Europe/Rome',
    language: 'it',
  },
};

async function getSettingsRecord() {
  const existing = await prisma.setting.findUnique({ where: { key: 'app:base' } });
  if (existing) {
    return existing;
  }

  return prisma.setting.create({
    data: {
      key: 'app:base',
      value: JSON.stringify(DEFAULT_SETTINGS),
      description: 'Impostazioni generali applicazione',
    },
  });
}

async function readSettings(): Promise<AppSettings> {
  const record = await getSettingsRecord();
  if (!record.value) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(record.value) as Partial<AppSettings>;
    return {
      ai: {
        ...DEFAULT_SETTINGS.ai,
        ...(parsed.ai ?? {}),
      },
      aiTimeouts: {
        ...DEFAULT_SETTINGS.aiTimeouts,
        ...(parsed.aiTimeouts ?? {}),
      },
      email: {
        ...DEFAULT_SETTINGS.email,
        ...(parsed.email ?? {}),
      },
      general: {
        ...DEFAULT_SETTINGS.general,
        ...(parsed.general ?? {}),
      },
    };
  } catch (error) {
    logger.error('Invalid settings JSON, falling back to defaults', error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: AppSettings) {
  await prisma.setting.upsert({
    where: { key: 'app:base' },
    update: {
      value: JSON.stringify(settings),
    },
    create: {
      key: 'app:base',
      value: JSON.stringify(settings),
      description: 'Impostazioni generali applicazione',
    },
  });
}

router.get('/', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const settings = await readSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Error fetching settings', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero delle impostazioni' });
  }
});

router.put('/general', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { companyName, timezone, language } = req.body;
    if (language && !['it', 'en', 'fr', 'de', 'es'].includes(language)) {
      return res.status(400).json({ success: false, message: 'Lingua non supportata' });
    }

    const current = await readSettings();
    const updated: AppSettings = {
      ...current,
      general: {
        companyName: companyName ?? current.general.companyName,
        timezone: timezone ?? current.general.timezone,
        language: language ?? current.general.language,
      },
    };

    await saveSettings(updated);

    res.json({
      success: true,
      data: {
        companyName: updated.general.companyName,
        timezone: updated.general.timezone,
        language: updated.general.language,
      },
    });
  } catch (error) {
    logger.error('Error updating general settings', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni generali' });
  }
});

router.put('/ai', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      model, 
      temperature, 
      maxTokens,
      prompt,
      whatsappEnabled,
      emailEnabled,
      documentsEnabled,
      autoReply,
      businessHoursEnabled,
      businessHoursStart,
      businessHoursEnd,
      businessHoursTimezone,
      maxContextMessages
    } = req.body;
    
    // Valida modello contro i modelli disponibili in Ollama
    if (model) {
      try {
        const modelsResponse = await axios.get('http://ollama:11434/api/tags');
        const availableModels = modelsResponse.data.models?.map((m: any) => m.name) || [];
        
        if (!availableModels.includes(model)) {
          return res.status(400).json({ 
            success: false, 
            message: `Modello AI non supportato. Modelli disponibili: ${availableModels.join(', ')}` 
          });
        }
      } catch (ollamaError) {
        console.warn('Could not validate model against Ollama, accepting any model');
      }
    }
    if (typeof temperature === 'number' && (temperature < 0 || temperature > 2)) {
      return res.status(400).json({ success: false, message: 'Temperature deve essere tra 0 e 2' });
    }
    if (typeof maxTokens === 'number' && (maxTokens < 100 || maxTokens > 8192)) {
      return res.status(400).json({ success: false, message: 'MaxTokens deve essere tra 100 e 8192' });
    }

    const current = await readSettings();
    const updated: AppSettings = {
      ...current,
      ai: {
        ...current.ai,
        model: model ?? current.ai.model,
        temperature: temperature ?? current.ai.temperature,
        maxTokens: maxTokens ?? current.ai.maxTokens,
        prompt: prompt ?? current.ai.prompt,
        whatsappEnabled: whatsappEnabled ?? current.ai.whatsappEnabled,
        emailEnabled: emailEnabled ?? current.ai.emailEnabled,
        documentsEnabled: documentsEnabled ?? current.ai.documentsEnabled,
        autoReply: autoReply ?? current.ai.autoReply,
        businessHoursEnabled: businessHoursEnabled ?? current.ai.businessHoursEnabled,
        businessHoursStart: businessHoursStart ?? current.ai.businessHoursStart,
        businessHoursEnd: businessHoursEnd ?? current.ai.businessHoursEnd,
        businessHoursTimezone: businessHoursTimezone ?? current.ai.businessHoursTimezone,
        maxContextMessages: maxContextMessages ?? current.ai.maxContextMessages,
      },
    };

    await saveSettings(updated);

    res.json({
      success: true,
      data: updated.ai,
    });
  } catch (error) {
    logger.error('Error updating AI settings', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni AI' });
  }
});

// AI Timeouts endpoint
router.put('/ai-timeouts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { whatsapp, email, documents, general, calendar, practices } = req.body;

    // Validazione timeout (5s - 5min per tutti i servizi)
    const timeouts = { whatsapp, email, documents, general, calendar, practices };
    for (const [service, timeout] of Object.entries(timeouts)) {
      if (timeout && (timeout < 5000 || timeout > 300000)) {
        return res.status(400).json({ 
          success: false, 
          message: `Timeout per ${service} deve essere tra 5000ms (5s) e 300000ms (5min)` 
        });
      }
    }

    const current = await readSettings();
    const updated: AppSettings = {
      ...current,
      aiTimeouts: {
        ...current.aiTimeouts,
        whatsapp: whatsapp ?? current.aiTimeouts.whatsapp,
        email: email ?? current.aiTimeouts.email,
        documents: documents ?? current.aiTimeouts.documents,
        general: general ?? current.aiTimeouts.general,
        calendar: calendar ?? current.aiTimeouts.calendar,
        practices: practices ?? current.aiTimeouts.practices,
      },
    };

    await saveSettings(updated);
    res.json({ success: true, message: 'Timeout AI aggiornati', data: updated.aiTimeouts });
  } catch (error: any) {
    logger.error('Update AI timeouts error:', error.message || error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { provider, host, port, username, password, secure } = req.body;
    if (provider && !['gmail', 'outlook', 'custom', 'local'].includes(provider)) {
      return res.status(400).json({ success: false, message: 'Provider email non supportato' });
    }

    const current = await readSettings();
    const updated: AppSettings = {
      ...current,
      email: {
        provider: provider ?? current.email.provider,
        host: host ?? current.email.host,
        port: port ?? current.email.port,
        username: username ?? current.email.username,
        password: password ?? current.email.password,
        secure: typeof secure === 'boolean' ? secure : current.email.secure,
      },
    };

    await saveSettings(updated);

    res.json({
      success: true,
      data: {
        provider: updated.email.provider,
        host: updated.email.host,
        port: updated.email.port,
        username: updated.email.username,
        secure: updated.email.secure,
      },
    });
  } catch (error) {
    logger.error('Error updating email settings', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni email' });
  }
});

router.post('/test-connection', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    
    if (type === 'email') {
      const { emailService } = require('../services/emailService');
      const isConnected = await emailService.testConnection();
      
      if (isConnected) {
        res.json({ 
          success: true, 
          message: 'Connessione email testata con successo!' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Test connessione email fallito. Verifica le configurazioni.' 
        });
      }
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Tipo di test non supportato' 
      });
    }
  } catch (error) {
    logger.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Errore nel test di connessione' 
    });
  }
});

export default router;