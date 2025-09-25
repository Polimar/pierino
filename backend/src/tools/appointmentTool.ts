import { AITool, AIToolContext, AIToolResult } from '../types/aiTypes';
import prisma from '../config/database';

export const appointmentTool: AITool = {
  name: 'schedule_appointment',
  description: 'Fissa un appuntamento per un cliente con il geometra',
  parameters: {
    type: 'object',
    properties: {
      clientPhone: {
        type: 'string',
        description: 'Numero di telefono del cliente per identificarlo'
      },
      date: {
        type: 'string',
        description: 'Data dell\'appuntamento (formato: YYYY-MM-DD)'
      },
      time: {
        type: 'string',
        description: 'Ora dell\'appuntamento (formato: HH:MM)'
      },
      duration: {
        type: 'number',
        description: 'Durata in minuti (default: 60)'
      },
      title: {
        type: 'string',
        description: 'Titolo/oggetto dell\'appuntamento'
      },
      description: {
        type: 'string',
        description: 'Descrizione dettagliata dell\'appuntamento'
      },
      location: {
        type: 'string',
        description: 'Luogo dell\'appuntamento (default: Studio Gori)'
      }
    },
    required: ['clientPhone', 'date', 'time', 'title']
  },
  execute: async (params: Record<string, any>, context?: AIToolContext): Promise<AIToolResult> => {
    try {
      const { 
        clientPhone, 
        date, 
        time, 
        duration = 60, 
        title, 
        description = '', 
        location = 'Studio Gori' 
      } = params;

      // Trova il cliente dal numero di telefono
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { phone: clientPhone },
            { whatsappNumber: clientPhone }
          ]
        }
      });

      if (!client) {
        return {
          success: false,
          message: `Cliente con numero ${clientPhone} non trovato. Devo prima creare il cliente.`,
          error: 'Client not found'
        };
      }

      // Valida la data
      const appointmentDate = new Date(`${date}T${time}:00`);
      if (isNaN(appointmentDate.getTime())) {
        return {
          success: false,
          message: 'Data o ora non valida',
          error: 'Invalid date or time format'
        };
      }

      // Verifica che l'appuntamento sia nel futuro
      if (appointmentDate <= new Date()) {
        return {
          success: false,
          message: 'L\'appuntamento deve essere fissato per una data futura',
          error: 'Appointment must be in the future'
        };
      }

      // Verifica disponibilità (controllo base)
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          date: appointmentDate,
          status: {
            not: 'CANCELLED'
          }
        }
      });

      if (existingAppointment) {
        return {
          success: false,
          message: `L'orario ${time} del ${date} è già occupato. Proponi un altro orario.`,
          error: 'Time slot already booked'
        };
      }

      // Crea l'appuntamento
      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.id,
          date: appointmentDate,
          duration,
          title,
          description,
          location,
          status: 'SCHEDULED',
          type: 'CONSULTATION' // Default type
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          }
        }
      });

      return {
        success: true,
        message: `Appuntamento fissato con successo per ${client.firstName} ${client.lastName} il ${date} alle ${time}`,
        data: {
          appointmentId: appointment.id,
          client: `${client.firstName} ${client.lastName}`,
          date: date,
          time: time,
          duration: duration,
          title: title,
          location: location,
          clientPhone: clientPhone
        }
      };

    } catch (error: any) {
      console.error('Appointment tool error:', error);
      return {
        success: false,
        message: 'Errore interno durante la creazione dell\'appuntamento',
        error: error.message
      };
    }
  }
};
