import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Phone, Send, Settings, Bot, Clock, Wifi, WifiOff, 
  CheckCircle, AlertCircle, QrCode, Loader2, MessageCircle, 
  Zap, CalendarClock, RefreshCw, TestTube, Key, Copy, Eye, EyeOff,
  Save, User, Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

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

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  aiEnabled: boolean;
  aiModel: string;
  autoReply: boolean;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  aiPrompt: string;
  maxContextMessages: number;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
  isFromBusiness: boolean;
  processed: boolean;
  aiResponse?: string;
}

export default function WhatsAppPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig>({
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
    aiEnabled: false,
    aiModel: 'mistral:7b',
    autoReply: false,
    businessHours: {
      enabled: false,
      start: '09:00',
      end: '18:00',
      timezone: 'Europe/Rome',
    },
    aiPrompt: `Sei l'assistente AI di Studio Gori, uno studio di geometri professionali che si occupa di pratiche edilizie, catasto, topografia e consulenze tecniche.

RISpondi sempre in modo professionale, cortese e conciso.
Ambiti di competenza: condoni, SCIA, permessi di costruire, catasto, topografia, APE, consulenze tecniche.

Regole:
- Fornisci informazioni accurate e utili
- Se non sai qualcosa, dì che verificherai con un geometra dello studio
- Mantieni un tono professionale ma amichevole
- Rispondi in italiano
- Limita le risposte a 2-3 frasi per essere conciso`,
    maxContextMessages: 5,
  });
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection?: { success: boolean; message: string };
    ai?: { success: boolean; message: string };
  }>({});

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      } else {
        toast.error('Errore nel recupero dello stato WhatsApp.');
      }
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      toast.error('Errore di rete nel recupero dello stato WhatsApp.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setConfig(prev => ({ ...prev, ...data.data }));
        }
      } else {
        toast.error('Errore nel recupero della configurazione WhatsApp.');
      }
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
      toast.error('Errore di rete nel recupero della configurazione WhatsApp.');
    }
  }, [isAdmin]);

  const updateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        toast.success('Configurazione WhatsApp aggiornata con successo!');
        fetchStatus();
      } else {
        toast.error('Errore nell\'aggiornamento della configurazione WhatsApp.');
      }
    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      toast.error('Errore di rete nell\'aggiornamento della configurazione WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({ ...prev, connection: data.data }));
        if (data.data.success) {
          toast.success('Test connessione riuscito!');
        } else {
          toast.error('Test connessione fallito');
        }
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Errore durante il test della connessione');
    } finally {
      setLoading(false);
    }
  };

  const testAI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/test-ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({ ...prev, ai: data.data }));
        if (data.data.success) {
          toast.success('Test AI riuscito!');
        } else {
          toast.error('Test AI fallito');
        }
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      toast.error('Errore durante il test dell\'AI');
    } finally {
      setLoading(false);
    }
  };

  const generateWebhookToken = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/generate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, webhookVerifyToken: data.data.token }));
        toast.success('Nuovo webhook token generato!');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error('Errore durante la generazione del token');
    } finally {
      setLoading(false);
    }
  };

  const pullModel = async (modelName: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/pull-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ modelName }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchStatus(); // Refresh status to get new model
      } else {
        toast.error('Errore durante il download del modello');
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      toast.error('Errore di rete durante il download del modello');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/messages?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
    }
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientNumber || !messageText) {
      toast.warning('Numero destinatario e testo del messaggio sono obbligatori.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ to: recipientNumber, text: messageText }),
      });
      if (response.ok) {
        toast.success('Messaggio inviato con successo!');
        setMessageText('');
        setRecipientNumber('');
        fetchMessages();
      } else {
        toast.error('Errore nell\'invio del messaggio WhatsApp.');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast.error('Errore di rete nell\'invio del messaggio WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti!`);
  };

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchMessages();

    const statusInterval = setInterval(fetchStatus, 30000); // Refresh status every 30 seconds
    const messagesInterval = setInterval(fetchMessages, 15000); // Refresh messages every 15 seconds

    return () => {
      clearInterval(statusInterval);
      clearInterval(messagesInterval);
    };
  }, [fetchStatus, fetchConfig, fetchMessages]);

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-5 w-5 animate-spin text-gray-500" />;
    if (status.configured) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (!status) return 'Caricamento...';
    if (status.configured) return 'Configurato e pronto';
    return 'Non configurato';
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-8 w-8" /> WhatsApp Business
        </h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-amber-600">
              <Shield className="h-5 w-5" />
              <span>Accesso limitato. Solo gli amministratori possono configurare WhatsApp Business.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-8 w-8" /> WhatsApp Business API
        </h1>
        <Button onClick={fetchStatus} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Sistema</CardTitle>
          <CardDescription>Panoramica dello stato di WhatsApp Business e AI</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Bot className={`h-5 w-5 ${status?.aiEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="font-medium">
              {status?.aiEnabled ? `AI Attiva (${status.model})` : 'AI Disattiva'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className={`h-5 w-5 ${status?.autoReply ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className="font-medium">
              {status?.autoReply ? 'Risposta Auto' : 'Risposta Manuale'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarClock className={`h-5 w-5 ${status?.businessHours?.enabled ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="font-medium">
              {status?.businessHours?.enabled ? 
                `${status.businessHours.start}-${status.businessHours.end}` : 
                'Sempre attivo'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="oauth" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="oauth" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> OAuth Config
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" /> API Config
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center gap-2">
            <Key className="h-4 w-4" /> Webhook
          </TabsTrigger>
          <TabsTrigger value="ai-automation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> AI & Modelli
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Messaggi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="oauth" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione OAuth Facebook</CardTitle>
              <CardDescription>
                Inserisci le credenziali OAuth dal pannello sviluppatori Facebook.
                <span className="block mt-2 text-blue-600">
                  📋 Client ID dalle immagini: <code>1721754479217300</code> | Business Account ID: <code>1192859498811556</code>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={updateConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appId">App ID (Client ID)</Label>
                    <Input
                      id="appId"
                      type="text"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      placeholder="1721754479217300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAccountId">Business Account ID</Label>
                    <Input
                      id="businessAccountId"
                      type="text"
                      value={config.businessAccountId}
                      onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                      placeholder="1192859498811556"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appSecret">App Secret</Label>
                  <div className="relative">
                    <Input
                      id="appSecret"
                      type={showAppSecret ? "text" : "password"}
                      value={config.appSecret}
                      onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                      placeholder="App Secret da Facebook Developers"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAppSecret(!showAppSecret)}
                    >
                      {showAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> Salva OAuth Config
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione API WhatsApp</CardTitle>
              <CardDescription>
                Configura le credenziali per l'invio e ricezione messaggi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={updateConfig} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <div className="relative">
                    <Input
                      id="accessToken"
                      type={showAccessToken ? "text" : "password"}
                      value={config.accessToken}
                      onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                      placeholder="Inserisci il tuo Access Token da Facebook"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                    >
                      {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    type="text"
                    value={config.phoneNumberId}
                    onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                    placeholder="ID del numero di telefono WhatsApp Business"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> Salva API Config
                  </Button>
                  <Button type="button" onClick={testConnection} disabled={loading} variant="outline">
                    <TestTube className="h-4 w-4 mr-2" /> Test API Connection
                  </Button>
                </div>

                {testResults.connection && (
                  <div className={`p-3 rounded-md ${testResults.connection.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                      {testResults.connection.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span className="font-medium">{testResults.connection.message}</span>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Webhook</CardTitle>
              <CardDescription>
                Token di verifica per il webhook Facebook. Usa questo URL e token nel pannello Facebook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={status?.webhookUrl || ''}
                      readOnly
                      className="font-mono bg-gray-50"
                    />
                    <Button
                      onClick={() => copyToClipboard(status?.webhookUrl || '', 'Webhook URL')}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Verify Token</Label>
                  <div className="flex gap-2">
                    <Input
                      value={config.webhookVerifyToken}
                      readOnly
                      className="font-mono bg-gray-50"
                    />
                    <Button
                      onClick={() => copyToClipboard(config.webhookVerifyToken, 'Verify Token')}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={generateWebhookToken}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usa questo token nel campo "Verify Token" della configurazione Webhook su Facebook.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="button" onClick={() => window.open('https://developers.facebook.com/docs/whatsapp/business-management-api/webhooks', '_blank')} variant="outline">
                    <Settings className="h-4 w-4 mr-2" /> Guida Facebook
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Configurazione Facebook:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Vai su Facebook Developers → WhatsApp → Configurazione</li>
                    <li>2. Nella sezione Webhook, clicca "Modifica"</li>
                    <li>3. Inserisci l'URL del Callback e il Verify Token sopra</li>
                    <li>4. Sottoscrivi agli eventi: messages, messaging_postbacks</li>
                    <li>5. Salva e verifica il webhook</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-automation" className="mt-6">
          <div className="space-y-6">
            {/* Modelli Disponibili */}
            <Card>
              <CardHeader>
                <CardTitle>Modelli AI Disponibili</CardTitle>
                <CardDescription>Modelli scaricati e disponibili su Ollama</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={fetchStatus} disabled={loading} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Aggiorna Lista
                  </Button>
                </div>

                {status?.model && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Modello Attivo: {status.model}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Scarica Nuovo Modello</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome modello (es. llama3.1, codellama, vicuna)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          pullModel(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button onClick={() => {
                      const input = document.querySelector('input[placeholder="Nome modello"]') as HTMLInputElement;
                      if (input?.value) {
                        pullModel(input.value);
                        input.value = '';
                      }
                    }} disabled={loading}>
                      <Bot className="h-4 w-4 mr-2" />
                      Pull
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurazione AI */}
            <Card>
              <CardHeader>
                <CardTitle>Configurazione AI</CardTitle>
                <CardDescription>Impostazioni per l'assistente AI WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={updateConfig} className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="aiEnabled" className="flex items-center gap-2">
                      <Bot className="h-5 w-5" /> Abilita AI per risposte
                    </Label>
                    <Switch
                      id="aiEnabled"
                      checked={config.aiEnabled}
                      onCheckedChange={(checked: boolean) => setConfig({ ...config, aiEnabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiModel">Modello AI</Label>
                    <Select
                      value={config.aiModel}
                      onValueChange={(value) => setConfig({ ...config, aiModel: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona modello AI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mistral:7b">Mistral 7B</SelectItem>
                        <SelectItem value="llama2">Llama 2</SelectItem>
                        <SelectItem value="phi3">Phi-3 Mini</SelectItem>
                        <SelectItem value="llama3.1">Llama 3.1</SelectItem>
                        <SelectItem value="codellama">CodeLlama</SelectItem>
                        <SelectItem value="vicuna">Vicuna</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button type="button" onClick={testAI} disabled={loading} variant="outline" size="sm">
                        <TestTube className="h-4 w-4 mr-2" /> Test AI
                      </Button>
                    </div>
                    {testResults.ai && (
                      <div className={`p-3 rounded-md ${testResults.ai.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <div className="flex items-center gap-2">
                          {testResults.ai.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          <span className="font-medium">{testResults.ai.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxContextMessages">Messaggi di Contesto</Label>
                    <Select
                      value={config.maxContextMessages.toString()}
                      onValueChange={(value) => setConfig({ ...config, maxContextMessages: parseInt(value) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 messaggio</SelectItem>
                        <SelectItem value="3">3 messaggi</SelectItem>
                        <SelectItem value="5">5 messaggi</SelectItem>
                        <SelectItem value="10">10 messaggi</SelectItem>
                        <SelectItem value="20">20 messaggi</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Numero di messaggi precedenti da includere nel contesto per l'AI
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiPrompt">Prompt AI Personalizzato</Label>
                    <Textarea
                      id="aiPrompt"
                      value={config.aiPrompt}
                      onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                      placeholder="Inserisci il prompt personalizzato per l'AI..."
                      rows={8}
                    />
                    <p className="text-sm text-muted-foreground">
                      Questo prompt definisce il comportamento dell'AI. Usa {"{userMessage}"} per il messaggio dell'utente.
                    </p>
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="autoReply" className="flex items-center gap-2">
                      <Zap className="h-5 w-5" /> Risposta Automatica (AI)
                    </Label>
                    <Switch
                      id="autoReply"
                      checked={config.autoReply}
                      onCheckedChange={(checked: boolean) => setConfig({ ...config, autoReply: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" /> Orari di Ufficio
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="businessHoursEnabled"
                        checked={config.businessHours.enabled}
                        onCheckedChange={(checked: boolean) => setConfig(prev => ({
                          ...prev,
                          businessHours: { ...prev.businessHours, enabled: checked }
                        }))}
                      />
                      <Label htmlFor="businessHoursEnabled">Abilita orari specifici</Label>
                    </div>
                    {config.businessHours.enabled && (
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="space-y-1">
                          <Label htmlFor="businessHoursStart">Inizio</Label>
                          <Input
                            id="businessHoursStart"
                            type="time"
                            value={config.businessHours.start}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, start: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="businessHoursEnd">Fine</Label>
                          <Input
                            id="businessHoursEnd"
                            type="time"
                            value={config.businessHours.end}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, end: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="businessHoursTimezone">Fuso Orario</Label>
                          <Input
                            id="businessHoursTimezone"
                            type="text"
                            value={config.businessHours.timezone}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, timezone: e.target.value }
                            }))}
                            placeholder="Europe/Rome"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> Salva Impostazioni AI
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversazioni WhatsApp</CardTitle>
              <CardDescription>Visualizza e gestisci le conversazioni con i clienti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col h-[500px] border rounded-md p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Nessun messaggio ancora.</p>
                      <p className="text-sm">I messaggi WhatsApp appariranno qui.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromBusiness ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                          msg.isFromBusiness
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-800 border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.isFromBusiness ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                          <span className="text-xs font-semibold">
                            {msg.isFromBusiness ? 'Studio Gori' : msg.from}
                          </span>
                          {msg.processed && <Badge variant="secondary" className="text-xs">AI</Badge>}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        {msg.aiResponse && (
                          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-800 rounded-md text-xs text-blue-800 dark:text-blue-100">
                            <Bot className="inline-block h-3 w-3 mr-1" /> AI: {msg.aiResponse}
                          </div>
                        )}
                        <p className="text-xs text-right mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message Form */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Numero destinatario (es. 393401234567)"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                  className="w-1/3"
                  required
                />
                <Input
                  type="text"
                  placeholder="Scrivi un messaggio..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" /> Invia
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}