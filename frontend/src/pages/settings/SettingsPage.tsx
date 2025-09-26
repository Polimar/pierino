import { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon,
  Brain,
  MessageCircle,
  Mail,
  Globe,
  Save,
  TestTube,
  RefreshCw,
  Bot,
  Zap,
  Key,
  Copy,
  Eye,
  EyeOff,
  Calendar,
  BookOpen,
  Inbox,
  Users,
  Clock,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface BaseSettings {
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
    provider: 'gmail' | 'outlook' | 'custom' | 'local';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    secure: boolean;
  };
  general: {
    companyName: string;
    timezone: string;
    language: string;
  };
}

interface WhatsAppStatus {
  configured: boolean;
  aiEnabled: boolean;
  autoReply: boolean;
  model: string | null;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  } | null;
  webhookToken: string;
  webhookUrl: string;
}

interface WhatsAppConfigForm {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  aiEnabled: boolean;
  aiModel: string;
  autoReply: boolean;
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessHoursTimezone: string;
  aiPrompt: string;
  maxContextMessages: number;
}

type SettingsSection =
  | 'overview'
  | 'general'
  | 'ai-core'
  | 'whatsapp'
  | 'email'
  | 'clients'
  | 'practices'
  | 'calendar'
  | 'documents'
  | 'ai-timeouts';

