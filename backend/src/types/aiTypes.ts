export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      required?: boolean;
    }>;
    required: string[];
  };
  execute: (params: Record<string, any>, context?: AIToolContext) => Promise<AIToolResult>;
}

export interface AIToolContext {
  conversationId: string;
  userId?: string;
  userPhone: string;
  messageHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}

export interface AIToolResult {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

export interface AIFunctionCall {
  name: string;
  arguments: string;
}

export interface AIResponseWithTools {
  content: string;
  toolCalls?: AIFunctionCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatMessageWithTools {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: AIFunctionCall[];
  toolCallId?: string;
  name?: string; // For tool responses
}
