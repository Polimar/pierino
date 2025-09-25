import { AITool, AIToolContext, AIToolResult } from '../types/aiTypes';
import { whatsappMessageTool } from '../tools/whatsappMessageTool';
import { appointmentTool } from '../tools/appointmentTool';
import { clientSearchTool } from '../tools/clientSearchTool';
import { documentSearchTool } from '../tools/documentSearchTool';
import { practiceTool } from '../tools/practiceTool';

export class AIToolsService {
  private tools: Map<string, AITool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Registra tutti i tools disponibili
    this.registerTool(whatsappMessageTool);
    this.registerTool(appointmentTool);
    this.registerTool(clientSearchTool);
    this.registerTool(documentSearchTool);
    this.registerTool(practiceTool);
  }

  registerTool(tool: AITool): void {
    console.log(`Registering AI tool: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  getTools(): AITool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  getToolsForOllama(): any[] {
    return this.getTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  async executeTool(name: string, parameters: Record<string, any>, context?: AIToolContext): Promise<AIToolResult> {
    const tool = this.getTool(name);
    
    if (!tool) {
      return {
        success: false,
        message: `Tool "${name}" non trovato`,
        error: `Unknown tool: ${name}`
      };
    }

    try {
      console.log(`Executing AI tool: ${name} with params:`, parameters);
      const result = await tool.execute(parameters, context);
      console.log(`Tool ${name} result:`, result);
      return result;
    } catch (error: any) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        success: false,
        message: `Errore durante l'esecuzione del tool ${name}`,
        error: error.message
      };
    }
  }

  validateParameters(toolName: string, parameters: Record<string, any>): { valid: boolean; errors: string[] } {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { valid: false, errors: [`Tool "${toolName}" non trovato`] };
    }

    const errors: string[] = [];
    const required = tool.parameters.required || [];

    // Verifica parametri obbligatori
    for (const param of required) {
      if (!(param in parameters) || parameters[param] === undefined || parameters[param] === null) {
        errors.push(`Parametro obbligatorio mancante: ${param}`);
      }
    }

    // Verifica tipi (basic validation)
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramSchema = tool.parameters.properties[paramName];
      if (paramSchema) {
        if (paramSchema.type === 'string' && typeof paramValue !== 'string') {
          errors.push(`Parametro ${paramName} deve essere una stringa`);
        }
        if (paramSchema.type === 'number' && typeof paramValue !== 'number') {
          errors.push(`Parametro ${paramName} deve essere un numero`);
        }
        if (paramSchema.type === 'boolean' && typeof paramValue !== 'boolean') {
          errors.push(`Parametro ${paramName} deve essere un booleano`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getSystemPrompt(): string {
    const toolDescriptions = this.getTools().map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');

    return `Sei l'AI Assistant di Studio Gori, uno studio tecnico professionale.

HAI ACCESSO AI SEGUENTI TOOLS:
${toolDescriptions}

ISTRUZIONI:
1. Rispondi sempre in italiano professionale e cortese
2. Usa i tools quando necessario per aiutare il cliente
3. Per WhatsApp: usa send_whatsapp_message per inviare risposte
4. Per appuntamenti: usa schedule_appointment per fissare incontri
5. Per clienti: usa search_client per trovare informazioni
6. Per documenti: usa search_documents per ricerche
7. Per pratiche: usa manage_practice per gestire pratiche

ESEMPI DI USO TOOLS:
- "Vorrei fissare un appuntamento" → usa schedule_appointment
- "Chi è il cliente Mario Rossi?" → usa search_client
- "Cercami il documento X" → usa search_documents
- "Qual è lo stato della pratica Y?" → usa manage_practice

Mantieni sempre un tono professionale ma amichevole, tipico di uno studio tecnico.`;
  }
}

// Singleton instance
export const aiToolsService = new AIToolsService();
