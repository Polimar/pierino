import { Request, Response } from 'express';

export interface DashboardStats {
  totalClients: number;
  activePractices: number;
  whatsappMessages: number;
  todayAppointments: number;
  clientsChange: string;
  practicesChange: string;
  whatsappChange: string;
  appointmentsChange: string;
}

export interface RecentActivity {
  id: string;
  type: 'practice' | 'whatsapp' | 'appointment' | 'document';
  title: string;
  description: string;
  timeAgo: string;
  icon: string;
}

export interface UrgentActivity {
  id: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Urgente' | 'Media';
  dueDate: string;
  type: 'deadline' | 'whatsapp' | 'completion';
}

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Statistiche mock con variazioni percentuali
    const stats: DashboardStats = {
      totalClients: 142,
      activePractices: 58,
      whatsappMessages: 23,
      todayAppointments: 6,
      clientsChange: '+4.75%',
      practicesChange: '+2.15%',
      whatsappChange: '+1.25%',
      appointmentsChange: '+3.20%'
    };

    console.log('Dashboard stats retrieved successfully');
    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche dashboard',
      error: error.message
    });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    // Attività recenti mock
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'practice',
        title: 'Nuova pratica SCIA',
        description: 'Mario Rossi',
        timeAgo: '2 ore fa',
        icon: '📋'
      },
      {
        id: '2',
        type: 'whatsapp',
        title: 'Messaggio WhatsApp',
        description: 'Anna Verdi',
        timeAgo: '4 ore fa',
        icon: '💬'
      },
      {
        id: '3',
        type: 'appointment',
        title: 'Appuntamento completato',
        description: 'Luca Bianchi',
        timeAgo: '6 ore fa',
        icon: '📅'
      },
      {
        id: '4',
        type: 'document',
        title: 'Documento caricato',
        description: 'Pratica #1234',
        timeAgo: '1 giorno fa',
        icon: '📄'
      }
    ];

    console.log('Recent activities retrieved successfully');
    res.json({
      success: true,
      data: activities
    });

  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle attività recenti',
      error: error.message
    });
  }
};

export const getUrgentActivities = async (req: Request, res: Response) => {
  try {
    // Attività urgenti mock
    const urgentActivities: UrgentActivity[] = [
      {
        id: '1',
        title: 'Scadenza pratica SCIA',
        description: 'Via Roma 123',
        priority: 'Alta',
        dueDate: 'Domani',
        type: 'deadline'
      },
      {
        id: '2',
        title: 'Rispondere a WhatsApp',
        description: 'Cliente Urgente',
        priority: 'Urgente',
        dueDate: 'Oggi',
        type: 'whatsapp'
      },
      {
        id: '3',
        title: 'Completare APE',
        description: 'Appartamento Centro',
        priority: 'Media',
        dueDate: '3 giorni',
        type: 'completion'
      }
    ];

    console.log('Urgent activities retrieved successfully');
    res.json({
      success: true,
      data: urgentActivities
    });

  } catch (error: any) {
    console.error('Error fetching urgent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle attività urgenti',
      error: error.message
    });
  }
};

export const getQuickActions = async (req: Request, res: Response) => {
  try {
    // Azioni rapide mock
    const quickActions = [
      {
        id: 'new-client',
        title: 'Nuovo Cliente',
        icon: '👤',
        color: 'blue',
        route: '/clients/new'
      },
      {
        id: 'new-practice',
        title: 'Nuova Pratica',
        icon: '📋',
        color: 'green',
        route: '/practices/new'
      },
      {
        id: 'new-appointment',
        title: 'Appuntamento',
        icon: '📅',
        color: 'purple',
        route: '/appointments/new'
      },
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        icon: '💬',
        color: 'orange',
        route: '/whatsapp'
      }
    ];

    console.log('Quick actions retrieved successfully');
    res.json({
      success: true,
      data: quickActions
    });

  } catch (error: any) {
    console.error('Error fetching quick actions:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle azioni rapide',
      error: error.message
    });
  }
};
