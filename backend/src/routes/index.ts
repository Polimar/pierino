import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import usersRoutes from './usersRoutes';
import settingsRoutes from './settingsRoutes';
import whatsappRoutes from './whatsappRoutes';
import aiRoutes from './aiRoutes';
import emailApiRoutes from './emailApiRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Studio Gori Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/settings', settingsRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/ai', aiRoutes);
router.use('/emails', emailApiRoutes);

// API Queue Routes con dati reali
let queueService: any = null;

// Inizializzazione lazy del servizio queue
const getQueueService = async () => {
  if (!queueService) {
    try {
      const { QueueService } = await import('../services/queueService');
      queueService = QueueService.getInstance();
      console.log('✅ Queue service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize queue service:', error);
      throw error;
    }
  }
  return queueService;
};

router.get('/queues/status', async (req, res) => {
  try {
    const service = await getQueueService();
    const status = await service.getQueuesStatus();
    
    res.json({
      success: true,
      data: {
        queues: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Queue status error:', error);
    // Fallback a dati demo se il servizio non è disponibile
    res.json({
      success: true,
      data: {
        queues: {
          'ai-processing': { waiting: 2, active: 1, completed: 45, failed: 0, delayed: 0 },
          'whatsapp-processing': { waiting: 0, active: 0, completed: 128, failed: 2, delayed: 0 },
          'email-processing': { waiting: 1, active: 0, completed: 67, failed: 1, delayed: 0 },
          'media-processing': { waiting: 3, active: 2, completed: 23, failed: 0, delayed: 1 },
          'reports-generation': { waiting: 0, active: 0, completed: 12, failed: 0, delayed: 0 },
          'notifications': { waiting: 1, active: 0, completed: 89, failed: 0, delayed: 0 }
        },
        timestamp: new Date().toISOString(),
        note: 'Demo mode - Redis unavailable'
      }
    });
  }
});

router.get('/queues/metrics', async (req, res) => {
  try {
    const service = await getQueueService();
    const metrics = await service.getQueuesMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('Queue metrics error:', error);
    // Fallback a dati demo
    res.json({
      success: true,
      data: {
        overview: {
          totalJobs: 374,
          totalWaiting: 7,
          totalActive: 3,
          totalCompleted: 364,
          totalFailed: 3,
          successRate: '99.2%',
          failureRate: '0.8%',
        },
        queues: {
          'ai-processing': { waiting: 2, active: 1, completed: 45, failed: 0, delayed: 0 },
          'whatsapp-processing': { waiting: 0, active: 0, completed: 128, failed: 2, delayed: 0 },
          'email-processing': { waiting: 1, active: 0, completed: 67, failed: 1, delayed: 0 },
          'media-processing': { waiting: 3, active: 2, completed: 23, failed: 0, delayed: 1 },
          'reports-generation': { waiting: 0, active: 0, completed: 12, failed: 0, delayed: 0 },
          'notifications': { waiting: 1, active: 0, completed: 89, failed: 0, delayed: 0 }
        },
        timestamp: new Date().toISOString(),
        note: 'Demo mode - Redis unavailable'
      }
    });
  }
});

export default router;