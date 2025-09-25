import { AITool, AIToolContext, AIToolResult } from '../types/aiTypes';
import prisma from '../config/database';

export const documentSearchTool: AITool = {
  name: 'search_documents',
  description: 'Cerca documenti per cliente, pratica o contenuto',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Termine di ricerca nel nome o contenuto del documento'
      },
      clientName: {
        type: 'string',
        description: 'Nome del cliente per filtrare i documenti'
      },
      practiceTitle: {
        type: 'string',
        description: 'Titolo della pratica per filtrare i documenti'
      },
      documentType: {
        type: 'string',
        description: 'Tipo di documento',
        enum: ['pdf', 'doc', 'docx', 'jpg', 'png', 'dwg', 'all']
      },
      limit: {
        type: 'number',
        description: 'Numero massimo di risultati (default: 10)'
      }
    },
    required: []
  },
  execute: async (params: Record<string, any>, context?: AIToolContext): Promise<AIToolResult> => {
    try {
      const { 
        query, 
        clientName, 
        practiceTitle, 
        documentType = 'all', 
        limit = 10 
      } = params;

      let whereClause: any = {};
      const includes: any = {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        practice: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true
          }
        }
      };

      // Ricerca per query generale
      if (query && typeof query === 'string' && query.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } },
          { fileName: { contains: query.trim(), mode: 'insensitive' } }
        ];
      }

      // Filtro per cliente
      if (clientName && typeof clientName === 'string' && clientName.trim().length > 0) {
        const clientFilter = {
          client: {
            OR: [
              { firstName: { contains: clientName.trim(), mode: 'insensitive' } },
              { lastName: { contains: clientName.trim(), mode: 'insensitive' } }
            ]
          }
        };
        whereClause = whereClause.OR ? { AND: [whereClause, clientFilter] } : clientFilter;
      }

      // Filtro per pratica
      if (practiceTitle && typeof practiceTitle === 'string' && practiceTitle.trim().length > 0) {
        const practiceFilter = {
          practice: {
            title: { contains: practiceTitle.trim(), mode: 'insensitive' }
          }
        };
        whereClause = whereClause.OR ? { AND: [whereClause, practiceFilter] } : practiceFilter;
      }

      // Filtro per tipo documento
      if (documentType !== 'all') {
        const typeFilter = {
          OR: [
            { fileName: { endsWith: `.${documentType}`, mode: 'insensitive' } },
            { mimeType: { contains: documentType, mode: 'insensitive' } }
          ]
        };
        whereClause = whereClause.OR ? { AND: [whereClause, typeFilter] } : typeFilter;
      }

      // Se non ci sono filtri, cerca tutti i documenti recenti
      if (Object.keys(whereClause).length === 0) {
        whereClause = {}; // Tutti i documenti
      }

      // Esegui la ricerca
      const documents = await prisma.document.findMany({
        where: whereClause,
        include: includes,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit) || 10, 50) // Max 50 documenti
      });

      if (documents.length === 0) {
        const searchTerms = [query, clientName, practiceTitle].filter(Boolean).join(', ');
        return {
          success: false,
          message: searchTerms 
            ? `Nessun documento trovato per: ${searchTerms}`
            : 'Nessun documento trovato',
          error: 'No documents found'
        };
      }

      // Formatta i risultati
      const results = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        client: doc.client ? `${doc.client.firstName} ${doc.client.lastName}` : null,
        practice: doc.practice ? {
          title: doc.practice.title,
          type: doc.practice.type,
          status: doc.practice.status
        } : null,
        createdAt: doc.createdAt,
        downloadUrl: `/api/documents/${doc.id}/download`
      }));

      // Raggruppa per cliente o pratica se utile
      const summary: any = {
        totalDocuments: documents.length,
        byClient: {},
        byPractice: {},
        byType: {}
      };

      documents.forEach(doc => {
        // Raggruppa per cliente
        if (doc.client) {
          const clientKey = `${doc.client.firstName} ${doc.client.lastName}`;
          summary.byClient[clientKey] = (summary.byClient[clientKey] || 0) + 1;
        }

        // Raggruppa per pratica
        if (doc.practice) {
          summary.byPractice[doc.practice.title] = (summary.byPractice[doc.practice.title] || 0) + 1;
        }

        // Raggruppa per tipo
        const fileExt = doc.fileName.split('.').pop()?.toLowerCase() || 'unknown';
        summary.byType[fileExt] = (summary.byType[fileExt] || 0) + 1;
      });

      const message = documents.length === 1 
        ? `Trovato 1 documento: ${documents[0].title}`
        : `Trovati ${documents.length} documenti`;

      return {
        success: true,
        message,
        data: {
          summary,
          documents: results
        }
      };

    } catch (error: any) {
      console.error('Document search tool error:', error);
      return {
        success: false,
        message: 'Errore interno durante la ricerca dei documenti',
        error: error.message
      };
    }
  }
};
