import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Brain, MessageCircle, Mail, Globe, Save, TestTube } from 'lucide-react';

interface AppSettings {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  whatsapp: {
    enabled: boolean;
    phoneNumber?: string;
    apiKey?: string;
  };
  email: {
    provider: 'gmail' | 'outlook' | 'custom';
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

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section: string, updates: any) => {
    setSaving(section);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/settings/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (data.success) {
        await fetchSettings();
        alert('Impostazioni salvate con successo!');
      } else {
        alert(data.message || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async (type: 'email' | 'whatsapp') => {
    setTestingConnection(type);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Test ${type} completato con successo!`);
      } else {
        alert(data.message || `Errore nel test ${type}`);
      }
    } catch (error) {
      console.error(`Error testing ${type}:`, error);
      alert(`Errore nel test ${type}`);
    } finally {
      setTestingConnection(null);
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Caricamento impostazioni...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni Sistema</h1>
        </div>

        <div className="space-y-6">
          {/* AI Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">Configurazione AI</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modello AI
                </label>
                <select
                  value={settings.ai.model}
                  onChange={(e) => setSettings({
                    ...settings,
                    ai: { ...settings.ai, model: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="llama3.2">Llama 3.2</option>
                  <option value="llama3.1">Llama 3.1</option>
                  <option value="codellama">CodeLlama</option>
                  <option value="mistral">Mistral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature ({settings.ai.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.ai.temperature}
                  onChange={(e) => setSettings({
                    ...settings,
                    ai: { ...settings.ai, temperature: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <Input
                  type="number"
                  min="100"
                  max="8192"
                  value={settings.ai.maxTokens}
                  onChange={(e) => setSettings({
                    ...settings,
                    ai: { ...settings.ai, maxTokens: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => updateSettings('ai', settings.ai)}
                disabled={saving === 'ai'}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving === 'ai' ? 'Salvando...' : 'Salva Impostazioni AI'}
              </Button>
            </div>
          </Card>

          {/* WhatsApp Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold">Configurazione WhatsApp</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="whatsapp-enabled"
                  checked={settings.whatsapp.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="whatsapp-enabled" className="text-sm font-medium text-gray-700">
                  Abilita integrazione WhatsApp
                </label>
              </div>
              {settings.whatsapp.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numero di Telefono
                    </label>
                    <Input
                      type="text"
                      placeholder="+393331234567"
                      value={settings.whatsapp.phoneNumber || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, phoneNumber: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="WhatsApp API Key"
                      value={settings.whatsapp.apiKey || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, apiKey: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => updateSettings('whatsapp', settings.whatsapp)}
                  disabled={saving === 'whatsapp'}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving === 'whatsapp' ? 'Salvando...' : 'Salva WhatsApp'}
                </Button>
                {settings.whatsapp.enabled && (
                  <Button
                    onClick={() => testConnection('whatsapp')}
                    disabled={testingConnection === 'whatsapp'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testingConnection === 'whatsapp' ? 'Testando...' : 'Test Connessione'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Email Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Configurazione Email</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Email
                </label>
                <select
                  value={settings.email.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, provider: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook</option>
                  <option value="custom">Custom SMTP</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username/Email
                  </label>
                  <Input
                    type="email"
                    value={settings.email.username || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, username: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password/App Password
                  </label>
                  <Input
                    type="password"
                    value={settings.email.password || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, password: e.target.value }
                    })}
                  />
                </div>
              </div>
              {settings.email.provider === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host SMTP
                    </label>
                    <Input
                      type="text"
                      value={settings.email.host || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, host: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porta
                    </label>
                    <Input
                      type="number"
                      value={settings.email.port || 587}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, port: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      id="email-secure"
                      checked={settings.email.secure}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, secure: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="email-secure" className="text-sm font-medium text-gray-700">
                      SSL/TLS
                    </label>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => updateSettings('email', settings.email)}
                  disabled={saving === 'email'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving === 'email' ? 'Salvando...' : 'Salva Email'}
                </Button>
                <Button
                  onClick={() => testConnection('email')}
                  disabled={testingConnection === 'email'}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingConnection === 'email' ? 'Testando...' : 'Test Connessione'}
                </Button>
              </div>
            </div>
          </Card>

          {/* General Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold">Impostazioni Generali</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Azienda
                </label>
                <Input
                  type="text"
                  value={settings.general.companyName}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, companyName: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuso Orario
                </label>
                <Input
                  type="text"
                  value={settings.general.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lingua
                </label>
                <select
                  value={settings.general.language}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => updateSettings('general', settings.general)}
                disabled={saving === 'general'}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving === 'general' ? 'Salvando...' : 'Salva Generali'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;