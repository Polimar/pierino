import { EventEmitter } from 'events';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { MessageType, Role, WhatsappAuthorType } from '@prisma/client';
import { prisma } from '../config/database';
import { createLogger } from '../utils/logger';
import { aiService } from './aiService';
import { AIToolContext, ChatMessageWithTools } from '../types/aiTypes';

type IncomingMessagePayload = {
  entry?: Array<{
    changes?: Array<{
      field: string;
      value: {
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
        metadata: {
          phone_number_id: string;
        };
        messages?: Array<any>;
      };
    }>;
  }>;
};

type SendMessageOptions = {
  authorType?: WhatsappAuthorType;
  authorId?: string | null;
  conversationId?: string | null;
};

type OrchestratedMessage = {
  conversationId: string;
  messageId: string;
};

const logger = createLogger('WhatsAppBusiness');

const BUSINESS_HOURS_FALLBACK = {
  enabled: false,
  start: '09:00',
  end: '18:00',
  timezone: 'Europe/Rome',
};

class ConversationQueue {
  private queue = new Map<string, Promise<void>>();

  enqueue(conversationId: string, task: () => Promise<void>): void {
    const current = this.queue.get(conversationId) ?? Promise.resolve();
    const next = current.then(task).catch((error) => {
      logger.error('Queue task error:', error);
    });

    this.queue.set(conversationId, next.finally(() => {
      if (this.queue.get(conversationId) === next) {
        this.queue.delete(conversationId);
      }
    }));
  }
}

class WhatsAppBusinessService extends EventEmitter {
  private queue = new ConversationQueue();
  private aiServiceUrl = process.env.OLLAMA_ENDPOINT || 'http://ollama:11434';

  private async ensureConfig() {
    let config = await prisma.whatsappConfig.findFirst();
    if (!config) {
      config = await prisma.whatsappConfig.create({
        data: {
          accessToken: '',
          phoneNumberId: '',
          webhookVerifyToken: crypto.randomBytes(32).toString('hex'),
        },
      });
    }
    return config;
  }

  async getConfig() {
    return this.ensureConfig();
  }

  async updateConfig(update: Partial<{ [K in keyof typeof prisma.whatsappConfig]: any }>) {
    const config = await this.ensureConfig();
    const {
      businessHoursEnabled,
      businessHoursStart,
      businessHoursEnd,
      businessHoursTimezone,
      ...rest
    } = update as any;

    logger.info(`Aggiornamento configurazione: aiEnabled=${rest.aiEnabled}, autoReply=${rest.autoReply}`);

    return prisma.whatsappConfig.update({
      where: { id: config.id },
      data: {
        ...rest,
        businessHoursEnabled,
        businessHoursStart,
        businessHoursEnd,
        businessHoursTimezone,
      },
    });
  }

  async regenerateWebhookToken() {
    const config = await this.ensureConfig();
    const webhookVerifyToken = crypto.randomBytes(32).toString('hex');

    await prisma.whatsappConfig.update({
      where: { id: config.id },
      data: { webhookVerifyToken },
    });

    return webhookVerifyToken;
  }

  async getStatus() {
    const config = await this.ensureConfig();
    return {
      configured: Boolean(config.accessToken && config.phoneNumberId),
      aiEnabled: config.aiEnabled,
      autoReply: config.autoReply,
      model: config.aiModel,
      businessHours: {
        enabled: config.businessHoursEnabled,
        start: config.businessHoursStart,
        end: config.businessHoursEnd,
        timezone: config.businessHoursTimezone,
      },
      webhookToken: config.webhookVerifyToken,
      webhookUrl: `${process.env.API_URL || 'https://vps-3dee2600.vps.ovh.net/api'}/whatsapp/webhook`,
    };
  }

  verifyWebhook(verifyToken: string, challenge: string) {
    return this.ensureConfig().then((config) =>
      config.webhookVerifyToken === verifyToken ? challenge : null
    );
  }

