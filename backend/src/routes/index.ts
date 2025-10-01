import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import usersRoutes from './usersRoutes';
import settingsRoutes from './settingsRoutes';
import whatsappRoutes from './whatsappRoutes';
import aiRoutes from './aiRoutes';
import emailApiRoutes from './emailApiRoutes';
import queueRoutes from './queueRoutes';

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
router.use('/queues', queueRoutes);

export default router;