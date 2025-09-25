import { AITool, AIToolContext, AIToolResult } from '../types/aiTypes';
import prisma from '../config/database';

export const practiceTool: AITool = {
  name: 'manage_practice',
  description: 'Gestisce pratiche: cerca, crea, aggiorna stato, verifica scadenze',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Azione da eseguire',
        enum: ['search', 'create', 'update_status', 'check_deadlines', 'get_details']
      },
      practiceId: {
        type: 'string',
        description: 'ID della pratica (per update_status, get_details)'
      },
      clientName: {
        type: 'string',
        description: 'Nome del cliente per ricerca o creazione'
      },
      title: {
        type: 'string',
        description: 'Titolo della pratica (per creazione o ricerca)'
      },
      type: {
        type: 'string',
        description: 'Tipo di pratica',
        enum: ['CONDONO', 'SCIA', 'PERMESSO_COSTRUIRE', 'CATASTO', 'TOPOGRAFIA', 'APE', 'ALTRO']
      },
      status: {
        type: 'string',
        description: 'Nuovo stato della pratica',
        enum: ['PENDING', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED', 'ARCHIVED']
      },
      description: {
        type: 'string',
        description: 'Descrizione della pratica'
      },
      dueDate: {
        type: 'string',
        description: 'Data di scadenza (formato: YYYY-MM-DD)'
      },
      daysAhead: {
        type: 'number',
        description: 'Giorni in anticipo per controllo scadenze (default: 7)'
      }
    },
    required: ['action']
  },
  execute: async (params: Record<string, any>, context?: AIToolContext): Promise<AIToolResult> => {
    try {
      const { action } = params;

      switch (action) {
        case 'search':
          return await searchPractices(params);
        case 'create':
          return await createPractice(params);
        case 'update_status':
          return await updatePracticeStatus(params);
        case 'check_deadlines':
          return await checkDeadlines(params);
        case 'get_details':
          return await getPracticeDetails(params);
        default:
          return {
            success: false,
            message: `Azione non valida: ${action}`,
            error: 'Invalid action'
          };
      }
    } catch (error: any) {
      console.error('Practice tool error:', error);
      return {
        success: false,
        message: 'Errore interno durante la gestione della pratica',
        error: error.message
      };
    }
  }
};

