import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  changePassword,
} from '@/controllers/authController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

// Admin only routes
router.post('/register', authenticateToken, requireAdmin, register);

export default router;
