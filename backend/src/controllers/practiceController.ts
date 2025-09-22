import { Response } from 'express';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import {
  validateCreatePractice,
  validateUpdatePractice,
  validatePracticeQuery,
  validateId,
} from '../utils/validation';

const logger = createLogger('PracticeController');

export const getPractices = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = validatePracticeQuery(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parametri di query non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    const {
      page,
      limit,
      search,
      sortBy = 'createdAt',
      sortOrder,
      clientId,
      type,
      status,
      priority,
      startDate,
      endDate,
      isPaid,
    } = value;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (isPaid !== undefined) {
      where.isPaid = isPaid;
    }
    
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ]
        }},
      ];
    }

    // Get practices with pagination
    const [practices, total] = await Promise.all([
      prisma.practice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              whatsappNumber: true,
            },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              filename: true,
              originalName: true,
              mimeType: true,
              size: true,
              createdAt: true,
            },
            take: 5,
          },
          _count: {
            select: {
              activities: true,
              documents: true,
              appointments: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.practice.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        practices,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Get practices error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const getPractice = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateId(req.params.id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID pratica non valido',
      });
    }

    const practice = await prisma.practice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        activities: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { startTime: 'asc' },
        },
        mediaFiles: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: 'Pratica non trovata',
      });
    }

    res.json({
      success: true,
      data: { practice },
    });
  } catch (error) {
    logger.error('Get practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const createPractice = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = validateCreatePractice(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: value.clientId },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente non trovato',
      });
    }

    const practice = await prisma.practice.create({
      data: value,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            activities: true,
            documents: true,
            appointments: true,
          },
        },
      },
    });

    logger.info(`Practice created: ${practice.title} for client ${client.firstName} ${client.lastName}`);

    res.status(201).json({
      success: true,
      message: 'Pratica creata con successo',
      data: { practice },
    });
  } catch (error) {
    logger.error('Create practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const updatePractice = async (req: AuthRequest, res: Response) => {
  try {
    const { error: idError } = validateId(req.params.id);
    
    if (idError) {
      return res.status(400).json({
        success: false,
        message: 'ID pratica non valido',
      });
    }

    const { error, value } = validateUpdatePractice(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    // Check if practice exists
    const existingPractice = await prisma.practice.findUnique({
      where: { id: req.params.id },
    });

    if (!existingPractice) {
      return res.status(404).json({
        success: false,
        message: 'Pratica non trovata',
      });
    }

    // Auto-set completion date if status changed to COMPLETED
    const updateData = { ...value };
    if (value.status === 'COMPLETED' && existingPractice.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (value.status !== 'COMPLETED') {
      updateData.completedAt = null;
    }

    const practice = await prisma.practice.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            activities: true,
            documents: true,
            appointments: true,
          },
        },
      },
    });

    logger.info(`Practice updated: ${practice.title} (${practice.id})`);

    res.json({
      success: true,
      message: 'Pratica aggiornata con successo',
      data: { practice },
    });
  } catch (error) {
    logger.error('Update practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const deletePractice = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateId(req.params.id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID pratica non valido',
      });
    }

    // Check if practice exists
    const practice = await prisma.practice.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            activities: true,
            documents: true,
            appointments: true,
          },
        },
      },
    });

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: 'Pratica non trovata',
      });
    }

    // Check if practice has associated data
    const hasAssociatedData = practice._count.activities > 0 || 
                             practice._count.documents > 0 || 
                             practice._count.appointments > 0;

    if (hasAssociatedData) {
      // Soft delete - archive instead of deleting
      await prisma.practice.update({
        where: { id: req.params.id },
        data: { status: 'ARCHIVED' },
      });

      logger.info(`Practice archived: ${practice.title} (${practice.id})`);

      res.json({
        success: true,
        message: 'Pratica archiviata con successo (ha dati associati)',
      });
    } else {
      // Hard delete if no associated data
      await prisma.practice.delete({
        where: { id: req.params.id },
      });

      logger.info(`Practice deleted: ${practice.title} (${practice.id})`);

      res.json({
        success: true,
        message: 'Pratica eliminata con successo',
      });
    }
  } catch (error) {
    logger.error('Delete practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const getPracticeStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalPractices,
      activePractices,
      completedPractices,
      overdueCount,
      totalRevenue,
      pendingRevenue,
      statusCounts,
      typeCounts,
      priorityCounts,
    ] = await Promise.all([
      prisma.practice.count(),
      prisma.practice.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.practice.count({ where: { status: 'COMPLETED' } }),
      prisma.practice.count({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] },
        },
      }),
      prisma.practice.aggregate({
        _sum: { amount: true },
        where: { isPaid: true },
      }),
      prisma.practice.aggregate({
        _sum: { amount: true },
        where: { isPaid: false, status: 'COMPLETED' },
      }),
      prisma.practice.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.practice.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.practice.groupBy({
        by: ['priority'],
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalPractices,
          activePractices,
          completedPractices,
          overdueCount,
          totalRevenue: totalRevenue._sum.amount || 0,
          pendingRevenue: pendingRevenue._sum.amount || 0,
        },
        distributions: {
          byStatus: statusCounts,
          byType: typeCounts,
          byPriority: priorityCounts,
        },
      },
    });
  } catch (error) {
    logger.error('Get practice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche',
    });
  }
};
