import { AITool, AIToolContext, AIToolResult } from '../types/aiTypes';
import prisma from '../config/database';

export const clientSearchTool: AITool = {
  name: 'search_client',
  description: 'Cerca informazioni sui clienti per nome, telefono, email o codice fiscale',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Termine di ricerca (nome, cognome, telefono, email, codice fiscale)'
      },
      searchType: {
        type: 'string',
        description: 'Tipo di ricerca specifica',
        enum: ['name', 'phone', 'email', 'fiscalCode', 'auto']
      },
      includeDetails: {
        type: 'boolean',
        description: 'Includi dettagli completi del cliente (default: false)'
      }
    },
    required: ['query']
  },
  execute: async (params: Record<string, any>, context?: AIToolContext): Promise<AIToolResult> => {
    try {
      const { query, searchType = 'auto', includeDetails = false } = params;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return {
          success: false,
          message: 'Termine di ricerca non valido',
          error: 'Invalid search query'
        };
      }

      const searchTerm = query.trim();
      let whereClause: any = {};

      // Costruisci la query basata sul tipo di ricerca
      if (searchType === 'phone') {
        whereClause = {
          OR: [
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { whatsappNumber: { contains: searchTerm, mode: 'insensitive' } }
          ]
        };
      } else if (searchType === 'email') {
        whereClause = {
          email: { contains: searchTerm, mode: 'insensitive' }
        };
      } else if (searchType === 'fiscalCode') {
        whereClause = {
          fiscalCode: { contains: searchTerm, mode: 'insensitive' }
        };
      } else if (searchType === 'name') {
        whereClause = {
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } }
          ]
        };
      } else {
        // Auto search - cerca in tutti i campi
        whereClause = {
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { whatsappNumber: { contains: searchTerm, mode: 'insensitive' } },
            { fiscalCode: { contains: searchTerm, mode: 'insensitive' } },
            { vatNumber: { contains: searchTerm, mode: 'insensitive' } }
          ]
        };
      }

      // Esegui la ricerca
      const clients = await prisma.client.findMany({
        where: whereClause,
        include: includeDetails ? {
          practices: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              startDate: true,
              dueDate: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Limita a ultime 5 pratiche
          },
          appointments: {
            select: {
              id: true,
              date: true,
              title: true,
              status: true
            },
            where: {
              date: { gte: new Date() } // Solo appuntamenti futuri
            },
            orderBy: { date: 'asc' },
            take: 3
          },
          _count: {
            select: {
              practices: true,
              appointments: true
            }
          }
        } : {
          _count: {
            select: {
              practices: true,
              appointments: true
            }
          }
        },
        take: 10 // Limita i risultati
      });

      if (clients.length === 0) {
        return {
          success: false,
          message: `Nessun cliente trovato per "${searchTerm}"`,
          error: 'No clients found'
        };
      }

      // Formatta i risultati
      const results = clients.map(client => {
        const baseInfo = {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          phone: client.phone,
          whatsappNumber: client.whatsappNumber,
          email: client.email,
          practicesCount: client._count?.practices || 0,
          appointmentsCount: client._count?.appointments || 0
        };

        if (includeDetails) {
          return {
            ...baseInfo,
            fiscalCode: client.fiscalCode,
            vatNumber: client.vatNumber,
            address: client.address ? `${client.address}, ${client.city} ${client.province} ${client.postalCode}` : null,
            recentPractices: (client as any).practices?.map((p: any) => ({
              id: p.id,
              title: p.title,
              type: p.type,
              status: p.status,
              startDate: p.startDate,
              dueDate: p.dueDate
            })) || [],
            upcomingAppointments: (client as any).appointments?.map((a: any) => ({
              id: a.id,
              date: a.date,
              title: a.title,
              status: a.status
            })) || []
          };
        }

        return baseInfo;
      });

      const message = clients.length === 1 
        ? `Trovato cliente: ${clients[0].firstName} ${clients[0].lastName}`
        : `Trovati ${clients.length} clienti per "${searchTerm}"`;

      return {
        success: true,
        message,
        data: {
          query: searchTerm,
          count: clients.length,
          clients: results
        }
      };

    } catch (error: any) {
      console.error('Client search tool error:', error);
      return {
        success: false,
        message: 'Errore interno durante la ricerca dei clienti',
        error: error.message
      };
    }
  }
};
