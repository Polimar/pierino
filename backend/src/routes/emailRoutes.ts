import { Router } from 'express';
import {
  getEmails,
  sendEmail,
  sendTemplateEmail,
  markAsRead,
  getTemplates,
  getEmailStatus,
  sendPracticeReminder,
  sendPracticeCompleted,
  sendAppointmentReminder,
} from '../controllers/emailController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireAnyRole);

// Email management
router.get('/', getEmails);
router.post('/send', sendEmail);
router.post('/send-template', sendTemplateEmail);
router.patch('/:id/read', markAsRead);

// Templates and status
router.get('/templates', getTemplates);
router.get('/status', getEmailStatus);

// Automated emails
router.post('/practices/:practiceId/reminder', sendPracticeReminder);
router.post('/practices/:practiceId/completed', sendPracticeCompleted);
router.post('/appointments/:appointmentId/reminder', sendAppointmentReminder);

export default router;
