import { Response } from 'express';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import {
  validateCreateClient,
  validateUpdateClient,
  validateClientQuery,
  validateId,
} from '../utils/validation';

const logger = createLogger('ClientController');

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = validateClientQuery(req.query);
    
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
      isActive,
      city,
      province,
    } = value;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (province) {
      where.province = province.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { fiscalCode: { contains: search, mode: 'insensitive' } },
        { vatNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get clients with pagination
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          practices: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              priority: true,
              startDate: true,
              dueDate: true,
              amount: true,
              isPaid: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Ultimi 5 pratiche per client
          },
          _count: {
            select: {
              practices: true,
              documents: true,
              whatsappChats: true,
              emails: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        clients,
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
    logger.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateId(req.params.id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID cliente non valido',
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        practices: {
          include: {
            documents: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
              },
            },
            activities: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        whatsappChats: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        emails: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        appointments: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            practices: true,
            documents: true,
            whatsappChats: true,
            emails: true,
            appointments: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente non trovato',
      });
    }

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    logger.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = validateCreateClient(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    // Check for existing client with same fiscal code or VAT number
    if (value.fiscalCode || value.vatNumber) {
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            value.fiscalCode ? { fiscalCode: value.fiscalCode } : {},
            value.vatNumber ? { vatNumber: value.vatNumber } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      });

      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'Cliente già esistente con questo codice fiscale o partita IVA',
        });
      }
    }

    // Check for existing WhatsApp number
    if (value.whatsappNumber) {
      const existingWhatsApp = await prisma.client.findUnique({
        where: { whatsappNumber: value.whatsappNumber },
      });

      if (existingWhatsApp) {
        return res.status(409).json({
          success: false,
          message: 'Cliente già esistente con questo numero WhatsApp',
        });
      }
    }

    const client = await prisma.client.create({
      data: value,
      include: {
        _count: {
          select: {
            practices: true,
            documents: true,
            whatsappChats: true,
            emails: true,
          },
        },
      },
    });

    logger.info(`Client created: ${client.firstName} ${client.lastName} (${client.email})`);

    res.status(201).json({
      success: true,
      message: 'Cliente creato con successo',
      data: { client },
    });
  } catch (error) {
    logger.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { error: idError } = validateId(req.params.id);
    
    if (idError) {
      return res.status(400).json({
        success: false,
        message: 'ID cliente non valido',
      });
    }

    const { error, value } = validateUpdateClient(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: req.params.id },
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Cliente non trovato',
      });
    }

    // Check for conflicts with other clients
    if (value.fiscalCode || value.vatNumber || value.whatsappNumber) {
      const conflicts = [];
      
      if (value.fiscalCode && value.fiscalCode !== existingClient.fiscalCode) {
        const fiscalCodeConflict = await prisma.client.findFirst({
          where: {
            fiscalCode: value.fiscalCode,
            id: { not: req.params.id },
          },
        });
        if (fiscalCodeConflict) conflicts.push('codice fiscale');
      }

      if (value.vatNumber && value.vatNumber !== existingClient.vatNumber) {
        const vatNumberConflict = await prisma.client.findFirst({
          where: {
            vatNumber: value.vatNumber,
            id: { not: req.params.id },
          },
        });
        if (vatNumberConflict) conflicts.push('partita IVA');
      }

      if (value.whatsappNumber && value.whatsappNumber !== existingClient.whatsappNumber) {
        const whatsappConflict = await prisma.client.findFirst({
          where: {
            whatsappNumber: value.whatsappNumber,
            id: { not: req.params.id },
          },
        });
        if (whatsappConflict) conflicts.push('numero WhatsApp');
      }

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Conflitto con ${conflicts.join(', ')} già esistente`,
        });
      }
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: value,
      include: {
        _count: {
          select: {
            practices: true,
            documents: true,
            whatsappChats: true,
            emails: true,
          },
        },
      },
    });

    logger.info(`Client updated: ${client.firstName} ${client.lastName} (${client.id})`);

    res.json({
      success: true,
      message: 'Cliente aggiornato con successo',
      data: { client },
    });
  } catch (error) {
    logger.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateId(req.params.id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID cliente non valido',
      });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        practices: { take: 1 },
        _count: {
          select: {
            practices: true,
            documents: true,
            whatsappChats: true,
            emails: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente non trovato',
      });
    }

    // Check if client has associated data
    const hasAssociatedData = client._count.practices > 0 || 
                             client._count.documents > 0 || 
                             client._count.whatsappChats > 0 || 
                             client._count.emails > 0;

    if (hasAssociatedData) {
      // Soft delete - deactivate instead of deleting
      await prisma.client.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      logger.info(`Client deactivated: ${client.firstName} ${client.lastName} (${client.id})`);

      res.json({
        success: true,
        message: 'Cliente disattivato con successo (ha dati associati)',
      });
    } else {
      // Hard delete if no associated data
      await prisma.client.delete({
        where: { id: req.params.id },
      });

      logger.info(`Client deleted: ${client.firstName} ${client.lastName} (${client.id})`);

      res.json({
        success: true,
        message: 'Cliente eliminato con successo',
      });
    }
  } catch (error) {
    logger.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const searchClients = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query di ricerca richiesta (minimo 2 caratteri)',
      });
    }

    const searchTerm = q.trim();

    const clients = await prisma.client.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { fiscalCode: { contains: searchTerm, mode: 'insensitive' } },
          { vatNumber: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        city: true,
      },
      take: 20,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    logger.error('Search clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};
