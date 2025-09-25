import { Router } from 'express';
import { aiService } from '../services/aiService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Chat endpoint for AI Assistant Pro
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, model, temperature, prompt } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Messaggio non valido'
      });
    }

    const config = {
      model: model || 'mistral:7b',
      temperature: temperature || 0.7,
      prompt: prompt || 'Sei un assistente AI professionale. Rispondi in modo chiaro e utile.',
    };

    console.log(`AI Chat request: model=${config.model}, temp=${config.temperature}, message length=${message.length}`);

    const messages = [
      { role: 'system' as const, content: config.prompt },
      { role: 'user' as const, content: message }
    ];

    const response = await aiService.chatWithConfig(messages, config);

    res.json({
      success: true,
      data: {
        response: response.content,
        model: config.model,
        temperature: config.temperature
      }
    });

  } catch (error: any) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la generazione della risposta AI',
      error: error.message
    });
  }
});

// Test endpoint for AI functionality
router.get('/test', async (req, res) => {
  try {
    const response = await aiService.chatWithConfig([
      { role: 'user' as const, content: 'Test connection' }
    ], {
      model: 'mistral:7b',
      temperature: 0.7,
    });

    res.json({
      success: true,
      message: 'AI test successful',
      response: response.content
    });
  } catch (error: any) {
    console.error('AI test error:', error);
    res.status(500).json({
      success: false,
      message: 'AI test failed',
      error: error.message
    });
  }
});

export default router;
