import { Router, Request, Response } from 'express';
import { queueService } from '../services/queueService';
import { authMiddleware } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('QueueRoutes');

// Rate limiting semplice per evitare accessi multipli che sovraccaricano il sistema
const activeRequests = new Map<string, number>();

const simpleRateLimit = (req: Request, res: Response, next: any) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 30;
  
  // Pulisci richieste vecchie
  const requestTimes = activeRequests.get(ip) || 0;
  if (now - requestTimes > windowMs) {
    activeRequests.delete(ip);
  }
  
  const currentCount = activeRequests.get(ip) || 0;
  if (currentCount >= maxRequests) {
    return res.status(429).json({
      error: 'Troppe richieste al sistema code. Riprova tra qualche secondo.',
      retryAfter: '60 seconds'
    });
  }
  
  activeRequests.set(ip, currentCount + 1);
  next();
};

// Applica autenticazione e rate limiting a tutte le routes
router.use(authMiddleware);
router.use(simpleRateLimit);

// GET /api/queues/status - Stato di tutte le code
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await queueService.getQueuesStatus();
    
    res.json({
      success: true,
      data: {
        queues: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error getting queues status:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello stato delle code',
      details: error.message
    });
  }
});

// GET /api/queues/status/:queueName - Stato di una coda specifica
router.get('/status/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const allStatus = await queueService.getQueuesStatus();
    
    if (!allStatus[queueName]) {
      return res.status(404).json({
        success: false,
        error: `Coda ${queueName} non trovata`
      });
    }

    res.json({
      success: true,
      data: {
        queue: queueName,
        stats: allStatus[queueName],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`Error getting queue ${req.params.queueName} status:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello stato della coda',
      details: error.message
    });
  }
});

// GET /api/queues/metrics - Metriche dettagliate
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await queueService.getQueuesMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    logger.error('Error getting queues metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle metriche delle code',
      details: error.message
    });
  }
});

// GET /api/queues/health - Health check del sistema code
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await queueService.getHealthCheck();
    
    const statusCode = health.healthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error: any) {
    logger.error('Error getting queues health:', error);
    res.status(503).json({
      healthy: false,
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST /api/queues/pause/:queueName - Pausa una coda
router.post('/pause/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    await queueService.pauseQueue(queueName);
    
    logger.info(`Queue ${queueName} paused by user ${req.user?.id}`);
    
    res.json({
      success: true,
      message: `Coda ${queueName} messa in pausa`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error(`Error pausing queue ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nella pausa della coda',
      details: error.message
    });
  }
});

// POST /api/queues/resume/:queueName - Riprende una coda
router.post('/resume/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    await queueService.resumeQueue(queueName);
    
    logger.info(`Queue ${queueName} resumed by user ${req.user?.id}`);
    
    res.json({
      success: true,
      message: `Coda ${queueName} ripresa`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error(`Error resuming queue ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nella ripresa della coda',
      details: error.message
    });
  }
});

// POST /api/queues/pause-all - Pausa tutte le code
router.post('/pause-all', async (req: Request, res: Response) => {
  try {
    const queueNames = ['ai-processing', 'whatsapp-processing', 'email-processing', 'media-processing', 'reports-generation', 'notifications'];
    
    for (const queueName of queueNames) {
      try {
        await queueService.pauseQueue(queueName);
      } catch (error: any) {
        logger.warn(`Failed to pause queue ${queueName}:`, error.message);
      }
    }
    
    logger.info(`All queues paused by user ${req.user?.id}`);
    
    res.json({
      success: true,
      message: 'Tutte le code sono state messe in pausa',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error pausing all queues:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella pausa di tutte le code',
      details: error.message
    });
  }
});

// POST /api/queues/resume-all - Riprende tutte le code
router.post('/resume-all', async (req: Request, res: Response) => {
  try {
    const queueNames = ['ai-processing', 'whatsapp-processing', 'email-processing', 'media-processing', 'reports-generation', 'notifications'];
    
    for (const queueName of queueNames) {
      try {
        await queueService.resumeQueue(queueName);
      } catch (error: any) {
        logger.warn(`Failed to resume queue ${queueName}:`, error.message);
      }
    }
    
    logger.info(`All queues resumed by user ${req.user?.id}`);
    
    res.json({
      success: true,
      message: 'Tutte le code sono state riprese',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error resuming all queues:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella ripresa di tutte le code',
      details: error.message
    });
  }
});

// POST /api/queues/clean/:queueName - Pulisce una coda
router.post('/clean/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const { type = 'completed', age = 24 * 60 * 60 * 1000 } = req.body;
    
    const cleanedCount = await queueService.cleanQueue(queueName, type, age);
    
    logger.info(`Queue ${queueName} cleaned (${type}) by user ${req.user?.id}: ${cleanedCount} jobs removed`);
    
    res.json({
      success: true,
      message: `Rimossi ${cleanedCount} job ${type} dalla coda ${queueName}`,
      data: {
        cleanedCount,
        type,
        age
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error(`Error cleaning queue ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nella pulizia della coda',
      details: error.message
    });
  }
});

// POST /api/queues/clean-all - Pulisce tutte le code
router.post('/clean-all', async (req: Request, res: Response) => {
  try {
    const { type = 'completed', age = 24 * 60 * 60 * 1000 } = req.body;
    const queueNames = ['ai-processing', 'whatsapp-processing', 'email-processing', 'media-processing', 'reports-generation', 'notifications'];
    
    let totalCleaned = 0;
    const results: Record<string, number> = {};
    
    for (const queueName of queueNames) {
      try {
        const cleanedCount = await queueService.cleanQueue(queueName, type, age);
        results[queueName] = cleanedCount;
        totalCleaned += cleanedCount;
      } catch (error: any) {
        logger.warn(`Failed to clean queue ${queueName}:`, error.message);
        results[queueName] = 0;
      }
    }
    
    logger.info(`All queues cleaned (${type}) by user ${req.user?.id}: ${totalCleaned} total jobs removed`);
    
    res.json({
      success: true,
      message: `Rimossi ${totalCleaned} job ${type} da tutte le code`,
      data: {
        totalCleaned,
        results,
        type,
        age
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error cleaning all queues:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella pulizia di tutte le code',
      details: error.message
    });
  }
});

// POST /api/queues/test/:queueName - Aggiunge un job di test
router.post('/test/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const { data = {} } = req.body;
    
    const job = await queueService.addJob(
      queueName, 
      'test-job', 
      {
        ...data,
        addedBy: req.user?.id,
        timestamp: new Date().toISOString()
      }
    );
    
    logger.info(`Test job added to queue ${queueName} by user ${req.user?.id}: ${job.id}`);
    
    res.json({
      success: true,
      message: `Job di test aggiunto alla coda ${queueName}`,
      data: {
        jobId: job.id,
        queue: queueName,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`Error adding test job to queue ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiunta del job di test',
      details: error.message
    });
  }
});

export default router;
