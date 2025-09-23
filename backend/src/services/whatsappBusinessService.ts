import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';
import { fileStorage } from './fileStorageService';

const logger = createLogger('WhatsAppBusiness');

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
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  content: string;
  mediaUrl?: string;
  timestamp: string;
  isFromBusiness: boolean;
  processed: boolean;
  aiResponse?: string;
}

class WhatsAppBusinessService extends EventEmitter {
  private config: WhatsAppConfig | null = null;
  private messagesPath: string;
  private configPath: string;
  private fileStorage: any;
  private aiServiceUrl: string;

  constructor() {
    super();
    this.messagesPath = '/app/data/whatsapp_messages.json';
    this.configPath = '/app/data/whatsapp_config.json';
    this.aiServiceUrl = 'http://ollama:11434';
    this.fileStorage = fileStorage;
    this.loadConfig();
    this.initializeDefaultConfig();
  }

  private initializeDefaultConfig() {
    if (!this.config) {
      this.config = {
        accessToken: '',
        phoneNumberId: '',
        webhookVerifyToken: this.generateWebhookToken(),
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
          timezone: 'Europe/Rome'
        },
        aiPrompt: `Sei l'assistente AI di Studio Gori, uno studio di geometri professionisti che si occupa di pratiche edilizie, catasto, topografia e consulenze tecniche.

RISpondi sempre in modo professionale, cortese e conciso.
Ambiti di competenza: condoni, SCIA, permessi di costruire, catasto, topografia, APE, consulenze tecniche.

Regole:
- Fornisci informazioni accurate e utili
- Se non sai qualcosa, dì che verificherai con un geometra dello studio
- Mantieni un tono professionale ma amichevole
- Rispondi in italiano
- Limita le risposte a 2-3 frasi per essere conciso`,
        maxContextMessages: 5
      };
      this.saveConfig();
      logger.info('Default WhatsApp config initialized');
    }
  }

  generateWebhookToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private loadConfig() {
    try {
      this.config = this.fileStorage.getWhatsAppConfig();
      logger.info('WhatsApp Business config loaded');
    } catch (error) {
      logger.error('Error loading WhatsApp config:', error);
    }
  }

  private saveConfig() {
    try {
      this.fileStorage.saveWhatsAppConfig(this.config);
    } catch (error) {
      logger.error('Error saving WhatsApp config:', error);
    }
  }

  async updateConfig(newConfig: Partial<WhatsAppConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig } as WhatsAppConfig;
    this.saveConfig();
    logger.info('WhatsApp Business config updated');
  }

  getConfig(): WhatsAppConfig | null {
    return this.config;
  }

  async verifyWebhook(verifyToken: string, challenge: string): Promise<string | null> {
    if (!this.config || this.config.webhookVerifyToken !== verifyToken) {
      logger.warn('Invalid webhook verify token');
      return null;
    }
    return challenge;
  }

  async processWebhook(body: any): Promise<void> {
    try {
      if (!body.entry || !body.entry[0] || !body.entry[0].changes) {
        return;
      }

      const changes = body.entry[0].changes;
      for (const change of changes) {
        if (change.field === 'messages' && change.value.messages) {
          for (const message of change.value.messages) {
            await this.processIncomingMessage(message, change.value.metadata);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
    }
  }

  private async processIncomingMessage(message: any, metadata: any): Promise<void> {
    try {
      const whatsappMsg: WhatsAppMessage = {
        id: message.id,
        from: message.from,
        to: metadata.phone_number_id,
        type: message.type,
        content: this.extractMessageContent(message),
        mediaUrl: this.extractMediaUrl(message),
        timestamp: new Date().toISOString(),
        isFromBusiness: false,
        processed: false
      };

      // Salva messaggio
      await this.saveMessage(whatsappMsg);

      // Se AI è abilitata, processa automaticamente
      if (this.config?.aiEnabled && this.config?.autoReply) {
        await this.processWithAI(whatsappMsg);
      }

      this.emit('message_received', whatsappMsg);
    } catch (error) {
      logger.error('Error processing incoming message:', error);
    }
  }

  private extractMessageContent(message: any): string {
    switch (message.type) {
      case 'text':
        return message.text?.body || '';
      case 'image':
        return message.image?.caption || '[Immagine]';
      case 'audio':
        return '[Audio]';
      case 'video':
        return message.video?.caption || '[Video]';
      case 'document':
        return message.document?.caption || '[Documento]';
      default:
        return '[Messaggio non supportato]';
    }
  }

  private extractMediaUrl(message: any): string | undefined {
    switch (message.type) {
      case 'image':
        return message.image?.id;
      case 'audio':
        return message.audio?.id;
      case 'video':
        return message.video?.id;
      case 'document':
        return message.document?.id;
      default:
        return undefined;
    }
  }

  private async saveMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const messages = this.fileStorage.getWhatsAppMessages();
      messages.push(message);

      // Mantieni solo gli ultimi 1000 messaggi
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }

      this.fileStorage.saveWhatsAppMessages(messages);
    } catch (error) {
      logger.error('Error saving message:', error);
    }
  }

  async getMessages(limit = 50): Promise<WhatsAppMessage[]> {
    try {
      const messages = this.fileStorage.getWhatsAppMessages();
      return messages.slice(-limit).reverse();
    } catch (error) {
      logger.error('Error reading messages:', error);
      return [];
    }
  }

  private async processWithAI(message: WhatsAppMessage): Promise<void> {
    try {
      if (!this.config?.aiModel) {
        logger.warn('AI model not configured');
        return;
      }

      // Controlla orari di lavoro
      if (this.config.businessHours.enabled && !this.isWithinBusinessHours()) {
        const autoReply = `Grazie per il tuo messaggio. Il nostro studio è attualmente chiuso. Orari: ${this.config.businessHours.start}-${this.config.businessHours.end}. Ti risponderemo appena possibile.`;
        await this.sendMessage(message.from, autoReply);
        return;
      }

      // Genera risposta AI con contesto
      const conversationHistory = await this.getMessages(50); // Get recent messages for context
      const aiResponse = await this.generateAIResponse(message.content, conversationHistory);
      if (aiResponse) {
        await this.sendMessage(message.from, aiResponse);

        // Aggiorna messaggio con risposta AI
        message.aiResponse = aiResponse;
        message.processed = true;
        await this.updateMessage(message);
      }
    } catch (error) {
      logger.error('Error processing with AI:', error);
    }
  }

  private async generateAIResponse(userMessage: string, conversationHistory: WhatsAppMessage[] = []): Promise<string | null> {
    try {
      // Get recent messages for context
      const recentMessages = conversationHistory
        .slice(-(this.config?.maxContextMessages || 5))
        .map(msg => `${msg.isFromBusiness ? 'Tu' : 'Cliente'}: ${msg.content}`)
        .join('\n');

      const contextText = recentMessages ? `\nConversazione recente:\n${recentMessages}` : '';

      const prompt = `${this.config?.aiPrompt || 'Rispondi in modo professionale'}

Messaggio del cliente: "${userMessage}"${contextText}

Rispondi in modo naturale mantenendo la conversazione:`;

      const response = await fetch(`${this.aiServiceUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config?.aiModel || 'mistral:7b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            max_tokens: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.response?.trim() || null;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return 'Grazie per il tuo messaggio. Un nostro operatore ti risponderà al più presto.';
    }
  }

  private isWithinBusinessHours(): boolean {
    if (!this.config?.businessHours.enabled) return true;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    
    return currentTime >= this.config.businessHours.start && 
           currentTime <= this.config.businessHours.end;
  }

  async sendMessage(to: string, text: string): Promise<boolean> {
    try {
      if (!this.config?.accessToken || !this.config?.phoneNumberId) {
        throw new Error('WhatsApp Business not configured');
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: text
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${error}`);
      }

      const result = await response.json() as any;

      // Salva messaggio inviato
      const sentMessage: WhatsAppMessage = {
        id: result.messages?.[0]?.id || 'unknown',
        from: this.config.phoneNumberId,
        to: to,
        type: 'text',
        content: text,
        timestamp: new Date().toISOString(),
        isFromBusiness: true,
        processed: true
      };

      await this.saveMessage(sentMessage);
      this.emit('message_sent', sentMessage);

      return true;
    } catch (error) {
      logger.error('Error sending message:', error);
      return false;
    }
  }

  private async updateMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const messages = await this.getMessages(1000);
      const index = messages.findIndex(m => m.id === message.id);
      if (index !== -1) {
        messages[index] = message;
        this.fileStorage.saveWhatsAppMessages(messages);
      }
    } catch (error) {
      logger.error('Error updating message:', error);
    }
  }

  async getStatus(): Promise<any> {
    return {
      configured: !!this.config?.accessToken && !!this.config?.phoneNumberId,
      aiEnabled: this.config?.aiEnabled || false,
      autoReply: this.config?.autoReply || false,
      model: this.config?.aiModel || null,
      businessHours: this.config?.businessHours || null,
      webhookToken: this.config?.webhookVerifyToken,
      webhookUrl: `https://vps-3dee2600.vps.ovh.net/api/whatsapp/webhook`
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config?.accessToken || !this.config?.phoneNumberId) {
        return { success: false, message: 'Access Token e Phone Number ID sono richiesti' };
      }

      // Test WhatsApp Business API connection
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.config.phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: `Errore connessione WhatsApp API: ${error}` };
      }

      const data = await response.json() as any;
      return {
        success: true,
        message: `Connessione riuscita! Numero: ${data.display_phone_number || 'N/A'}`
      };
    } catch (error: any) {
      return { success: false, message: `Errore di rete: ${error.message}` };
    }
  }

  async testWebhook(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config?.webhookVerifyToken) {
        return { success: false, message: 'Webhook Verify Token non configurato' };
      }

      // Test if webhook endpoint is accessible
      const webhookUrl = `https://vps-3dee2600.vps.ovh.net/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=${this.config.webhookVerifyToken}`;

      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok && response.status === 200) {
        const challenge = await response.text();
        if (challenge === 'test') {
          return { success: true, message: 'Webhook endpoint configurato correttamente' };
        }
      }

      return { success: false, message: 'Webhook endpoint non accessibile o token non valido' };
    } catch (error: any) {
      return { success: false, message: `Errore test webhook: ${error.message}` };
    }
  }

  async testAI(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config?.aiModel || 'mistral:7b',
          prompt: 'Rispondi solo con "Test AI riuscito"',
          stream: false,
          options: { max_tokens: 10 }
        })
      });

      if (!response.ok) {
        return { success: false, message: `Errore AI service: ${response.status}` };
      }

      const data = await response.json() as any;
      return {
        success: true,
        message: `AI test riuscito! Risposta: ${data?.response?.trim() || 'N/A'}`
      };
    } catch (error: any) {
      return { success: false, message: `Errore AI: ${error.message}` };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/tags`);
      if (!response.ok) {
        console.warn('Could not fetch Ollama models:', response.status);
        return ['mistral:7b', 'llama2', 'phi3']; // Fallback models
      }

      const data = await response.json() as any;
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.warn('Error fetching Ollama models:', error);
      return ['mistral:7b', 'llama2', 'phi3']; // Fallback models
    }
  }

  async pullModel(modelName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        return { success: false, message: `Errore pull modello: ${response.status}` };
      }

      // Note: The pull endpoint might not return JSON immediately
      return { success: true, message: `Modello ${modelName} scaricato con successo!` };
    } catch (error: any) {
      return { success: false, message: `Errore pull modello: ${error.message}` };
    }
  }
}

export const whatsappBusinessService = new WhatsAppBusinessService();
export default whatsappBusinessService;
