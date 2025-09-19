import { Router } from 'express';
import {
  getPractices,
  getPractice,
  createPractice,
  updatePractice,
  deletePractice,
  getPracticeStats,
} from '@/controllers/practiceController';
import { authenticateToken, requireAnyRole } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireAnyRole);

// Routes
router.get('/', getPractices);
router.get('/stats', getPracticeStats);
router.get('/:id', getPractice);
router.post('/', createPractice);
router.put('/:id', updatePractice);
router.delete('/:id', deletePractice);

export default router;