async function searchPractices(params: Record<string, any>): Promise<AIToolResult> {
  const { clientName, title, type, status } = params;

  let whereClause: any = {};

  // Filtro per cliente
  if (clientName) {
    whereClause.client = {
      OR: [
        { firstName: { contains: clientName, mode: 'insensitive' } },
        { lastName: { contains: clientName, mode: 'insensitive' } }
      ]
    };
  }

  // Filtro per titolo
  if (title) {
    whereClause.title = { contains: title, mode: 'insensitive' };
  }

  // Filtro per tipo
  if (type) {
    whereClause.type = type;
  }

  // Filtro per stato
  if (status) {
    whereClause.status = status;
  }

  const practices = await prisma.practice.findMany({
    where: whereClause,
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      _count: {
        select: {
          documents: true,
          activities: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const results = practices.map(practice => ({
    id: practice.id,
    title: practice.title,
    type: practice.type,
    status: practice.status,
    client: `${practice.client.firstName} ${practice.client.lastName}`,
    clientPhone: practice.client.phone,
    startDate: practice.startDate,
    dueDate: practice.dueDate,
    documentsCount: practice._count.documents,
    activitiesCount: practice._count.activities,
    amount: practice.amount
  }));

  return {
    success: true,
    message: `Trovate ${practices.length} pratiche`,
    data: { practices: results }
  };
}

async function createPractice(params: Record<string, any>): Promise<AIToolResult> {
  const { clientName, title, type, description, dueDate } = params;

  if (!clientName || !title || !type) {
    return {
      success: false,
      message: 'Cliente, titolo e tipo sono obbligatori per creare una pratica',
      error: 'Missing required fields'
    };
  }

  // Trova il cliente
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { firstName: { contains: clientName, mode: 'insensitive' } },
        { lastName: { contains: clientName, mode: 'insensitive' } }
      ]
    }
  });

  if (!client) {
    return {
      success: false,
      message: `Cliente "${clientName}" non trovato`,
      error: 'Client not found'
    };
  }

  // Valida la data di scadenza
  let dueDateParsed: Date | undefined;
  if (dueDate) {
    dueDateParsed = new Date(dueDate);
    if (isNaN(dueDateParsed.getTime())) {
      return {
        success: false,
        message: 'Data di scadenza non valida',
        error: 'Invalid due date'
      };
    }
  }

  // Crea la pratica
  const practice = await prisma.practice.create({
    data: {
      clientId: client.id,
      title,
      type,
      description: description || '',
      dueDate: dueDateParsed,
      status: 'PENDING'
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  return {
    success: true,
    message: `Pratica "${title}" creata con successo per ${client.firstName} ${client.lastName}`,
    data: {
      practiceId: practice.id,
      title: practice.title,
      type: practice.type,
      client: `${client.firstName} ${client.lastName}`,
      status: practice.status,
      dueDate: practice.dueDate
    }
  };
}

async function updatePracticeStatus(params: Record<string, any>): Promise<AIToolResult> {
  const { practiceId, status } = params;

  if (!practiceId || !status) {
    return {
      success: false,
      message: 'ID pratica e nuovo stato sono obbligatori',
      error: 'Missing required fields'
    };
  }

  const practice = await prisma.practice.update({
    where: { id: practiceId },
    data: { 
      status,
      completedAt: status === 'COMPLETED' ? new Date() : null
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  return {
    success: true,
    message: `Stato della pratica "${practice.title}" aggiornato a ${status}`,
    data: {
      practiceId: practice.id,
      title: practice.title,
      oldStatus: practice.status,
      newStatus: status,
      client: `${practice.client.firstName} ${practice.client.lastName}`
    }
  };
}

async function checkDeadlines(params: Record<string, any>): Promise<AIToolResult> {
  const { daysAhead = 7 } = params;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const practicesNearDeadline = await prisma.practice.findMany({
    where: {
      dueDate: {
        lte: futureDate,
        gte: new Date()
      },
      status: {
        notIn: ['COMPLETED', 'ARCHIVED']
      }
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          phone: true
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  const results = practicesNearDeadline.map(practice => {
    const daysToDeadline = Math.ceil(
      (new Date(practice.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: practice.id,
      title: practice.title,
      type: practice.type,
      status: practice.status,
      client: `${practice.client.firstName} ${practice.client.lastName}`,
      clientPhone: practice.client.phone,
      dueDate: practice.dueDate,
      daysToDeadline,
      urgency: daysToDeadline <= 2 ? 'URGENT' : daysToDeadline <= 5 ? 'HIGH' : 'MEDIUM'
    };
  });

  return {
    success: true,
    message: `Trovate ${practicesNearDeadline.length} pratiche in scadenza nei prossimi ${daysAhead} giorni`,
    data: { practices: results }
  };
}

async function getPracticeDetails(params: Record<string, any>): Promise<AIToolResult> {
  const { practiceId } = params;

  if (!practiceId) {
    return {
      success: false,
      message: 'ID pratica obbligatorio',
      error: 'Missing practice ID'
    };
  }

  const practice = await prisma.practice.findUnique({
    where: { id: practiceId },
    include: {
      client: true,
      documents: {
        select: {
          id: true,
          title: true,
          fileName: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      },
      activities: {
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!practice) {
    return {
      success: false,
      message: 'Pratica non trovata',
      error: 'Practice not found'
    };
  }

  return {
    success: true,
    message: `Dettagli pratica "${practice.title}"`,
    data: {
      id: practice.id,
      title: practice.title,
      type: practice.type,
      status: practice.status,
      description: practice.description,
      startDate: practice.startDate,
      dueDate: practice.dueDate,
      completedAt: practice.completedAt,
      amount: practice.amount,
      client: {
        name: `${practice.client.firstName} ${practice.client.lastName}`,
        phone: practice.client.phone,
        email: practice.client.email
      },
      documentsCount: practice.documents.length,
      activitiesCount: practice.activities.length,
      recentDocuments: practice.documents.slice(0, 5),
      recentActivities: practice.activities.slice(0, 5)
    }
  };
}