const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfigForm = {
  accessToken: '',
  phoneNumberId: '',
  webhookVerifyToken: '',
  businessAccountId: '',
  appId: '',
  appSecret: '',
  aiEnabled: false,
  aiModel: 'mistral:7b',
  autoReply: false,
  businessHoursEnabled: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  businessHoursTimezone: 'Europe/Rome',
  aiPrompt:
    "Sei l'assistente AI di Studio Gori, studio tecnico di geometri. Rispondi in modo professionale, conciso e in italiano.",
  maxContextMessages: 5,
};

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
  const [baseSettings, setBaseSettings] = useState<BaseSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfigForm>(DEFAULT_WHATSAPP_CONFIG);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState({ accessToken: false, appSecret: false });
  const [testResults, setTestResults] = useState<{ connection?: string; ai?: string }>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [pullingModel, setPullingModel] = useState<string | null>(null);

  useEffect(() => {
    void loadBaseSettings();
    void loadWhatsAppData();
    void loadAIModels();
  }, []);

  const withToken = useMemo(
    () => (init?: RequestInit) => {
      const token = localStorage.getItem('accessToken');
      return {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      } satisfies RequestInit;
    },
    []
  );

  async function loadBaseSettings() {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/settings', withToken());
      const data = await response.json();
      if (data.success) {
        setBaseSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Errore nel recupero delle impostazioni.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadWhatsAppData() {
    try {
      setWhatsappLoading(true);
      const [statusRes, configRes, modelsRes] = await Promise.all([
        fetch('/api/whatsapp/status', withToken()),
        fetch('/api/whatsapp/config', withToken()),
        fetch('/api/whatsapp/models', withToken()),
      ]);

      const statusJson = await statusRes.json();
      if (statusJson.success) {
        setWhatsappStatus(statusJson.data);
      }

      const configJson = await configRes.json();
      if (configJson.success) {
        const safe = configJson.data || {};
        setWhatsappConfig((prev) => ({
          ...prev,
          phoneNumberId: safe.phoneNumberId || '',
          businessAccountId: safe.businessAccountId || '',
          appId: safe.appId || '',
          webhookVerifyToken: safe.webhookVerifyToken || prev.webhookVerifyToken,
          aiEnabled: safe.aiEnabled ?? prev.aiEnabled,
          aiModel: safe.aiModel || prev.aiModel,
          autoReply: safe.autoReply ?? prev.autoReply,
          businessHoursEnabled: safe.businessHours?.enabled ?? prev.businessHoursEnabled,
          businessHoursStart: safe.businessHours?.start || prev.businessHoursStart,
          businessHoursEnd: safe.businessHours?.end || prev.businessHoursEnd,
          businessHoursTimezone:
            safe.businessHours?.timezone || prev.businessHoursTimezone,
          aiPrompt: safe.aiPrompt || prev.aiPrompt,
          maxContextMessages: safe.maxContextMessages || prev.maxContextMessages,
        }));
      }

      const modelsJson = await modelsRes.json();
      if (modelsJson.success) {
        setAvailableModels(modelsJson.data || []);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error);
      toast.error('Errore nel recupero delle impostazioni WhatsApp.');
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function loadAIModels() {
    try {
      const response = await fetch('/api/ai/models', withToken());
      const data = await response.json();
      if (data.success) {
        setAvailableModels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching AI models:', error);
      // Fallback models
      setAvailableModels(['mistral:7b']);
    }
  }

  async function pullAIModel(modelName: string) {
    try {
      setPullingModel(modelName);
      const response = await fetch('/api/ai/pull-model', withToken({
        method: 'POST',
        body: JSON.stringify({ modelName }),
      }));
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await loadAIModels(); // Reload models after successful pull
      } else {
        toast.error(data.message || 'Errore nel download del modello');
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      toast.error('Errore nel download del modello');
    } finally {
      setPullingModel(null);
    }
  }

  async function handleSave(section: string, payload: any) {
    setSavingKey(section);
    try {
      const response = await fetch(`/api/settings/${section}`, withToken({
        method: 'PUT',
        body: JSON.stringify(payload),
      }));
      const data = await response.json();
      if (data.success) {
        toast.success('Impostazioni salvate!');
        await loadBaseSettings();
      } else {
        toast.error(data.message || 'Errore nel salvataggio.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Errore nel salvataggio delle impostazioni.');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveAITimeouts(payload: BaseSettings['aiTimeouts']) {
    setSavingKey('ai-timeouts');
    try {
      const response = await fetch('/api/settings/ai-timeouts', withToken({
        method: 'PUT',
        body: JSON.stringify(payload),
      }));
      const data = await response.json();
      if (data.success) {
        toast.success('Timeout AI aggiornati!');
        await loadBaseSettings();
      } else {
        toast.error(data.message || 'Errore nel salvataggio timeout.');
      }
    } catch (error) {
      console.error('Error saving AI timeouts:', error);
      toast.error('Errore nel salvataggio dei timeout AI.');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveWhatsAppConfig(partial?: Partial<WhatsAppConfigForm>) {
    setWhatsappLoading(true);
    try {
      const merged = { ...whatsappConfig, ...(partial || {}) };
      const response = await fetch('/api/whatsapp/config', withToken({
        method: 'POST',
        body: JSON.stringify(merged),
      }));
      const data = await response.json();
      if (data.success) {
        toast.success('Configurazione WhatsApp aggiornata!');
        setWhatsappConfig(merged);
        await loadWhatsAppData();
      } else {
        toast.error(data.message || 'Errore durante il salvataggio della configurazione WhatsApp.');
      }
    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      toast.error('Errore durante il salvataggio della configurazione WhatsApp.');
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function testWhatsappConnection() {
    setWhatsappLoading(true);
    try {
      const response = await fetch('/api/whatsapp/test-connection', withToken({ method: 'POST' }));
      const data = await response.json();
      if (data.success) {
        toast.success(data.data?.message || 'Test connessione riuscito!');
        setTestResults((prev) => ({ ...prev, connection: data.data?.message }));
      } else {
        toast.error(data.message || 'Test connessione fallito');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Errore durante il test della connessione');
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function testWhatsappAI() {
    setWhatsappLoading(true);
    try {
      const response = await fetch('/api/whatsapp/test-ai', withToken({ method: 'POST' }));
      const data = await response.json();
      if (data.success) {
        toast.success(data.data?.message || 'Test AI riuscito!');
        setTestResults((prev) => ({ ...prev, ai: data.data?.message }));
      } else {
        toast.error(data.message || 'Test AI fallito');
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      toast.error('Errore durante il test AI');
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function generateWebhookToken() {
    setWhatsappLoading(true);
    try {
      const response = await fetch('/api/whatsapp/generate-token', withToken({ method: 'POST' }));
      const data = await response.json();
      if (data.success) {
        setWhatsappConfig((prev) => ({
          ...prev,
          webhookVerifyToken: data.data?.token || prev.webhookVerifyToken,
        }));
        toast.success('Nuovo webhook token generato!');
      } else {
        toast.error(data.message || 'Errore nella generazione del token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error('Errore nella generazione del token');
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function pullModel(modelName: string) {
    if (!modelName) return;
    setWhatsappLoading(true);
    try {
      const response = await fetch('/api/ai/pull-model', withToken({
        method: 'POST',
        body: JSON.stringify({ modelName }),
      }));
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Modello scaricato con successo!');
        await loadAIModels(); // Update AI models instead of WhatsApp data
      } else {
        toast.error(data.message || 'Errore nel download del modello');
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      toast.error('Errore nel download del modello');
    } finally {
      setWhatsappLoading(false);
    }
  }

  const sections: Array<{
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Panoramica',
        icon: <SettingsIcon className="h-4 w-4" />,
        description: 'Riepilogo impostazioni principali',
      },
      {
        id: 'general',
        label: 'Generali',
        icon: <Globe className="h-4 w-4" />,
        description: 'Nome studio, fuso orario, lingua',
      },
      {
        id: 'ai-core',
        label: 'AI Core',
        icon: <Brain className="h-4 w-4" />,
        description: 'Impostazioni modelli AI globali',
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: <MessageCircle className="h-4 w-4" />,
        description: 'Configurazione WhatsApp Business e AI',
      },
      {
        id: 'email',
        label: 'Email',
        icon: <Mail className="h-4 w-4" />,
        description: 'SMTP/IMAP e provider email',
      },
      {
        id: 'clients',
        label: 'Clienti',
        icon: <Users className="h-4 w-4" />,
        description: 'Parametri gestione clienti (presto)',
      },
      {
        id: 'practices',
        label: 'Pratiche',
        icon: <BookOpen className="h-4 w-4" />,
        description: 'Workflow pratiche e checklist (presto)',
      },
      {
        id: 'calendar',
        label: 'Calendario',
        icon: <Calendar className="h-4 w-4" />,
        description: 'Sincronizzazioni agenda (presto)',
      },
      {
        id: 'documents',
        label: 'Documenti',
        icon: <Inbox className="h-4 w-4" />,
        description: 'Storage documenti e OCR (presto)',
      },
      {
        id: 'ai-timeouts',
        label: 'AI Timeouts',
        icon: <Clock className="h-4 w-4" />,
        description: 'Gestisci timeout per ogni servizio AI',
      },
    ],
    []
  );

  if (settingsLoading && !baseSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Caricamento impostazioni...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Impostazioni di Studio Gori</h1>
                <p className="text-sm text-gray-500">
                  Configura tutte le integrazioni e i moduli del gestionale
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection(section.id)}
              >
                <span className="mr-2 flex items-center gap-2">
                  {section.icon}
                  <span>{section.label}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
        </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {activeSection === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>Panoramica Rapida</CardTitle>
              <CardDescription>Stato dei principali moduli del sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatusTile
                title="WhatsApp Business"
                status={whatsappStatus?.configured ? 'OK' : 'Configura'}
                description={
                  whatsappStatus?.configured
                    ? 'Integrazione attiva'
                    : 'Completa la configurazione'
                }
              />
              <StatusTile
                title="AI Risposte"
                status={whatsappStatus?.aiEnabled ? 'Attiva' : 'Spenta'}
                description={
                  whatsappStatus?.aiEnabled
                    ? `Modello: ${whatsappStatus.model}`
                    : 'Ai disattivata'
                }
              />
              <StatusTile
                title="Email"
                status={(baseSettings?.email.username && baseSettings.email.password) ? 'OK' : 'Configura'}
                description="SMTP/IMAP"
              />
            </CardContent>
          </Card>
        )}

        {activeSection === 'general' && baseSettings && (
          <GeneralSettingsSection
            settings={baseSettings}
            savingKey={savingKey}
            onSave={(payload) => handleSave('general', payload)}
          />
        )}

        {activeSection === 'ai-core' && baseSettings && (
          <AICoreSettingsSection
            settings={baseSettings}
            models={availableModels}
            savingKey={savingKey}
            onSave={(payload) => handleSave('ai', payload)}
            onPullModel={pullAIModel}
            pullingModel={pullingModel}
          />
        )}

        {activeSection === 'whatsapp' && (
          <WhatsAppSettingsSection
            config={whatsappConfig}
            status={whatsappStatus}
            models={availableModels}
            loading={whatsappLoading}
            showSecrets={showSecrets}
            setShowSecrets={setShowSecrets}
            testResults={testResults}
            onConfigChange={setWhatsappConfig}
            onSave={saveWhatsAppConfig}
            onRefresh={loadWhatsAppData}
            onTestConnection={testWhatsappConnection}
            onTestAI={testWhatsappAI}
            onGenerateToken={generateWebhookToken}
            onPullModel={pullModel}
          />
        )}

        {activeSection === 'email' && baseSettings && (
          <EmailSettingsSection
            settings={baseSettings}
            savingKey={savingKey}
            testingKey={savingKey === 'email' ? 'email' : null}
            onSave={(payload) => handleSave('email', payload)}
            onTest={() => handleTestEmail()}
          />
        )}

        {activeSection === 'clients' && <PlaceholderCard icon={<Users className="h-8 w-8" />} title="Impostazioni Clienti" />} 
        {activeSection === 'practices' && <PlaceholderCard icon={<BookOpen className="h-8 w-8" />} title="Impostazioni Pratiche" />} 
        {activeSection === 'calendar' && <PlaceholderCard icon={<Calendar className="h-8 w-8" />} title="Calendario e Agenda" />} 
        {activeSection === 'documents' && <PlaceholderCard icon={<Inbox className="h-8 w-8" />} title="Gestione Documenti" />} 
        {activeSection === 'ai-timeouts' && baseSettings && (
          <AITimeoutsSection
            settings={baseSettings}
            savingKey={savingKey}
            onSave={handleSaveAITimeouts}
          />
        )} 
      </main>
            </div>
  );

  async function handleTestEmail() {
    try {
      setSavingKey('email:test');
      const response = await fetch('/api/settings/test-connection', withToken({
        method: 'POST',
        body: JSON.stringify({ type: 'email' }),
      }));
      const data = await response.json();
      if (data.success) {
        toast.success('Test email completato con successo!');
      } else {
        toast.error(data.message || 'Errore nel test email');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('Errore nel test email');
    } finally {
      setSavingKey(null);
    }
  }
};

export default SettingsPage;

// ---------------------------------------------
// Helper Components
// ---------------------------------------------

function StatusTile({
  title,
  status,
  description,
}: {
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <div className="text-xs uppercase text-gray-400">{title}</div>
      <div className="text-lg font-semibold text-gray-900">{status}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}

function GeneralSettingsSection({
  settings,
  savingKey,
  onSave,
}: {
  settings: BaseSettings;
  savingKey: string | null;
  onSave: (payload: BaseSettings['general']) => Promise<void>;
}) {
  const [form, setForm] = useState(settings.general);

  useEffect(() => {
    setForm(settings.general);
  }, [settings.general]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Generali</CardTitle>
        <CardDescription>Informazioni dello studio e preferenze principali.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Nome Studio</Label>
          <Input
            value={form.companyName}
            onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="Studio Gori"
          />
        </div>
        <div className="space-y-2">
          <Label>Fuso Orario</Label>
          <Input
            value={form.timezone}
            onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
            placeholder="Europe/Rome"
          />
        </div>
        <div className="space-y-2">
          <Label>Lingua</Label>
          <Select
            value={form.language}
            onValueChange={(value) => setForm((prev) => ({ ...prev, language: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Française</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
              </div>
      </CardContent>
      <CardContent>
        <Button
          onClick={() => onSave(form)}
          disabled={savingKey === 'general'}
          className="bg-gray-800 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {savingKey === 'general' ? 'Salvando...' : 'Salva'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AICoreSettingsSection({
  settings,
  models,
  savingKey,
  onSave,
  onPullModel,
  pullingModel,
}: {
  settings: BaseSettings;
  models: string[];
  savingKey: string | null;
  onSave: (payload: BaseSettings['ai']) => Promise<void>;
  onPullModel: (modelName: string) => Promise<void>;
  pullingModel: string | null;
}) {
  const [form, setForm] = useState(settings.ai);
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    setForm(settings.ai);
  }, [settings.ai]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configurazione AI Principale
          </CardTitle>
          <CardDescription>
            Gestisci modelli, parametri e risposte automatiche per tutti i servizi dello studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modello e parametri */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Modello AI</Label>
              <Select value={form.model} onValueChange={(value) => setForm((prev) => ({ ...prev, model: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona modello" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temperature ({form.temperature.toFixed(1)})</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={form.maxTokens}
                onChange={(e) => setForm((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
              />
            </div>
          </div>

          {/* Prompt personalizzato */}
          <div className="space-y-2">
            <Label>Prompt AI Personalizzato</Label>
            <Textarea
              value={form.prompt}
              onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="Sei l'assistente AI di Studio Gori..."
              rows={4}
            />
          </div>

          {/* Risposte automatiche per servizi */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Risposte Automatiche</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <Switch
                    checked={form.whatsappEnabled}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, whatsappEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Switch
                    checked={form.emailEnabled}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, emailEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Documenti
                  </Label>
                  <Switch
                    checked={form.documentsEnabled}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, documentsEnabled: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Orari di Lavoro</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Abilita orari di lavoro</Label>
                  <Switch
                    checked={form.businessHoursEnabled}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, businessHoursEnabled: checked }))}
                  />
                </div>
                {form.businessHoursEnabled && (
                  <>
                    <div className="grid gap-2 grid-cols-2">
                      <div>
                        <Label className="text-xs">Dalle</Label>
                        <Input
                          type="time"
                          value={form.businessHoursStart}
                          onChange={(e) => setForm((prev) => ({ ...prev, businessHoursStart: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Alle</Label>
                        <Input
                          type="time"
                          value={form.businessHoursEnd}
                          onChange={(e) => setForm((prev) => ({ ...prev, businessHoursEnd: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Fuso orario</Label>
                      <Select
                        value={form.businessHoursTimezone}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, businessHoursTimezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Rome">Europa/Roma</SelectItem>
                          <SelectItem value="Europe/London">Europa/Londra</SelectItem>
                          <SelectItem value="America/New_York">America/New York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={() => onSave(form)}
            disabled={savingKey === 'ai'}
            className="w-fit"
          >
            {savingKey === 'ai' ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salva configurazione AI
          </Button>
        </CardContent>
      </Card>

      {/* Download nuovi modelli */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Modelli</CardTitle>
          <CardDescription>
            Scarica nuovi modelli AI da Ollama o gestisci quelli esistenti.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome modello (es: llama3.1:8b)"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (newModelName.trim()) {
                  onPullModel(newModelName.trim());
                  setNewModelName('');
                }
              }}
              disabled={!newModelName.trim() || !!pullingModel}
            >
              {pullingModel === newModelName ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Scarica
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Modelli disponibili:</strong> {models.join(', ')}</p>
            <p className="mt-1">
              <strong>Suggeriti:</strong> mistral:7b, llama3.1:8b, codellama:7b, phi3:mini
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WhatsAppSettingsSection({
  config,
  status,
  models,
  loading,
  showSecrets,
  setShowSecrets,
  testResults,
  onConfigChange,
  onSave,
  onRefresh,
  onTestConnection,
  onTestAI,
  onGenerateToken,
  onPullModel,
}: {
  config: WhatsAppConfigForm;
  status: WhatsAppStatus | null;
  models: string[];
  loading: boolean;
  showSecrets: { accessToken: boolean; appSecret: boolean };
  setShowSecrets: (value: { accessToken: boolean; appSecret: boolean }) => void;
  testResults: { connection?: string; ai?: string };
  onConfigChange: (value: WhatsAppConfigForm | ((prev: WhatsAppConfigForm) => WhatsAppConfigForm)) => void;
  onSave: (partial?: Partial<WhatsAppConfigForm>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onTestConnection: () => Promise<void>;
  onTestAI: () => Promise<void>;
  onGenerateToken: () => Promise<void>;
  onPullModel: (modelName: string) => Promise<void>;
}) {

  return (
    <Card>
      <CardHeader className="space-y-2 lg:flex lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <CardTitle>Configurazione WhatsApp Business</CardTitle>
          <CardDescription>
            Gestisci OAuth Facebook, API Graph, webhook e risposte AI per WhatsApp Business.
          </CardDescription>
            </div>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Aggiorna stato
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {status && (
          <div className="grid gap-4 md:grid-cols-4">
            <StatusTile
              title="Configurazione"
              status={status.configured ? 'Pronta' : 'Da completare'}
              description={status.configured ? 'Access Token e numero configurati' : 'Configura OAuth e API'}
            />
            <StatusTile
              title="AI"
              status={status.aiEnabled ? `Attiva (${status.model})` : 'Spenta'}
              description={status.aiEnabled ? 'L AI risponde alle chat' : 'Risposte manuali'}
            />
            <StatusTile
              title="Auto Reply"
              status={status.autoReply ? 'Attiva' : 'Manuale'}
              description={status.autoReply ? 'Le richieste ricevono risposta' : 'Solo operatori'}
            />
            <StatusTile
              title="Webhook"
              status={status.webhookToken ? 'Configurato' : 'Assente'}
              description="Token di verifica per Facebook"
            />
              </div>
        )}

        <Tabs defaultValue="oauth" className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Key className="h-4 w-4" /> OAuth Config
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> API Config
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Webhook
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" /> AI & Modelli
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Test & Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="pt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>App ID (Client ID)</Label>
                    <Input
                  value={config.appId}
                  onChange={(e) => onConfigChange({ ...config, appId: e.target.value })}
                  placeholder="1721754479217300"
                  required
                    />
                  </div>
              <div className="space-y-2">
                <Label>Business Account ID</Label>
                    <Input
                  value={config.businessAccountId}
                  onChange={(e) => onConfigChange({ ...config, businessAccountId: e.target.value })}
                  placeholder="1192859498811556"
                  required
                    />
                  </div>
                </div>
            <div className="space-y-2">
              <Label>App Secret</Label>
              <div className="relative">
                <Input
                  type={showSecrets.appSecret ? 'text' : 'password'}
                  value={config.appSecret}
                  onChange={(e) => onConfigChange({ ...config, appSecret: e.target.value })}
                  placeholder="App Secret da Facebook Developers"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1"
                  onClick={() => setShowSecrets({ ...showSecrets, appSecret: !showSecrets.appSecret })}
                >
                  {showSecrets.appSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button disabled={loading} onClick={() => onSave()}>
              <Save className="h-4 w-4 mr-2" /> Salva OAuth
            </Button>
          </TabsContent>

          <TabsContent value="api" className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="relative">
                <Input
                  type={showSecrets.accessToken ? 'text' : 'password'}
                  value={config.accessToken}
                  onChange={(e) => onConfigChange({ ...config, accessToken: e.target.value })}
                  placeholder="Access Token da Facebook"
                />
                  <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1"
                  onClick={() => setShowSecrets({ ...showSecrets, accessToken: !showSecrets.accessToken })}
                >
                  {showSecrets.accessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input
                  value={config.phoneNumberId}
                  onChange={(e) => onConfigChange({ ...config, phoneNumberId: e.target.value })}
                  placeholder="ID del numero WhatsApp Business"
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook Verify Token</Label>
                <div className="flex gap-2">
                  <Input value={config.webhookVerifyToken} readOnly className="bg-muted" />
                  <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(config.webhookVerifyToken)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={onGenerateToken} disabled={loading}>
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={loading} onClick={() => onSave()}>
                <Save className="h-4 w-4 mr-2" /> Salva API Config
              </Button>
              <Button variant="outline" disabled={loading} onClick={onTestConnection}>
                <TestTube className="h-4 w-4 mr-2" /> Test Connessione
              </Button>
            </div>
            {testResults.connection && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {testResults.connection}
              </div>
            )}
          </TabsContent>

          <TabsContent value="webhook" className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input value={status?.webhookUrl || ''} readOnly className="bg-muted" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => status?.webhookUrl && navigator.clipboard.writeText(status.webhookUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Utilizza questo URL nel pannello Facebook Developers per validare il webhook.
              </p>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold">Checklist configurazione Facebook:</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Imposta URL e Verify Token nella sezione Webhook di Facebook.</li>
                <li>Abilita gli eventi <code>messages</code> e <code>messaging_postbacks</code>.</li>
                <li>Pubblica l'app o usa un token a lungo termine.</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="pt-6 space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Configurazione AI Centralizzata</h4>
                  <p className="text-sm text-blue-800">
                    I modelli AI, prompt e configurazioni avanzate sono ora gestiti nella sezione <strong>AI Core</strong>.
                    Le impostazioni qui sono specifiche per WhatsApp Business.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex flex-col gap-1">
                <Label className="flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Abilita risposte automatiche AI per WhatsApp
                </Label>
                <p className="text-xs text-muted-foreground">
                  L'AI risponderà automaticamente ai messaggi WhatsApp utilizzando le impostazioni globali.
                </p>
              </div>
              <Switch
                checked={config.autoReply}
                onCheckedChange={(checked) => onConfigChange({ ...config, autoReply: checked, aiEnabled: checked })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={loading} onClick={() => onSave()}>
                <Save className="h-4 w-4 mr-2" /> Salva impostazioni WhatsApp AI
              </Button>
              <Button variant="outline" disabled={loading} onClick={onTestAI}>
                <TestTube className="h-4 w-4 mr-2" /> Test AI
              </Button>
            </div>
            {testResults.ai && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {testResults.ai}
              </div>
            )}
          </TabsContent>

          <TabsContent value="status" className="pt-6 space-y-4">
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Monitoraggio</CardTitle>
                <CardDescription>Test rapidi e stato operativo.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onTestConnection} disabled={loading}>
                  <TestTube className="h-4 w-4 mr-2" /> Test connessione
                </Button>
                <Button variant="outline" onClick={onTestAI} disabled={loading}>
                  <Bot className="h-4 w-4 mr-2" /> Test AI
                </Button>
                <Button variant="outline" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Aggiorna stato
                </Button>
              </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmailSettingsSection({
  settings,
  savingKey,
  testingKey,
  onSave,
  onTest,
}: {
  settings: BaseSettings;
  savingKey: string | null;
  testingKey: string | null;
  onSave: (payload: BaseSettings['email']) => Promise<void>;
  onTest: () => Promise<void>;
}) {
  const [form, setForm] = useState(settings.email);

  useEffect(() => {
    setForm(settings.email);
  }, [settings.email]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurazione Email</CardTitle>
        <CardDescription>Gestisci provider SMTP/IMAP per invio e ricezione email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provider email</Label>
          <Select
            value={form.provider}
            onValueChange={(value) => setForm((prev) => ({ ...prev, provider: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">🏠 Server Mail Locale (Studio Gori)</SelectItem>
              <SelectItem value="gmail">Gmail</SelectItem>
              <SelectItem value="outlook">Outlook</SelectItem>
              <SelectItem value="custom">Custom SMTP</SelectItem>
            </SelectContent>
          </Select>
            </div>

        {form.provider === 'local' && (
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h4 className="font-medium text-blue-900 mb-2">📧 Server Mail Locale Configurato</h4>
            <p className="text-sm text-blue-800 mb-3">
              Usa uno degli account email predefiniti del server mail locale di Studio Gori:
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                <span className="font-mono">admin@studio-gori.com</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setForm(prev => ({ 
                    ...prev, 
                    username: 'admin@studio-gori.com',
                    host: 'mailserver',
                    port: 587,
                    secure: true
                  }))}
                >
                  Usa questo
                </Button>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                <span className="font-mono">geometra@studio-gori.com</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setForm(prev => ({ 
                    ...prev, 
                    username: 'geometra@studio-gori.com',
                    host: 'mailserver', 
                    port: 587,
                    secure: true
                  }))}
                >
                  Usa questo
                </Button>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                <span className="font-mono">segreteria@studio-gori.com</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setForm(prev => ({ 
                    ...prev, 
                    username: 'segreteria@studio-gori.com',
                    host: 'mailserver',
                    port: 587, 
                    secure: true
                  }))}
                >
                  Usa questo
                </Button>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 Le password sono quelle predefinite. Host: mailserver, Porta: 587 (STARTTLS)
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Username / Email</Label>
                <Input
              type="email"
              value={form.username || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
          <div className="space-y-2">
            <Label>Password / App password</Label>
                <Input
              type="password"
              value={form.password || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
              </div>
        {form.provider === 'custom' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Host SMTP</Label>
              <Input
                value={form.host || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Porta</Label>
              <Input
                type="number"
                value={form.port || 587}
                onChange={(e) => setForm((prev) => ({ ...prev, port: parseInt(e.target.value || '0', 10) }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch
                checked={form.secure}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, secure: checked }))}
              />
              <span className="text-sm text-muted-foreground">Usa SSL/TLS</span>
        </div>
      </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onSave(form)} disabled={savingKey === 'email'}>
            <Save className="h-4 w-4 mr-2" /> {savingKey === 'email' ? 'Salvando...' : 'Salva email'}
          </Button>
          <Button variant="outline" onClick={onTest} disabled={savingKey === 'email:test'}>
            <TestTube className="h-4 w-4 mr-2" /> {savingKey === 'email:test' ? 'Test in corso...' : 'Test connessione'}
          </Button>
    </div>
      </CardContent>
    </Card>
  );
}

function PlaceholderCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Configurazioni dedicate verranno aggiunte in una release successiva.</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

// AI Timeouts Section Component
function AITimeoutsSection({
  settings,
  savingKey,
  onSave,
}: {
  settings: BaseSettings;
  savingKey: string | null;
  onSave: (payload: BaseSettings['aiTimeouts']) => Promise<void>;
}) {
  const [form, setForm] = useState(settings.aiTimeouts);

  useEffect(() => {
    setForm(settings.aiTimeouts);
  }, [settings.aiTimeouts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeout AI per Servizio
        </CardTitle>
        <CardDescription>
          Configura timeout specifici per ogni servizio AI. Tempi più lunghi per operazioni complesse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>WhatsApp AI (secondi)</Label>
            <Input
              type="number"
              min="5"
              max="300"
              value={Math.round(form.whatsapp / 1000)}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: (parseInt(e.target.value) || 60) * 1000 }))}
              placeholder="60"
            />
            <p className="text-xs text-muted-foreground">Timeout per risposte AI WhatsApp</p>
          </div>
          
          <div className="space-y-2">
            <Label>Email AI (secondi)</Label>
            <Input
              type="number"
              min="5"
              max="300"
              value={Math.round(form.email / 1000)}
              onChange={(e) => setForm((prev) => ({ ...prev, email: (parseInt(e.target.value) || 45) * 1000 }))}
              placeholder="45"
            />
            <p className="text-xs text-muted-foreground">Timeout per gestione AI email</p>
          </div>
          
          <div className="space-y-2">
            <Label>Ricerca Documenti (secondi)</Label>
            <Input
              type="number"
              min="5"
              max="300"
              value={Math.round(form.documents / 1000)}
              onChange={(e) => setForm((prev) => ({ ...prev, documents: (parseInt(e.target.value) || 90) * 1000 }))}
              placeholder="90"
            />
            <p className="text-xs text-muted-foreground">Timeout per ricerca AI documenti</p>
          </div>
          
          <div className="space-y-2">
            <Label>Chat Generale (secondi)</Label>
            <Input
              type="number"
              min="5"
              max="300"
              value={Math.round(form.general / 1000)}
              onChange={(e) => setForm((prev) => ({ ...prev, general: (parseInt(e.target.value) || 30) * 1000 }))}
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">Timeout per chat AI generale</p>
          </div>
          
          <div className="space-y-2">
            <Label>Calendario AI (secondi)</Label>
            <Input
              type="number"
              min="5"
              max="300"
              value={Math.round(form.calendar / 1000)}
              onChange={(e) => setForm((prev) => ({ ...prev, calendar: (parseInt(e.target.value) || 30) * 1000 }))}
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">Timeout per operazioni AI calendario</p>
          </div>
          
          <div className="space-y-2">
            <Label>Gestione Pratiche (secondi)</Label>
            <Input
              type="number"
              min="5"
              max="300"
              value={Math.round(form.practices / 1000)}
              onChange={(e) => setForm((prev) => ({ ...prev, practices: (parseInt(e.target.value) || 60) * 1000 }))}
              placeholder="60"
            />
            <p className="text-xs text-muted-foreground">Timeout per AI gestione pratiche</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Linee Guida Timeout</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Chat Generale:</strong> 30s - Risposte rapide</li>
            <li><strong>WhatsApp/Pratiche:</strong> 60s - Analisi contesto e tools</li>
            <li><strong>Ricerca Documenti:</strong> 90s - OCR e ricerca contenuti</li>
            <li><strong>Email:</strong> 45s - Elaborazione allegati</li>
          </ul>
        </div>

        <Button onClick={() => onSave(form)} disabled={savingKey === 'ai-timeouts'} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {savingKey === 'ai-timeouts' ? 'Salvando...' : 'Salva Timeout AI'}
        </Button>
      </CardContent>
    </Card>
  );
}