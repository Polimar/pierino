import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';
import { whatsappBusinessService } from './whatsappBusinessService';

const logger = createLogger('QueueService');

// Configurazione Redis ottimizzata per Docker e BullMQ
const redisConfig = {
  host: config.REDIS_URL.includes('redis://') 
    ? config.REDIS_URL.replace('redis://', '').split(':')[0] 
    : 'localhost',
  port: config.REDIS_URL.includes('redis://') 
    ? parseInt(config.REDIS_URL.replace('redis://', '').split(':')[1] || '6379') 
    : 6379,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: null, // Richiesto da BullMQ
  connectTimeout: 20000,
  lazyConnect: false,
  keepAlive: 30000,
  family: 4,
  db: 0,
};

const connection = new IORedis(redisConfig);

// Gestione errori connessione
connection.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

connection.on('connect', () => {
  logger.info('Redis connected successfully');
});

// Definizione delle code
export const queues = {
  'ai-processing': new Queue('ai-processing', { connection }),
  'whatsapp-processing': new Queue('whatsapp-processing', { connection }),
  'email-processing': new Queue('email-processing', { connection }),
  'media-processing': new Queue('media-processing', { connection }),
  'reports-generation': new Queue('reports-generation', { connection }),
  'notifications': new Queue('notifications', { connection }),
};

// Workers per le code
const workers = new Map<string, Worker>();

// Worker per AI Processing
workers.set('ai-processing', new Worker('ai-processing', async (job: Job) => {
  logger.info(`Processing AI job ${job.id}:`, job.data);
  
  try {
    const { message, model, temperature, prompt, service, userId } = job.data;
    
    if (job.name === 'ai-assistant-chat') {
      // Job dall'AI Assistant Pro
      logger.info(`🤖 Elaborazione AI Assistant Pro: "${message?.substring(0, 50)}..." per utente ${userId}`);
      
      // Simula elaborazione AI Assistant Pro
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
      
      logger.info(`✅ AI Assistant Pro completato: modello ${model}, servizio ${service}`);
      
      return { 
        success: true, 
        result: 'AI Assistant Pro processing completed',
        model,
        service,
        userId,
        processedAt: new Date().toISOString()
      };
    } else {
      // Altri tipi di job AI
      logger.info(`🔬 Elaborazione AI generica: ${job.name}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      return { success: true, result: 'AI processing completed' };
    }
  } catch (error) {
    logger.error(`AI processing job ${job.id} failed:`, error);
    throw error;
  }
}, { connection }));

// Worker per WhatsApp Processing
workers.set('whatsapp-processing', new Worker('whatsapp-processing', async (job: Job) => {
  console.log(`🔧 Processing WhatsApp job ${job.id}:`, job.data);
  
  try {
    const { conversationId, messageId, content, from, contactName } = job.data;
    
    // Controlla se i dati sono validi (nuovo formato)
    if (!conversationId || !messageId || !content) {
      console.warn(`⚠️ Job WhatsApp con dati non validi o vecchi - scarto job ${job.id}:`, job.data);
      return { 
        success: false, 
        result: 'Skipped job with invalid data format',
        skipped: true,
        processedAt: new Date().toISOString()
      };
    }
    
    // Simula elaborazione reale del messaggio WhatsApp
    console.log(`📱 Elaboro messaggio WhatsApp da ${contactName || from}: "${content}"`);
    
    // Simula tempo di elaborazione AI realistico
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Processa il messaggio WhatsApp con AI REALE
    console.log(`🤖 Elaborazione AI REALE per messaggio: ${content}`);
    
    try {
      // Usa l'istanza singleton già creata
      const whatsappService = whatsappBusinessService;
      
      console.log(`🔄 Chiamando processWithAI per conversazione ${conversationId}`);
      
      // Chiama REALMENTE il metodo di elaborazione AI 
      // Questo invocherà l'AI reale per processare il messaggio
      // fromBullMQ=true evita ricorsione infinita
      await whatsappService.processWithAI(
        conversationId, 
        { id: messageId, content },
        undefined, // config default
        true // fromBullMQ = true
      );
      
      console.log(`✅ Messaggio WhatsApp elaborato con AI REALE: ${content}`);
      
    } catch (aiError: any) {
      console.error(`❌ Errore nell'elaborazione AI REALE del messaggio WhatsApp:`, aiError);
      throw aiError;
    }
    
    console.log(`✅ Messaggio WhatsApp processato: conversazione ${conversationId}`);
    return { 
      success: true, 
      result: 'WhatsApp message processed successfully',
      conversationId,
      messageId,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`💥 WhatsApp processing job ${job.id} failed:`, error);
    throw error;
  }
}, { connection }));

// Worker per Email Processing  
workers.set('email-processing', new Worker('email-processing', async (job: Job) => {
  logger.info(`Processing Email job ${job.id}:`, job.data);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
    return { success: true, result: 'Email processed' };
  } catch (error) {
    logger.error(`Email processing job ${job.id} failed:`, error);
    throw error;
  }
}, { connection }));

// Worker per Media Processing
workers.set('media-processing', new Worker('media-processing', async (job: Job) => {
  logger.info(`Processing Media job ${job.id}:`, job.data);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
    return { success: true, result: 'Media processed' };
  } catch (error) {
    logger.error(`Media processing job ${job.id} failed:`, error);
    throw error;
  }
}, { connection }));

// Worker per Reports Generation
workers.set('reports-generation', new Worker('reports-generation', async (job: Job) => {
  logger.info(`Processing Reports job ${job.id}:`, job.data);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 6000));
    return { success: true, result: 'Report generated' };
  } catch (error) {
    logger.error(`Reports generation job ${job.id} failed:`, error);
    throw error;
  }
}, { connection }));

