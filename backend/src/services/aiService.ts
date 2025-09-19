import axios from 'axios';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/config/database';
import config from '@/config/env';
import { createLogger } from '@/utils/logger';
import { AIProvider } from '@prisma/client';

const logger = createLogger('AIService');

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI
    if (config.OPENAI_ENABLED && config.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    }

    // Anthropic
    if (config.ANTHROPIC_ENABLED && config.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: config.ANTHROPIC_API_KEY,
      });
    }

    // Google Gemini
    if (config.GEMINI_ENABLED && config.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
  }

  async getActiveConfiguration() {
    return await prisma.aIConfiguration.findFirst({
      where: { isActive: true },
    });
  }

  async chat(messages: ChatMessage[], context?: string): Promise<AIResponse> {
    const aiConfig = await this.getActiveConfiguration();
    
    if (!aiConfig) {
      throw new Error('No active AI configuration found');
    }

    switch (aiConfig.provider) {
      case AIProvider.OLLAMA:
        return await this.chatWithOllama(messages, aiConfig, context);
      case AIProvider.OPENAI:
        return await this.chatWithOpenAI(messages, aiConfig);
      case AIProvider.ANTHROPIC:
        return await this.chatWithAnthropic(messages, aiConfig);
      case AIProvider.GEMINI:
        return await this.chatWithGemini(messages, aiConfig);
      default:
        throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
    }
  }

  private async chatWithOllama(
    messages: ChatMessage[], 
    config: any, 
    context?: string
  ): Promise<AIResponse> {
    try {
      const systemMessage = context 
        ? `Sei un assistente AI per uno studio di geometra. Contesto: ${context}. Rispondi sempre in italiano.`
        : 'Sei un assistente AI per uno studio di geometra. Rispondi sempre in italiano.';

      const ollamaMessages = [
        { role: 'system', content: systemMessage },
        ...messages
      ];

      const response = await axios.post(`${config.ollamaEndpoint}/api/chat`, {
        model: config.ollamaModel,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: config.temperature || 0.7,
          top_p: 0.9,
          max_tokens: config.maxTokens || 2048,
        },
      }, {
        timeout: config.AI_RESPONSE_TIMEOUT,
      });

      return {
        content: response.data.message.content,
      };
    } catch (error) {
      logger.error('Error with Ollama chat:', error);
      throw new Error('Errore nella comunicazione con Ollama');
    }
  }

  private async chatWithOpenAI(messages: ChatMessage[], config: any): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'Sei un assistente AI per uno studio di geometra. Rispondi sempre in italiano e fornisci informazioni precise e professionali.',
          },
          ...messages,
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2048,
      });

      const choice = completion.choices[0];
      if (!choice.message.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: choice.message.content,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      logger.error('Error with OpenAI chat:', error);
      throw new Error('Errore nella comunicazione con OpenAI');
    }
  }

  private async chatWithAnthropic(messages: ChatMessage[], config: any): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic not initialized');
    }

    try {
      // Filter out system messages and combine them
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      const systemContent = systemMessages.length > 0 
        ? systemMessages.map(m => m.content).join('\n')
        : 'Sei un assistente AI per uno studio di geometra. Rispondi sempre in italiano e fornisci informazioni precise e professionali.';

      const response = await this.anthropic.messages.create({
        model: config.anthropicModel,
        max_tokens: config.maxTokens || 2048,
        temperature: config.temperature || 0.7,
        system: systemContent,
        messages: conversationMessages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return {
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error('Error with Anthropic chat:', error);
      throw new Error('Errore nella comunicazione con Anthropic');
    }
  }

  private async chatWithGemini(messages: ChatMessage[], config: any): Promise<AIResponse> {
    if (!this.gemini) {
      throw new Error('Gemini not initialized');
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: config.geminiModel });

      // Convert messages to Gemini format
      const chat = model.startChat({
        history: messages.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;

      return {
        content: response.text(),
      };
    } catch (error) {
      logger.error('Error with Gemini chat:', error);
      throw new Error('Errore nella comunicazione con Gemini');
    }
  }

  async analyzeWhatsAppMessage(messageContent: string, clientContext?: string): Promise<{
    analysis: string;
    priority: string;
    suggestedResponse?: string;
  }> {
    const context = `
Analizza questo messaggio WhatsApp da un cliente dello studio geometra.
${clientContext ? `Contesto cliente: ${clientContext}` : ''}

Fornisci:
1. Analisi del contenuto (urgenza, tipo di richiesta, sentimento)
2. Priorità (LOW, MEDIUM, HIGH, URGENT)
3. Suggerimento di risposta (opzionale)

Messaggio: "${messageContent}"
`;

    const response = await this.chat([
      { role: 'user', content: context }
    ]);

    // Parse response to extract structured data
    const lines = response.content.split('\n');
    let analysis = '';
    let priority = 'MEDIUM';
    let suggestedResponse = '';

    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('analisi')) {
        currentSection = 'analysis';
      } else if (trimmed.toLowerCase().includes('priorità')) {
        currentSection = 'priority';
        // Extract priority
        if (trimmed.includes('URGENT')) priority = 'URGENT';
        else if (trimmed.includes('HIGH')) priority = 'HIGH';
        else if (trimmed.includes('LOW')) priority = 'LOW';
        else priority = 'MEDIUM';
      } else if (trimmed.toLowerCase().includes('risposta')) {
        currentSection = 'response';
      } else if (trimmed && currentSection === 'analysis') {
        analysis += trimmed + ' ';
      } else if (trimmed && currentSection === 'response') {
        suggestedResponse += trimmed + ' ';
      }
    }

    return {
      analysis: analysis.trim() || response.content,
      priority,
      suggestedResponse: suggestedResponse.trim() || undefined,
    };
  }

  async generateDocumentSummary(documentText: string, documentType: string): Promise<string> {
    const response = await this.chat([
      {
        role: 'user',
        content: `Crea un riassunto conciso di questo documento di tipo "${documentType}" per uno studio geometra:\n\n${documentText.substring(0, 4000)}...`
      }
    ]);

    return response.content;
  }

  async classifyPracticeType(description: string): Promise<string> {
    const response = await this.chat([
      {
        role: 'user',
        content: `Classifica il tipo di pratica per uno studio geometra basandoti su questa descrizione: "${description}". Rispondi solo con uno di questi tipi: CONDONO, SCIA, PERMESSO_COSTRUIRE, CATASTO, TOPOGRAFIA, APE, SANATORIA, AGIBILITA, VARIANTE, ACCATASTAMENTO, VOLTURA, VISURA, ALTRO`
      }
    ]);

    return response.content.trim().toUpperCase();
  }

  async generateEmailTemplate(context: string, type: 'follow-up' | 'reminder' | 'update'): Promise<{
    subject: string;
    body: string;
  }> {
    const response = await this.chat([
      {
        role: 'user',
        content: `Genera un template email professionale per uno studio geometra.
Tipo: ${type}
Contesto: ${context}

Fornisci oggetto e corpo dell'email separati da "---"`
      }
    ]);

    const parts = response.content.split('---');
    return {
      subject: parts[0]?.trim() || 'Comunicazione Studio Geometra',
      body: parts[1]?.trim() || response.content,
    };
  }

  async saveConversation(
    userId: string, 
    messages: ChatMessage[], 
    context?: string
  ): Promise<string> {
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        context,
        messages: messages.map(m => ({
          ...m,
          timestamp: new Date().toISOString(),
        })),
        tokenCount: messages.reduce((total, msg) => total + msg.content.length, 0),
      },
    });

    return conversation.id;
  }

  async getConversations(userId: string, limit = 20) {
    return await prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateConfiguration(config: {
    provider: AIProvider;
    settings: any;
  }) {
    // Deactivate all existing configurations
    await prisma.aIConfiguration.updateMany({
      data: { isActive: false },
    });

    // Create new active configuration
    return await prisma.aIConfiguration.create({
      data: {
        ...config,
        isActive: true,
      },
    });
  }

  async testConnection(provider: AIProvider, config: any): Promise<boolean> {
    try {
      const testMessage = [{ role: 'user' as const, content: 'Test connection' }];

      switch (provider) {
        case AIProvider.OLLAMA:
          await this.chatWithOllama(testMessage, config);
          break;
        case AIProvider.OPENAI:
          await this.chatWithOpenAI(testMessage, config);
          break;
        case AIProvider.ANTHROPIC:
          await this.chatWithAnthropic(testMessage, config);
          break;
        case AIProvider.GEMINI:
          await this.chatWithGemini(testMessage, config);
          break;
        default:
          return false;
      }

      return true;
    } catch (error) {
      logger.error(`AI connection test failed for ${provider}:`, error);
      return false;
    }
  }
}

export const aiService = new AIService();
export default aiService;
