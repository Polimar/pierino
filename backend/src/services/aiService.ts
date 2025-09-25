import axios from 'axios';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database';
import config from '../config/env';
import { createLogger } from '../utils/logger';
import { AIProvider } from '@prisma/client';
import { aiToolsService } from './aiToolsService';
import { AIResponseWithTools, ChatMessageWithTools, AIToolContext } from '../types/aiTypes';

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

  async chatWithConfig(messages: ChatMessage[], chatConfig: any): Promise<AIResponse> {
    try {
      // Use OLLAMA by default for AI Assistant Pro
      return await this.chatWithOllama(messages, {
        ollamaEndpoint: chatConfig.ollamaEndpoint || 'http://ollama:11434',
        ollamaModel: chatConfig.model || 'mistral:7b',
        temperature: chatConfig.temperature || 0.7,
      });
    } catch (error: any) {
      console.error('AI Chat with config error:', error.message || error);
      throw error;
    }
  }

  /**
   * Chat with AI including function calling capabilities
   */
  async chatWithTools(
    messages: ChatMessageWithTools[], 
    context?: AIToolContext,
    maxIterations: number = 5
  ): Promise<AIResponseWithTools> {
    try {
      console.log('Starting chat with tools, context:', context);
      
      let currentMessages = [...messages];
      let iteration = 0;
      
      // Aggiungi il system prompt con informazioni sui tools
      const systemPrompt = aiToolsService.getSystemPrompt();
      const toolsDefinition = aiToolsService.getToolsForOllama();
      
      currentMessages.unshift({
        role: 'system',
        content: systemPrompt
      });

      while (iteration < maxIterations) {
        iteration++;
        console.log(`Tool iteration ${iteration}/${maxIterations}`);

        // Per ora usiamo Ollama, ma senza function calling nativo
        // Simuliamo function calling tramite parsing del testo
        const response = await this.chatWithOllamaTools(currentMessages, toolsDefinition, context);
        
        // Se non ci sono tool calls, ritorna la risposta
        if (!response.toolCalls || response.toolCalls.length === 0) {
          return response;
        }

        // Esegui i tool calls
        for (const toolCall of response.toolCalls) {
          try {
            const toolResult = await aiToolsService.executeTool(
              toolCall.name,
              JSON.parse(toolCall.arguments),
              context
            );

            // Aggiungi il risultato del tool alla conversazione
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(toolResult),
              toolCallId: `${toolCall.name}_${iteration}`,
              name: toolCall.name
            });

            console.log(`Tool ${toolCall.name} executed:`, toolResult);

          } catch (error: any) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify({
                success: false,
                message: `Errore nell'esecuzione del tool ${toolCall.name}`,
                error: error.message
              }),
              toolCallId: `${toolCall.name}_${iteration}_error`,
              name: toolCall.name
            });
          }
        }

        // Continua la conversazione con i risultati dei tools
      }

      // Se raggiungiamo il limite di iterazioni, ritorna l'ultima risposta
      throw new Error('Raggiunto limite massimo di iterazioni per function calling');

    } catch (error: any) {
      console.error('Error in chatWithTools:', error);
      throw error;
    }
  }

  /**
   * Chat with Ollama simulando function calling
   */
  private async chatWithOllamaTools(
    messages: ChatMessageWithTools[], 
    tools: any[],
    context?: AIToolContext
  ): Promise<AIResponseWithTools> {
    try {
      // Prepara i messaggi per Ollama
      const ollamaMessages = messages.map(msg => ({
        role: msg.role === 'tool' ? 'assistant' : msg.role,
        content: msg.role === 'tool' 
          ? `Tool result for ${msg.name}: ${msg.content}`
          : msg.content
      }));

      // Aggiungi istruzioni per function calling
      const toolsDescription = tools.map(tool => 
        `${tool.function.name}: ${tool.function.description}`
      ).join('\n');

      ollamaMessages.push({
        role: 'system',
        content: `TOOLS DISPONIBILI:
${toolsDescription}

Per usare un tool, scrivi la risposta in questo formato:
TOOL_CALL: nome_del_tool
PARAMETERS: {"param1": "value1", "param2": "value2"}
REASON: Motivo per cui stai usando questo tool

Se non hai bisogno di usare tools, rispondi normalmente in italiano.`
      });

      const response = await axios.post(`http://ollama:11434/api/chat`, {
        model: 'mistral:7b',
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2048,
        },
      }, {
        timeout: 30000, // Ridotto a 30 secondi
      });

      const responseContent = response.data.message.content;
      console.log('Ollama response:', responseContent);

      // Parse per tool calls
      const toolCalls = this.parseToolCalls(responseContent);

      return {
        content: responseContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };

    } catch (error: any) {
      console.error('Error in chatWithOllamaTools:', error.message || error);
      throw error;
    }
  }

  /**
   * Parse tool calls dal testo di risposta
   */
  private parseToolCalls(content: string): Array<{name: string, arguments: string}> {
    const toolCalls: Array<{name: string, arguments: string}> = [];

    // Cerca pattern TOOL_CALL: e PARAMETERS:
    const toolCallRegex = /TOOL_CALL:\s*(\w+)\s*\nPARAMETERS:\s*(\{[^}]+\})/gi;
    let match;

    while ((match = toolCallRegex.exec(content)) !== null) {
      const toolName = match[1].trim();
      const parameters = match[2].trim();

      try {
        // Valida che sia JSON valido
        JSON.parse(parameters);
        toolCalls.push({
          name: toolName,
          arguments: parameters
        });
      } catch (error) {
        console.error('Invalid JSON in tool call parameters:', parameters);
      }
    }

    return toolCalls;
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
        throw new Error('Provider Anthropic non supportato nella build corrente');
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
        timeout: 30000, // Ridotto a 30 secondi
      });

      return {
        content: response.data.message.content,
      };
    } catch (error: any) {
      // Log solo il messaggio di errore, non l'oggetto completo per evitare circular reference
      console.error('Error with Ollama chat:', error.message || error);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Servizio Ollama non raggiungibile');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Host Ollama non trovato');
      } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
        throw new Error('Timeout nella comunicazione con Ollama (>30s)');
      } else {
        throw new Error(`Errore Ollama: ${error.message || 'Errore sconosciuto'}`);
      }
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
      console.error('Error with OpenAI chat:', error);
      throw new Error('Errore nella comunicazione con OpenAI');
    }
  }

  private async chatWithAnthropic(messages: ChatMessage[], config: any): Promise<AIResponse> {
    throw new Error('Anthropic integration non ancora compatibile con il nuovo schema.');
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
      console.error('Error with Gemini chat:', error);
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
      console.error(`AI connection test failed for ${provider}:`, error);
      return false;
    }
  }
}

export const aiService = new AIService();
export default aiService;
