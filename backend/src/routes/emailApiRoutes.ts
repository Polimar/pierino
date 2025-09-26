import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailApiRoutes');
const router = Router();

// GET /api/emails - Fetch emails for current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { folder = 'inbox', page = '1', limit = '50' } = req.query;
    const userId = req.user!.id;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause: any = {};

    switch (folder) {
      case 'inbox':
        whereClause = {
          direction: 'INBOUND',
          isArchived: false,
          clientId: { in: await getUserClientIds(userId) }
        };
        break;
      case 'sent':
        whereClause = {
          direction: 'OUTBOUND',
          isArchived: false,
          sentBy: userId
        };
        break;
      case 'archive':
        whereClause = {
          isArchived: true,
          OR: [
            { clientId: { in: await getUserClientIds(userId) } },
            { sentBy: userId }
          ]
        };
        break;
      case 'drafts':
        whereClause = {
          status: 'DRAFT',
          sentBy: userId
        };
        break;
      default:
        whereClause = {
          OR: [
            { clientId: { in: await getUserClientIds(userId) } },
            { sentBy: userId }
          ]
        };
    }

    const emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    res.json(emails);
  } catch (error) {
    logger.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle email'
    });
  }
});

// GET /api/emails/:id - Get specific email
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const email = await prisma.email.findFirst({
      where: {
        id,
        OR: [
          { clientId: { in: await getUserClientIds(userId) } },
          { sentBy: userId }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true
          }
        }
      }
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email non trovata'
      });
    }

    res.json(email);
  } catch (error) {
    logger.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'email'
    });
  }
});

// POST /api/emails/send - Send new email
router.post('/send', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { to, cc, bcc, subject, content, priority = 'NORMAL' } = req.body;
    const userId = req.user!.id;

    if (!to || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Destinatario, oggetto e contenuto sono obbligatori'
      });
    }

    // Send email via email service
    const messageId = await emailService.sendEmail(to, subject, content, content);

    // Save to database
    const email = await prisma.email.create({
      data: {
        subject,
        from: await getFromAddress(),
        to,
        cc: cc || '',
        bcc: bcc || '',
        content,
        html: content,
        messageId,
        priority,
        status: 'SENT',
        direction: 'OUTBOUND',
        isRead: true,
        isStarred: false,
        isArchived: false,
        sentAt: new Date(),
        sentBy: userId
      }
    });

    res.json({
      success: true,
      message: 'Email inviata con successo',
      data: { id: email.id, messageId }
    });

  } catch (error) {
    logger.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Errore nell\'invio dell\'email'
    });
  }
});

// PATCH /api/emails/:id/read - Mark email as read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const email = await prisma.email.findFirst({
      where: {
        id,
        OR: [
          { clientId: { in: await getUserClientIds(userId) } },
          { sentBy: userId }
        ]
      }
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email non trovata'
      });
    }

    await prisma.email.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Email marcata come letta'
    });

  } catch (error) {
    logger.error('Error marking email as read:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dell\'email'
    });
  }
});

// PATCH /api/emails/:id/star - Toggle star status
router.patch('/:id/star', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const email = await prisma.email.findFirst({
      where: {
        id,
        OR: [
          { clientId: { in: await getUserClientIds(userId) } },
          { sentBy: userId }
        ]
      }
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email non trovata'
      });
    }

    await prisma.email.update({
      where: { id },
      data: {
        isStarred: !email.isStarred
      }
    });

    res.json({
      success: true,
      message: 'Stato stella aggiornato'
    });

  } catch (error) {
    logger.error('Error toggling star:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della stella'
    });
  }
});

// PATCH /api/emails/:id/archive - Toggle archive status
router.patch('/:id/archive', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const email = await prisma.email.findFirst({
      where: {
        id,
        OR: [
          { clientId: { in: await getUserClientIds(userId) } },
          { sentBy: userId }
        ]
      }
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email non trovata'
      });
    }

    await prisma.email.update({
      where: { id },
      data: {
        isArchived: !email.isArchived
      }
    });

    res.json({
      success: true,
      message: email.isArchived ? 'Email rimossa dall\'archivio' : 'Email archiviata'
    });

  } catch (error) {
    logger.error('Error toggling archive:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'archiviazione dell\'email'
    });
  }
});

// Helper functions
async function getUserClientIds(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return [];

    // Admin can see all clients, others see only assigned clients
    if (user.role === 'ADMIN') {
      const clients = await prisma.client.findMany({
        select: { id: true }
      });
      return clients.map(c => c.id);
    } else {
      // For now, return all clients - later implement proper user-client assignments
      const clients = await prisma.client.findMany({
        select: { id: true }
      });
      return clients.map(c => c.id);
    }
  } catch (error) {
    logger.error('Error getting user client IDs:', error);
    return [];
  }
}

async function getFromAddress(): Promise<string> {
  try {
    const settingsRecord = await prisma.setting.findUnique({
      where: { key: 'app:base' }
    });
    
    if (settingsRecord?.value) {
      const settings = JSON.parse(settingsRecord.value);
      return settings.email?.username || 'admin@vps-3dee2600.vps.ovh.net';
    }
    
    return 'admin@vps-3dee2600.vps.ovh.net';
  } catch (error) {
    logger.error('Error getting from address:', error);
    return 'admin@vps-3dee2600.vps.ovh.net';
  }
}

export default router;
