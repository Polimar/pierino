import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStatus,
  connect,
  disconnect,
  sendMessage,
  sendMedia,
  getMessages,
  getChats,
  getContacts,
  markAsRead,
  analyzeMessage,
  generateResponse,
} from '@/controllers/whatsappController';
import { authenticateToken, requireAnyRole } from '@/middleware/auth';
import { uploadLimiter, validateFileType } from '@/middleware/security';
import config from '@/config/env';

const router = Router();

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(config.WHATSAPP_MEDIA_PATH, 'outgoing'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Allow common media types for WhatsApp
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4',
      'video/mp4', 'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato per WhatsApp'));
    }
  },
});

// All routes require authentication
router.use(authenticateToken);
router.use(requireAnyRole);

// WhatsApp connection management
router.get('/status', getStatus);
router.post('/connect', connect);
router.post('/disconnect', disconnect);

// Messaging
router.post('/send', sendMessage);
router.post(
  '/send-media',
  uploadLimiter,
  upload.single('media'),
  validateFileType(['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'ogg', 'wav', 'm4a', 'mp4', 'webm', 'pdf', 'doc', 'docx']),
  sendMedia
);

// Messages and chats
router.get('/messages', getMessages);
router.get('/chats', getChats);
router.get('/contacts', getContacts);
router.patch('/messages/:messageId/read', markAsRead);

// AI features
router.post('/messages/:messageId/analyze', analyzeMessage);
router.post('/messages/:messageId/generate-response', generateResponse);

export default router;
