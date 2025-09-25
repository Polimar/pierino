import { AITool, AIToolContext, AIToolResult } from '../types/aiTypes';
import { whatsappBusinessService } from '../services/whatsappBusinessService';

export const whatsappMessageTool: AITool = {
  name: 'send_whatsapp_message',
  description: 'Invia un messaggio WhatsApp a un cliente specifico',
  parameters: {
    type: 'object',
    properties: {
      phoneNumber: {
        type: 'string',
        description: 'Numero di telefono del destinatario (formato: +39xxxxxxxxxx)'
      },
      message: {
        type: 'string',
        description: 'Il testo del messaggio da inviare'
      },
      messageType: {
        type: 'string',
        description: 'Tipo di messaggio (text, template)',
        enum: ['text', 'template']
      }
    },
    required: ['phoneNumber', 'message']
  },
  execute: async (params: Record<string, any>, context?: AIToolContext): Promise<AIToolResult> => {
    try {
      const { phoneNumber, message, messageType = 'text' } = params;

      // Valida il numero di telefono
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return {
          success: false,
          message: 'Numero di telefono non valido',
          error: 'Invalid phone number'
        };
      }

      // Pulisci e formatta il numero
      const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      if (!cleanPhoneNumber.startsWith('+')) {
        return {
          success: false,
          message: 'Il numero deve iniziare con il prefisso internazionale (+39 per l\'Italia)',
          error: 'Phone number must include country code'
        };
      }

      // Verifica che il messaggio non sia vuoto
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return {
          success: false,
          message: 'Il messaggio non può essere vuoto',
          error: 'Message cannot be empty'
        };
      }

      // Invia il messaggio tramite WhatsApp Business Service
      const result = await whatsappBusinessService.sendMessage({
        to: cleanPhoneNumber,
        type: messageType,
        text: {
          body: message.trim()
        }
      });

      if (result.success) {
        return {
          success: true,
          message: `Messaggio inviato con successo a ${phoneNumber}`,
          data: {
            messageId: result.data?.messageId,
            phoneNumber: cleanPhoneNumber,
            message: message.trim(),
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: `Errore nell'invio del messaggio: ${result.message}`,
          error: result.message
        };
      }

    } catch (error: any) {
      console.error('WhatsApp message tool error:', error);
      return {
        success: false,
        message: 'Errore interno durante l\'invio del messaggio WhatsApp',
        error: error.message
      };
    }
  }
};
