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
    console.log('=== GET CLIENTS DEBUG ===');
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    
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
      country,
      hasEmail,
      hasPhone,
      hasWhatsApp,
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
    
    if (country) {
      where.country = country.toUpperCase();
    }
    
    if (hasEmail !== undefined) {
      const hasEmailBool = hasEmail === true || hasEmail === 'true';
      if (hasEmailBool) {
        where.email = { not: null };
      } else {
        where.email = null;
      }
    }
    
    if (hasPhone !== undefined) {
      const hasPhoneBool = hasPhone === true || hasPhone === 'true';
      if (hasPhoneBool) {
        where.phone = { not: null };
      } else {
        where.phone = null;
      }
    }
    
    if (hasWhatsApp !== undefined) {
      const hasWhatsAppBool = hasWhatsApp === true || hasWhatsApp === 'true';
      if (hasWhatsAppBool) {
        where.whatsappNumber = { not: null };
      } else {
        where.whatsappNumber = null;
      }
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
    console.log('=== CREATE CLIENT CONTROLLER REACHED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);
    
    logger.info('=== CREATE CLIENT DEBUG ===');
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    logger.info('User ID:', req.user?.id);
    logger.info('User role:', req.user?.role);
    
    console.log('Starting validation...');
    const { error, value } = validateCreateClient(req.body);
    
    if (error) {
      console.log('Validation error:', error.details);
      logger.error('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }
    
    console.log('Validation passed, data:', JSON.stringify(value, null, 2));
    
    logger.info('Validated data:', JSON.stringify(value, null, 2));

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

          console.log('Attempting to create client in database...');
          logger.info('Attempting to create client in database...');
          
          // Clean up empty strings and filter out empty fields
          const cleanedData: any = {
            firstName: value.firstName,
            lastName: value.lastName,
            email: value.email,
            phone: value.phone,
            country: value.country,
          };
          
          // Only include non-empty optional fields
          if (value.whatsappNumber && value.whatsappNumber.trim() !== '') {
            cleanedData.whatsappNumber = value.whatsappNumber;
          }
          if (value.fiscalCode && value.fiscalCode.trim() !== '') {
            cleanedData.fiscalCode = value.fiscalCode;
          }
          if (value.vatNumber && value.vatNumber.trim() !== '') {
            cleanedData.vatNumber = value.vatNumber;
          }
          if (value.address && value.address.trim() !== '') {
            cleanedData.address = value.address;
          }
          if (value.city && value.city.trim() !== '') {
            cleanedData.city = value.city;
          }
          if (value.province && value.province.trim() !== '') {
            cleanedData.province = value.province;
          }
          if (value.postalCode && value.postalCode.trim() !== '') {
            cleanedData.postalCode = value.postalCode;
          }
          if (value.birthDate && value.birthDate.trim() !== '') {
            // Log the incoming birthDate format
            console.log('Incoming birthDate:', value.birthDate, 'Type:', typeof value.birthDate);
            
            // Handle both YYYY-MM-DD and ISO formats
            let dateValue;
            if (value.birthDate.includes('T')) {
              // Already ISO format
              dateValue = new Date(value.birthDate).toISOString();
            } else {
              // YYYY-MM-DD format, convert to ISO
              dateValue = new Date(value.birthDate + 'T00:00:00.000Z').toISOString();
            }
            console.log('Converted birthDate to:', dateValue);
            cleanedData.birthDate = dateValue;
          }
          if (value.birthPlace && value.birthPlace.trim() !== '') {
            cleanedData.birthPlace = value.birthPlace;
          }
          if (value.notes && value.notes.trim() !== '') {
            cleanedData.notes = value.notes;
          }
          
          try {
            const client = await prisma.client.create({
              data: cleanedData,
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

      console.log(`Client created successfully: ${client.firstName} ${client.lastName} (${client.email})`);
      logger.info(`Client created successfully: ${client.firstName} ${client.lastName} (${client.email})`);

      res.status(201).json({
        success: true,
        message: 'Cliente creato con successo',
        data: { client },
      });
    } catch (dbError) {
      console.log('Database error:', dbError);
      logger.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    logger.error('=== CREATE CLIENT ERROR ===');
    logger.error('Error type:', typeof error);
    logger.error('Error message:', error.message);
    logger.error('Error stack:', error.stack);
    logger.error('Full error object:', JSON.stringify(error, null, 2));
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

    // Clean up empty strings and filter out empty fields
    const cleanedData: any = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      country: value.country,
    };
    
    // Only include non-empty optional fields
    if (value.whatsappNumber && value.whatsappNumber.trim() !== '') {
      cleanedData.whatsappNumber = value.whatsappNumber;
    }
    if (value.fiscalCode && value.fiscalCode.trim() !== '') {
      cleanedData.fiscalCode = value.fiscalCode;
    }
    if (value.vatNumber && value.vatNumber.trim() !== '') {
      cleanedData.vatNumber = value.vatNumber;
    }
    if (value.address && value.address.trim() !== '') {
      cleanedData.address = value.address;
    }
    if (value.city && value.city.trim() !== '') {
      cleanedData.city = value.city;
    }
    if (value.province && value.province.trim() !== '') {
      cleanedData.province = value.province;
    }
    if (value.postalCode && value.postalCode.trim() !== '') {
      cleanedData.postalCode = value.postalCode;
    }
    if (value.birthDate && value.birthDate.trim() !== '') {
      // Convert YYYY-MM-DD to ISO string for Prisma
      cleanedData.birthDate = new Date(value.birthDate).toISOString();
    }
    if (value.birthPlace && value.birthPlace.trim() !== '') {
      cleanedData.birthPlace = value.birthPlace;
    }
    if (value.notes && value.notes.trim() !== '') {
      cleanedData.notes = value.notes;
    }
    
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: cleanedData,
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
