import { Router } from 'express';
import { aiService } from '../services/aiService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// Chat endpoint for AI Assistant Pro
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, model, temperature, prompt, timeout } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Messaggio non valido'
      });
    }

    // Verifica che il modello sia disponibile, altrimenti usa fallback
    let validModel = model || 'mistral:7b';
    try {
      const modelsResponse = await axios.get('http://ollama:11434/api/tags');
      const availableModels = modelsResponse.data.models?.map((m: any) => m.name) || [];
      
      if (model && !availableModels.includes(model)) {
        console.warn(`Model ${model} not found, using fallback mistral:7b`);
        validModel = 'mistral:7b';
      }
    } catch (modelCheckError) {
      console.warn('Could not check available models, using fallback mistral:7b');
      validModel = 'mistral:7b';
    }

    const config = {
      model: validModel,
      temperature: temperature || 0.7,
      timeout: timeout || 30000,
      prompt: prompt || 'Sei un assistente AI professionale. Rispondi in modo chiaro e utile.',
      ollamaEndpoint: 'http://ollama:11434'
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

// Get available models from Ollama
router.get('/models', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const response = await axios.get('http://ollama:11434/api/tags');
    const models = response.data.models?.map((model: any) => model.name) || [];
    res.json({ success: true, data: models });
  } catch (error: any) {
    console.error('Error fetching Ollama models:', error);
    res.json({ success: true, data: ['mistral:7b'] }); // Fallback
  }
});

// Pull a new model to Ollama
router.post('/pull-model', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { modelName } = req.body;
    if (!modelName) {
      return res.status(400).json({ success: false, message: 'modelName richiesto' });
    }

    console.log(`Pulling model: ${modelName}`);
    
    const response = await axios.post('http://ollama:11434/api/pull', {
      name: modelName
    }, {
      timeout: 300000 // 5 minuti
    });

    res.json({ 
      success: true, 
      message: `Modello ${modelName} scaricato con successo`,
      data: response.data 
    });
  } catch (error: any) {
    console.error('Error pulling model:', error);
    res.status(500).json({ 
      success: false, 
      message: `Errore nel download del modello: ${error.message}` 
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

// Test endpoint for AI tools functionality
router.post('/test-tools', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message required'
      });
    }

    const messages = [
      { role: 'user' as const, content: message }
    ];

    const aiContext = {
      conversationId: 'test-conversation',
      userPhone: '+39123456789',
      messageHistory: []
    };

    const response = await aiService.chatWithTools(messages, context || aiContext);

    res.json({
      success: true,
      message: 'AI tools test successful',
      data: {
        response: response.content,
        toolsUsed: response.toolCalls?.length || 0,
        toolCalls: response.toolCalls
      }
    });
  } catch (error: any) {
    console.error('AI tools test error:', error);
    res.status(500).json({
      success: false,
      message: 'AI tools test failed',
      error: error.message
    });
  }
});

export default router;