  async getConversations(user: { id: string; role: Role }) {
    const where = user.role === 'ADMIN'
      ? {}
      : {
          OR: [
            { assignedToId: user.id },
            { createdById: user.id },
            { messages: { some: { authorType: WhatsappAuthorType.CLIENT, authorId: user.id } } },
          ],
        };

    const conversations = await prisma.whatsappConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      contactPhone: conv.contactPhone,
      contactName: conv.contactName,
      clientId: conv.clientId,
      assignedToId: conv.assignedToId,
      lastMessageAt: conv.lastMessageAt,
      lastMessageText: conv.lastMessageText,
      unreadCount: conv.unreadCount,
      lastMessage: conv.messages[0] || null,
    }));
  }

  async getConversationMessages(conversationId: string, limit = 100) {
    return prisma.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });
  }

  async assignConversation(conversationId: string, userId: string | null) {
    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { assignedToId: userId },
    });
  }

  async sendMessage(
    to: string,
    text: string,
    user: { id: string; role: Role } | null,
    options: SendMessageOptions = {}
  ) {
    const config = await this.ensureConfig();
    if (!config.accessToken || !config.phoneNumberId) {
      throw new Error('WhatsApp Business non configurato');
    }

    const conversation = await this.upsertConversationByPhone(to, {
      contactName: null,
      createdById: user?.id ?? null,
    });

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${errorText}`);
    }

    const result = await response.json();
    const messageId = result.messages?.[0]?.id ?? crypto.randomUUID();

    const message = await prisma.whatsappMessage.create({
      data: {
        messageId,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        authorType: options.authorType || WhatsappAuthorType.BUSINESS_USER,
        authorId: options.authorId ?? user?.id ?? null,
        content: text,
        messageType: MessageType.TEXT,
        processed: true,
      },
    });

    await this.touchConversation(conversation.id, text, false);

    return message;
  }

  async processWebhook(body: IncomingMessagePayload) {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages' || !change.value.messages) continue;

        const metadata = change.value.metadata;
        const contacts = change.value.contacts || [];

        for (const message of change.value.messages) {
          await this.handleIncomingMessage(message, metadata, contacts);
        }
      }
    }
  }

  private async handleIncomingMessage(message: any, metadata: any, contacts: any[]) {
    const from = message.from;
    if (!from) return;

    const contactProfile = contacts.find((contact) => contact.wa_id === from);
    const contactName = contactProfile?.profile?.name ?? null;
    const content = this.extractMessageContent(message);
    const config = await this.ensureConfig();

    const conversation = await this.upsertConversationByPhone(from, {
      contactName,
    });

    const prismaMessage = await prisma.whatsappMessage.create({
      data: {
        messageId: message.id,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        authorType: WhatsappAuthorType.CLIENT,
        authorId: null,
        content,
        messageType: this.mapMessageType(message.type),
        mediaUrl: this.extractMediaUrl(message),
        processed: false,
        timestamp: new Date(),
      },
    });

    await this.touchConversation(conversation.id, content, true);

    logger.info(`Messaggio ricevuto da ${from}: aiEnabled=${config.aiEnabled}, autoReply=${config.autoReply}`);

    if (config.aiEnabled && config.autoReply) {
      logger.info(`Avvio elaborazione AI per conversazione ${conversation.id}`);
      this.queue.enqueue(conversation.id, async () => {
        await this.processWithAI(conversation.id, prismaMessage, config);
      });
    } else {
      logger.info(`AI non abilitata: aiEnabled=${config.aiEnabled}, autoReply=${config.autoReply}`);
    }
  }

  private async processWithAI(
    conversationId: string,
    message: { id: string; content: string },
    configOverride?: Awaited<ReturnType<typeof this.ensureConfig>>
  ) {
    const config = configOverride || (await this.ensureConfig());

    if (config.businessHoursEnabled && !this.isWithinBusinessHours(config)) {
      const autoReply = `Grazie per il tuo messaggio. Il nostro studio è attualmente chiuso. Orari: ${config.businessHoursStart}-${config.businessHoursEnd}. Ti risponderemo appena possibile.`;
      await this.sendAIReply(conversationId, autoReply, message.id, config);
      return;
    }

    try {
      // Ottieni il contesto della conversazione
      const conversation = await prisma.whatsappConversation.findUnique({
        where: { id: conversationId },
        include: {
          client: true,
          assignedTo: true
        }
      });

      // Costruisci la storia della conversazione
      const history = await prisma.whatsappMessage.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        take: config.maxContextMessages,
        include: {
          author: true
        }
      });

      // Prepara i messaggi per l'AI con tools
      const messages: ChatMessageWithTools[] = [];

      // Aggiungi la storia della conversazione
      for (const msg of history.reverse()) {
        if (msg.authorType === 'USER') {
          messages.push({
            role: 'user',
            content: msg.content
          });
        } else if (msg.authorType === 'AI' && msg.aiResponse) {
          messages.push({
            role: 'assistant',
            content: msg.aiResponse
          });
        }
      }

      // Aggiungi il messaggio corrente
      messages.push({
        role: 'user',
        content: message.content
      });

      // Prepara il contesto per l'AI
      const aiContext: AIToolContext = {
        conversationId,
        userId: conversation?.assignedToId || undefined,
        userPhone: conversation?.contactPhone || '',
        messageHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString()
        }))
      };

      logger.info(`Processing message with AI tools. Context: conversationId=${conversationId}, phone=${aiContext.userPhone}`);

      // Usa l'AI con tools
      const aiResponse = await aiService.chatWithTools(messages, aiContext);

      // Estrai il contenuto della risposta pulito
      let responseText = aiResponse.content;
      
      // Rimuovi eventuali tool calls dal testo visibile all'utente
      responseText = responseText.replace(/TOOL_CALL:.*?(?=\n|$)/gi, '');
      responseText = responseText.replace(/PARAMETERS:.*?(?=\n|$)/gi, '');
      responseText = responseText.replace(/REASON:.*?(?=\n|$)/gi, '');
      responseText = responseText.trim();

      // Se non c'è testo dopo la pulizia, usa un messaggio di default
      if (!responseText) {
        responseText = 'Ho elaborato la tua richiesta. È stata completata con successo.';
      }

      // Invia la risposta AI
      await this.sendAIReply(conversationId, responseText, message.id, config);

      // Log del successo
      logger.info(`AI processed message successfully. Tools used: ${aiResponse.toolCalls ? aiResponse.toolCalls.length : 0}`);

    } catch (error: any) {
      logger.error('AI response error:', error);
      
      // Fallback a risposta generica
      let fallbackMessage = 'Mi dispiace, al momento non riesco a elaborare la tua richiesta. Un operatore ti risponderà al più presto.';
      
      // Se è un errore di configurazione, usa un messaggio più specifico
      if (error.message?.includes('configuration') || error.message?.includes('model')) {
        fallbackMessage = 'Il servizio AI è temporaneamente non disponibile. Ti risponderemo appena possibile.';
      }

      await prisma.whatsappMessage.update({
        where: { id: message.id },
        data: {
          processed: true,
          aiResponse: fallbackMessage,
        },
      });
    }
  }

  private async sendAIReply(
    conversationId: string,
    text: string,
    relatedMessageId: string,
    config: Awaited<ReturnType<typeof this.ensureConfig>>
  ) {
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return;

    const message = await this.sendMessage(conversation.contactPhone, text, null, {
      conversationId,
      authorType: WhatsappAuthorType.BUSINESS_AI,
      authorId: null,
    });

    await prisma.whatsappMessage.update({
      where: { id: relatedMessageId },
      data: {
        processed: true,
        aiResponse: message.content,
      },
    });

    await this.touchConversation(conversationId, text, false);
  }

  private buildPrompt(
    basePrompt: string,
    userMessage: string,
    history: Array<{
      authorType: WhatsappAuthorType;
      content: string;
    }>
  ) {
    const context = history
      .map((msg) => {
        const speaker =
          msg.authorType === WhatsappAuthorType.CLIENT
            ? 'Cliente'
            : msg.authorType === WhatsappAuthorType.BUSINESS_AI
            ? 'AI'
            : 'Studio Gori';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    return `${basePrompt || 'Rispondi in modo professionale.'}\n\nConversazione recente:\n${context}\n\nMessaggio del cliente: ${userMessage}\n\nRisposta:`;
  }

  private async upsertConversationByPhone(
    phone: string,
    options: { contactName?: string | null; createdById?: string | null }
  ) {
    return prisma.whatsappConversation.upsert({
      where: { contactPhone: phone },
      update: {
        contactName: options.contactName ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        contactPhone: phone,
        contactName: options.contactName,
        createdById: options.createdById ?? null,
        lastMessageAt: new Date(),
        lastMessageText: '',
      },
    });
  }

  private async touchConversation(
    conversationId: string,
    lastMessageText: string,
    incrementUnread: boolean
  ) {
    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText,
        unreadCount: incrementUnread ? { increment: 1 } : undefined,
      },
    });
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

  private mapMessageType(type: string | undefined): MessageType {
    switch (type) {
      case 'audio':
        return MessageType.AUDIO;
      case 'image':
        return MessageType.IMAGE;
      case 'video':
        return MessageType.VIDEO;
      case 'document':
        return MessageType.DOCUMENT;
      default:
        return MessageType.TEXT;
    }
  }

  private isWithinBusinessHours(config: Awaited<ReturnType<typeof this.ensureConfig>>) {
    if (!config.businessHoursEnabled) return true;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    return (
      currentTime >= (config.businessHoursStart || BUSINESS_HOURS_FALLBACK.start) &&
      currentTime <= (config.businessHoursEnd || BUSINESS_HOURS_FALLBACK.end)
    );
  }

  async testConnection() {
    const config = await this.ensureConfig();
    if (!config.accessToken || !config.phoneNumberId) {
      return { success: false, message: 'Access Token e Phone Number ID sono richiesti' };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `Errore connessione WhatsApp API: ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connessione riuscita! Numero: ${data.display_phone_number || 'N/A'}`,
    };
  }

  async testAI() {
    const config = await this.ensureConfig();
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.aiModel,
          prompt: 'Rispondi con "Test AI riuscito"',
          stream: false,
          options: { max_tokens: 10 },
        }),
      });

      if (!response.ok) {
        return { success: false, message: `Errore AI service: ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        message: `AI test riuscito! Risposta: ${(data.response || '').trim()}`,
      };
    } catch (error: any) {
      return { success: false, message: `Errore AI: ${error.message}` };
    }
  }

  async getAvailableModels() {
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/tags`);
      if (!response.ok) return ['mistral:7b', 'llama2', 'phi3'];

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || ['mistral:7b'];
    } catch (error) {
      logger.warn('Error fetching Ollama models:', error);
      return ['mistral:7b', 'llama2', 'phi3'];
    }
  }

  async pullModel(modelName: string) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        return { success: false, message: `Errore pull modello: ${response.status}` };
      }

      return { success: true, message: `Modello ${modelName} scaricato con successo!` };
    } catch (error: any) {
      return { success: false, message: `Errore pull modello: ${error.message}` };
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    logger.info(`Eliminando conversazione ${conversationId}`);

    // Elimina tutti i messaggi della conversazione
    await prisma.whatsappMessage.deleteMany({
      where: { conversationId },
    });

    // Elimina la conversazione
    await prisma.whatsappConversation.delete({
      where: { id: conversationId },
    });

    logger.info(`Conversazione ${conversationId} eliminata con successo`);
  }
}

export const whatsappBusinessService = new WhatsAppBusinessService();
export default whatsappBusinessService;
