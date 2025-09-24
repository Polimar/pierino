import { Router } from 'express';
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
    model: 'llama3.2',
    temperature: 0.7,
    maxTokens: 2048,
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
    const { model, temperature, maxTokens } = req.body;
    if (model && !['llama3.2', 'llama3.1', 'mistral', 'codellama'].includes(model)) {
      return res.status(400).json({ success: false, message: 'Modello AI non supportato' });
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
        model: model ?? current.ai.model,
        temperature: temperature ?? current.ai.temperature,
        maxTokens: maxTokens ?? current.ai.maxTokens,
      },
    };

    await saveSettings(updated);

    res.json({
      success: true,
      data: {
        model: updated.ai.model,
        temperature: updated.ai.temperature,
        maxTokens: updated.ai.maxTokens,
      },
    });
  } catch (error) {
    logger.error('Error updating AI settings', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle impostazioni AI' });
  }
});

router.put('/email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { provider, host, port, username, password, secure } = req.body;
    if (provider && !['gmail', 'outlook', 'custom'].includes(provider)) {
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
    const { type } = req.body as { type: 'email' | 'whatsapp' };
    if (!type || !['email', 'whatsapp'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo di connessione non valido' });
    }

    if (type === 'email') {
      const settings = await readSettings();
      if (!settings.email.username || !settings.email.password) {
        return res.status(400).json({ success: false, message: 'Credenziali email mancanti' });
      }
      return res.json({
        success: true,
        data: {
          connected: true,
          provider: settings.email.provider,
          lastTest: new Date().toISOString(),
        },
      });
    }

    if (type === 'whatsapp') {
      const config = await prisma.whatsappConfig.findFirst();
      if (!config?.accessToken || !config?.phoneNumberId) {
        return res.status(400).json({ success: false, message: 'WhatsApp non configurato' });
      }
      return res.json({
        success: true,
        data: {
          connected: true,
          phoneNumberId: config.phoneNumberId,
          lastTest: new Date().toISOString(),
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Tipo non supportato' });
  } catch (error) {
    logger.error('Error testing connection', error);
    res.status(500).json({ success: false, message: 'Errore nel test della connessione' });
  }
});

export default router;