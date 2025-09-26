import { useState } from 'react';
import { Bot, MessageSquare, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/utils/api';

export default function AIAssistantProPage() {
  const [aiChatMessage, setAiChatMessage] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{
    type: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>>([]);

  async function sendAiChatMessage() {
    if (!aiChatMessage.trim()) return;

    const userMessage = {
      type: 'user' as const,
      content: aiChatMessage,
      timestamp: new Date().toISOString(),
    };

    setAiChatHistory(prev => [...prev, userMessage]);
    setAiChatLoading(true);

    try {
      // Load AI settings from the centralized configuration
      const settingsResponse = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      let aiConfig = {
        model: 'mistral:7b',
        temperature: 0.7,
        timeout: 30000,
        prompt: 'Sei un assistente AI professionale per uno studio di geometra. Rispondi in modo chiaro e utile.',
      };

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data?.ai) {
          aiConfig = {
            model: settingsData.data.ai.model || aiConfig.model,
            temperature: settingsData.data.ai.temperature || aiConfig.temperature,
            timeout: settingsData.data.ai.timeout || aiConfig.timeout,
            prompt: settingsData.data.ai.prompt || aiConfig.prompt,
          };
        }
      }

        const response = await apiClient.post('/ai/chat', {
          message: aiChatMessage,
          model: aiConfig.model,
          temperature: aiConfig.temperature,
          service: 'general',
          prompt: aiConfig.prompt,
        });

      const data = response.data;

      if (data.success) {
        const aiMessage = {
          type: 'assistant' as const,
          content: data.data?.response || 'Risposta non disponibile',
          timestamp: new Date().toISOString(),
        };
        setAiChatHistory(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Errore nella risposta AI');
      }
    } catch (error) {
      console.error('Error sending AI chat message:', error);
      const errorMessage = {
        type: 'assistant' as const,
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        timestamp: new Date().toISOString(),
      };
      setAiChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setAiChatLoading(false);
      setAiChatMessage('');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="h-8 w-8 text-purple-600" />
          AI Assistant Pro
        </h1>
        <p className="mt-2 text-gray-600">
          Assistente AI avanzato per tutte le funzioni dello studio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            Chat Diretta con l'AI
          </CardTitle>
          <CardDescription>
            Fai domande dirette all'AI e ottieni risposte in tempo reale per qualsiasi necessità del tuo studio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domanda</Label>
            <Textarea
              placeholder="Scrivi la tua domanda per l'AI..."
              rows={4}
              value={aiChatMessage}
              onChange={(e) => setAiChatMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={sendAiChatMessage}
              disabled={aiChatLoading || !aiChatMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {aiChatLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {aiChatLoading ? 'Invio...' : 'Chiedi all\'AI'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setAiChatMessage('');
                setAiChatHistory([]);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Nuova Conversazione
            </Button>
          </div>

          {/* Chat History */}
          {aiChatHistory.length > 0 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                {aiChatHistory.map((message, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}>
                        {message.type === 'user' ? 'Tu' : 'AI'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.type === 'user' ? 'Tu' : 'AI Assistant Pro'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