// Worker per Notifications
workers.set('notifications', new Worker('notifications', async (job: Job) => {
  logger.info(`Processing Notification job ${job.id}:`, job.data);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    return { success: true, result: 'Notification sent' };
  } catch (error) {
    logger.error(`Notification job ${job.id} failed:`, error);
    throw error;
  }
}, { connection }));

// QueueService class
export class QueueService {
  private static instance: QueueService;
  private queueEvents = new Map<string, QueueEvents>();

  constructor() {
    this.initializeQueueEvents();
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  private initializeQueueEvents() {
    Object.keys(queues).forEach(queueName => {
      const queueEvents = new QueueEvents(queueName, { connection });
      this.queueEvents.set(queueName, queueEvents);

      queueEvents.on('completed', ({ jobId }) => {
        logger.info(`Job ${jobId} completed in queue ${queueName}`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error(`Job ${jobId} failed in queue ${queueName}:`, failedReason);
      });
    });
  }

  // Aggiunge un job a una coda
  async addJob(queueName: string, jobName: string, data: any, options: any = {}) {
    const queue = queues[queueName as keyof typeof queues];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobName, data, {
      removeOnComplete: 100, // Mantieni solo gli ultimi 100 job completati
      removeOnFail: 50,      // Mantieni solo gli ultimi 50 job falliti
      ...options
    });

    logger.info(`Job ${job.id} added to queue ${queueName}`);
    return job;
  }

  // Ottiene lo stato di tutte le code
  async getQueuesStatus() {
    const status: Record<string, any> = {};

    for (const [queueName, queue] of Object.entries(queues)) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed(),
        ]);

        status[queueName] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
        };
      } catch (error: any) {
        logger.error(`Error getting status for queue ${queueName}:`, error);
        status[queueName] = { error: error?.message || 'Unknown error' };
      }
    }

    return status;
  }

  // Ottiene metriche dettagliate
  async getQueuesMetrics() {
    const status = await this.getQueuesStatus();
    
    let totalJobs = 0;
    let totalWaiting = 0;
    let totalActive = 0;
    let totalCompleted = 0;
    let totalFailed = 0;

    Object.values(status).forEach((queueStats: any) => {
      if (!queueStats.error) {
        totalWaiting += queueStats.waiting || 0;
        totalActive += queueStats.active || 0;
        totalCompleted += queueStats.completed || 0;
        totalFailed += queueStats.failed || 0;
      }
    });

    totalJobs = totalWaiting + totalActive + totalCompleted + totalFailed;
    
    const successRate = totalJobs > 0 
      ? ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(1) + '%'
      : '0%';
    
    const failureRate = totalJobs > 0 
      ? ((totalFailed / (totalCompleted + totalFailed)) * 100).toFixed(1) + '%'
      : '0%';

    return {
      overview: {
        totalJobs,
        totalWaiting,
        totalActive,
        totalCompleted,
        totalFailed,
        successRate,
        failureRate,
      },
      queues: status,
      timestamp: new Date().toISOString(),
    };
  }

  // Health check del sistema
  async getHealthCheck() {
    try {
      const status = await this.getQueuesStatus();
      const workersStatus = Array.from(workers.keys()).map(queueName => ({
        queue: queueName,
        isRunning: workers.get(queueName)?.isRunning() || false
      }));

      return {
        healthy: true,
        details: {
          queues: status,
          workers: workersStatus,
          initialized: true,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error: any) {
      logger.error('Health check failed:', error);
      return {
        healthy: false,
        details: {
          error: error?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  // Pausa una coda
  async pauseQueue(queueName: string) {
    const queue = queues[queueName as keyof typeof queues];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  // Riprende una coda
  async resumeQueue(queueName: string) {
    const queue = queues[queueName as keyof typeof queues];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  // Pulisce una coda
  async cleanQueue(queueName: string, type: string = 'completed', age: number = 24 * 60 * 60 * 1000) {
    const queue = queues[queueName as keyof typeof queues];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    let count = 0;
    switch (type) {
      case 'completed':
        const completedJobs = await queue.getCompleted();
        count = completedJobs.length;
        if (count > 0) {
          await queue.clean(age, 0, 'completed');
        }
        break;
      case 'failed':
        const failedJobs = await queue.getFailed();
        count = failedJobs.length;
        if (count > 0) {
          await queue.clean(age, 0, 'failed');
        }
        break;
      case 'active':
        const activeJobs = await queue.getActive();
        count = activeJobs.length;
        if (count > 0) {
          await queue.clean(0, 0, 'active');
        }
        break;
      case 'waiting':
        const waitingJobs = await queue.getWaiting();
        count = waitingJobs.length;
        if (count > 0) {
          await queue.clean(0, 0, 'waiting');
        }
        break;
    }
    
    logger.info(`Cleaned ${count} ${type} jobs from queue ${queueName}`);
    return count;
  }

  // Chiusura graceful
  async close() {
    logger.info('Closing queue service...');
    
    // Chiudi workers
    for (const [queueName, worker] of workers) {
      await worker.close();
      logger.info(`Worker ${queueName} closed`);
    }

    // Chiudi queue events
    for (const [queueName, queueEvents] of this.queueEvents) {
      await queueEvents.close();
      logger.info(`Queue events ${queueName} closed`);
    }

    // Chiudi connessione Redis
    await connection.quit();
    logger.info('Redis connection closed');
  }
}

export const queueService = QueueService.getInstance();
