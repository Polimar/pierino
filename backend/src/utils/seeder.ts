import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import config from '../config/env';
import { createLogger } from '../utils/logger';
import { Role, PracticeType, PracticeStatus, Priority, AIProvider } from '@prisma/client';

const logger = createLogger('Seeder');

export async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Check if users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      logger.info('Database already seeded, skipping...');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('password123', config.BCRYPT_ROUNDS);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@geometra.com',
        password: adminPassword,
        role: Role.ADMIN,
        firstName: 'Admin',
        lastName: 'Sistema',
        isActive: true,
      },
    });

    // Create geometra user
    const geometraPassword = await bcrypt.hash('password123', config.BCRYPT_ROUNDS);
    const geometra = await prisma.user.create({
      data: {
        email: 'geometra@geometra.com',
        password: geometraPassword,
        role: Role.GEOMETRA,
        firstName: 'Mario',
        lastName: 'Rossi',
        isActive: true,
      },
    });

    // Create secretary user
    const secretaryPassword = await bcrypt.hash('password123', config.BCRYPT_ROUNDS);
    const secretary = await prisma.user.create({
      data: {
        email: 'segreteria@geometra.com',
        password: secretaryPassword,
        role: Role.SECRETARY,
        firstName: 'Anna',
        lastName: 'Verdi',
        isActive: true,
      },
    });

    logger.info('Users created successfully');

    // Create sample clients
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          firstName: 'Luca',
          lastName: 'Bianchi',
          email: 'luca.bianchi@email.com',
          phone: '+39 123 456 7890',
          whatsappNumber: '+39 123 456 7890',
          fiscalCode: 'BNCLCU80A01H501Z',
          address: 'Via Roma 123',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100',
          country: 'IT',
          notes: 'Cliente importante, proprietario di multiple proprietà',
        },
      }),
      prisma.client.create({
        data: {
          firstName: 'Giulia',
          lastName: 'Ferrari',
          email: 'giulia.ferrari@email.com',
          phone: '+39 987 654 3210',
          whatsappNumber: '+39 987 654 3210',
          fiscalCode: 'FRRGLI85B15F205X',
          address: 'Corso Italia 45',
          city: 'Roma',
          province: 'RM',
          postalCode: '00100',
          country: 'IT',
          notes: 'Architetto, collaborazioni frequenti',
        },
      }),
      prisma.client.create({
        data: {
          firstName: 'Marco',
          lastName: 'Esposito',
          email: 'marco.esposito@email.com',
          phone: '+39 555 123 4567',
          fiscalCode: 'SPSMRC75C20F839Y',
          vatNumber: '12345678901',
          address: 'Piazza Garibaldi 10',
          city: 'Napoli',
          province: 'NA',
          postalCode: '80100',
          country: 'IT',
          notes: 'Impresa edile, lavori di ristrutturazione',
        },
      }),
      prisma.client.create({
        data: {
          firstName: 'Chiara',
          lastName: 'Colombo',
          email: 'chiara.colombo@email.com',
          phone: '+39 333 987 6543',
          whatsappNumber: '+39 333 987 6543',
          fiscalCode: 'CLMCHR90D55L219K',
          address: 'Via Garibaldi 67',
          city: 'Torino',
          province: 'TO',
          postalCode: '10100',
          country: 'IT',
        },
      }),
      prisma.client.create({
        data: {
          firstName: 'Alessandro',
          lastName: 'Ricci',
          email: 'alessandro.ricci@email.com',
          phone: '+39 444 567 8901',
          fiscalCode: 'RCCLS78E12D612W',
          address: 'Viale Europa 234',
          city: 'Firenze',
          province: 'FI',
          postalCode: '50100',
          country: 'IT',
          notes: 'Primo acquisto casa, necessita assistenza completa',
        },
      }),
    ]);

    logger.info('Sample clients created successfully');

    // Create sample practices
    const practices = await Promise.all([
      prisma.practice.create({
        data: {
          title: 'Pratica SCIA - Ristrutturazione Cucina',
          type: PracticeType.SCIA,
          status: PracticeStatus.IN_PROGRESS,
          priority: Priority.HIGH,
          clientId: clients[0].id,
          description: 'Ristrutturazione cucina con modifica della distribuzione interna',
          startDate: new Date('2024-01-15'),
          dueDate: new Date('2024-03-15'),
          amount: 2500.00,
        },
      }),
      prisma.practice.create({
        data: {
          title: 'Certificazione APE - Appartamento Centro',
          type: PracticeType.APE,
          status: PracticeStatus.COMPLETED,
          priority: Priority.MEDIUM,
          clientId: clients[1].id,
          description: 'Attestato di Prestazione Energetica per vendita immobile',
          startDate: new Date('2024-01-10'),
          dueDate: new Date('2024-01-25'),
          completedAt: new Date('2024-01-23'),
          amount: 350.00,
          paidAmount: 350.00,
          isPaid: true,
          invoiceNumber: 'INV-2024-001',
        },
      }),
      prisma.practice.create({
        data: {
          title: 'Permesso di Costruire - Villa Residenziale',
          type: PracticeType.PERMESSO_COSTRUIRE,
          status: PracticeStatus.PENDING,
          priority: Priority.URGENT,
          clientId: clients[2].id,
          description: 'Nuova costruzione villa unifamiliare con giardino',
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-06-01'),
          amount: 8500.00,
        },
      }),
      prisma.practice.create({
        data: {
          title: 'Rilievo Topografico - Terreno Agricolo',
          type: PracticeType.TOPOGRAFIA,
          status: PracticeStatus.IN_PROGRESS,
          priority: Priority.MEDIUM,
          clientId: clients[3].id,
          description: 'Rilievo topografico per frazionamento terreno agricolo',
          startDate: new Date('2024-02-10'),
          dueDate: new Date('2024-03-10'),
          amount: 1800.00,
        },
      }),
      prisma.practice.create({
        data: {
          title: 'Visura Catastale - Controllo Consistenza',
          type: PracticeType.VISURA,
          status: PracticeStatus.COMPLETED,
          priority: Priority.LOW,
          clientId: clients[4].id,
          description: 'Verifica dati catastali per compravendita',
          startDate: new Date('2024-01-20'),
          dueDate: new Date('2024-01-25'),
          completedAt: new Date('2024-01-24'),
          amount: 150.00,
          paidAmount: 150.00,
          isPaid: true,
          invoiceNumber: 'INV-2024-002',
        },
      }),
    ]);

    logger.info('Sample practices created successfully');

    // Create sample activities for practices
    await Promise.all([
      prisma.activity.create({
        data: {
          practiceId: practices[0].id,
          userId: geometra.id,
          type: 'SITE_VISIT',
          title: 'Sopralluogo iniziale',
          description: 'Verifica stato attuale e misurazioni',
          status: 'COMPLETED',
          completedAt: new Date('2024-01-18'),
        },
      }),
      prisma.activity.create({
        data: {
          practiceId: practices[0].id,
          userId: secretary.id,
          type: 'DOCUMENT_REVIEW',
          title: 'Preparazione documentazione',
          description: 'Raccolta e verifica documenti necessari',
          status: 'IN_PROGRESS',
        },
      }),
      prisma.activity.create({
        data: {
          practiceId: practices[2].id,
          userId: geometra.id,
          type: 'MEETING',
          title: 'Incontro con cliente',
          description: 'Discussione dettagli progetto e tempistiche',
          status: 'PENDING',
          dueDate: new Date('2024-02-15'),
        },
      }),
    ]);

    // Create AI configuration
    await prisma.aIConfiguration.create({
      data: {
        provider: AIProvider.OLLAMA,
        ollamaModel: 'llama3.1',
        ollamaEndpoint: config.OLLAMA_ENDPOINT,
        isActive: true,
        maxTokens: 2048,
        temperature: 0.7,
        settings: {
          systemPrompt: 'Sei un assistente AI per uno studio di geometra italiano. Rispondi sempre in italiano con competenza tecnica e professionalità.',
        },
      },
    });

    // Create sample WhatsApp messages
    const conversation = await prisma.whatsappConversation.create({
      data: {
        contactPhone: '+390000000001',
        contactName: clients[0].firstName,
        clientId: clients[0].id,
      },
    });

    await prisma.whatsappMessage.create({
      data: {
        messageId: 'msg_seed_' + Date.now(),
        conversationId: conversation.id,
        clientId: clients[0].id,
        authorType: 'CLIENT',
        content: 'WhatsApp seed message',
        messageType: 'TEXT',
      },
    });

    // Create sample notifications
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'PRACTICE_DEADLINE',
          title: 'Scadenza Pratica',
          message: 'La pratica SCIA per Luca Bianchi scade tra 3 giorni',
          priority: Priority.HIGH,
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: secretary.id,
          type: 'WHATSAPP_MESSAGE',
          title: 'Nuovo messaggio WhatsApp',
          message: 'Marco Esposito ha inviato un messaggio',
          priority: Priority.MEDIUM,
          isRead: false,
        },
      }),
    ]);

    // Create some settings
    await Promise.all([
      prisma.setting.create({
        data: {
          key: 'studio_name',
          value: 'Studio Geometra Demo',
          description: 'Nome dello studio',
          isPublic: true,
        },
      }),
      prisma.setting.create({
        data: {
          key: 'studio_address',
          value: 'Via Example 123, 00100 Roma (RM)',
          description: 'Indirizzo dello studio',
          isPublic: true,
        },
      }),
      prisma.setting.create({
        data: {
          key: 'studio_phone',
          value: '+39 06 123456789',
          description: 'Telefono dello studio',
          isPublic: true,
        },
      }),
      prisma.setting.create({
        data: {
          key: 'studio_email',
          value: 'info@studiogeometra.it',
          description: 'Email dello studio',
          isPublic: true,
        },
      }),
    ]);

    logger.info('Database seeding completed successfully');
    logger.info('Demo credentials:');
    logger.info('Admin: admin@geometra.com / password123');
    logger.info('Geometra: geometra@geometra.com / password123');
    logger.info('Segreteria: segreteria@geometra.com / password123');

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
}

export async function clearDatabase() {
  try {
    logger.info('Clearing database...');
    
    // Delete in correct order due to foreign key constraints
    await prisma.notification.deleteMany();
    await prisma.aIConversation.deleteMany();
    await prisma.aIConfiguration.deleteMany();
    await prisma.mediaFile.deleteMany();
    await prisma.whatsappMessage.deleteMany();
    await prisma.email.deleteMany();
    await prisma.document.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.practice.deleteMany();
    await prisma.client.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.user.deleteMany();
    
    logger.info('Database cleared successfully');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
}
