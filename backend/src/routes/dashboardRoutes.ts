import { Router } from 'express';
import {
  getDashboardStats,
  getRecentActivities,
  getUrgentActivities,
  getQuickActions
} from '../controllers/dashboardController';

const router = Router();

// GET /api/dashboard/stats - Statistiche dashboard
router.get('/stats', getDashboardStats);

// GET /api/dashboard/activities/recent - Attività recenti
router.get('/activities/recent', getRecentActivities);

// GET /api/dashboard/activities/urgent - Attività urgenti
router.get('/activities/urgent', getUrgentActivities);

// GET /api/dashboard/quick-actions - Azioni rapide
router.get('/quick-actions', getQuickActions);

export default router;
