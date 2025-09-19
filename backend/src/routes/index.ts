import { Router } from 'express';
import authRoutes from './authRoutes';
import clientRoutes from './clientRoutes';
import practiceRoutes from './practiceRoutes';
import whatsappRoutes from './whatsappRoutes';
import emailRoutes from './emailRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Geometra Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/practices', practiceRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/emails', emailRoutes);

export default router;