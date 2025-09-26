import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

interface EmailAccount {
  id: string;
  email: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  imap: {
    host: string;
    port: number;
    tls: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

class EmailService extends EventEmitter {
  private transporter: nodemailer.Transporter | null = null;
  private imapConnection: any = null;
  private isConnected = false;
  private templates: EmailTemplate[] = [];

  constructor() {
    super();
    this.loadTemplates();
    this.initializeTransporter();
  }

  private async loadTemplates() {
    // Load email templates from database or file system
    this.templates = [
      {
        id: 'practice_reminder',
        name: 'Promemoria Pratica',
        subject: 'Promemoria per la pratica {{practiceTitle}}',
        body: `
Gentile {{clientName}},

La informiamo che la pratica "{{practiceTitle}}" necessita della sua attenzione.

Dettagli:
- Tipo: {{practiceType}}
- Stato: {{practiceStatus}}
- Scadenza: {{dueDate}}

{{#if description}}
Descrizione: {{description}}
{{/if}}

La preghiamo di contattarci per eventuali chiarimenti.

Cordiali saluti,
{{studioName}}
        `,
        variables: ['clientName', 'practiceTitle', 'practiceType', 'practiceStatus', 'dueDate', 'description', 'studioName'],
      },
      {
        id: 'practice_completed',
        name: 'Pratica Completata',
        subject: 'Pratica {{practiceTitle}} completata',
        body: `
Gentile {{clientName}},

Siamo lieti di comunicarle che la pratica "{{practiceTitle}}" è stata completata con successo.

{{#if invoiceNumber}}
Numero fattura: {{invoiceNumber}}
{{#if amount}}Importo: €{{amount}}{{/if}}
{{/if}}

{{#if documents}}
I documenti sono disponibili per il ritiro presso il nostro studio.
{{/if}}

Grazie per la fiducia accordataci.

Cordiali saluti,
{{studioName}}
        `,
        variables: ['clientName', 'practiceTitle', 'invoiceNumber', 'amount', 'documents', 'studioName'],
      },
      {
        id: 'appointment_reminder',
        name: 'Promemoria Appuntamento',
        subject: 'Promemoria appuntamento del {{appointmentDate}}',
        body: `
Gentile {{clientName}},

Le ricordiamo il suo appuntamento presso il nostro studio:

Data: {{appointmentDate}}
Ora: {{appointmentTime}}
{{#if location}}Luogo: {{location}}{{/if}}
{{#if notes}}Note: {{notes}}{{/if}}

La preghiamo di confermare la sua presenza.

Cordiali saluti,
{{studioName}}
        `,
        variables: ['clientName', 'appointmentDate', 'appointmentTime', 'location', 'notes', 'studioName'],
      },
    ];
  }

  private async initializeTransporter() {
    try {
      // Carica le impostazioni email dal database
      const settings = await this.getEmailSettings();
      
      if (!settings || !settings.username) {
        logger.warn('Email service: Configurazione non trovata');
        return;
      }

      const config = this.getTransporterConfig(settings);
      this.transporter = nodemailer.createTransporter(config);
      
      // Test della connessione
      await this.transporter.verify();
      this.isConnected = true;
      logger.info(`Email service attivato con provider: ${settings.provider}`);
      
    } catch (error) {
      logger.error('Errore inizializzazione transporter email:', error);
      this.isConnected = false;
    }
  }

  private async getEmailSettings() {
    try {
      const settingsRecord = await prisma.setting.findUnique({
        where: { key: 'app:base' }
      });
      
      if (settingsRecord?.value) {
        const settings = JSON.parse(settingsRecord.value);
        return settings.email;
      }
      return null;
    } catch (error) {
      logger.error('Errore caricamento impostazioni email:', error);
      return null;
    }
  }

  private getTransporterConfig(settings: any) {
    const config: any = {
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    };

    switch (settings.provider) {
      case 'local':
        // Server mail locale Studio Gori
        config.host = 'mailserver';
        config.port = 587;
        config.secure = false; // Use STARTTLS
        config.auth = {
          user: settings.username,
          pass: settings.password,
        };
        config.tls = {
          ciphers: 'SSLv3',
          rejectUnauthorized: false // Per certificati autofirmati
        };
        break;

      case 'gmail':
        config.service = 'gmail';
        config.auth = {
          user: settings.username,
          pass: settings.password, // App password per Gmail
        };
        break;

      case 'outlook':
        config.service = 'hotmail';
        config.auth = {
          user: settings.username,
          pass: settings.password,
        };
        break;

      case 'custom':
        config.host = settings.host;
        config.port = settings.port || 587;
        config.secure = settings.secure || false;
        config.auth = {
          user: settings.username,
          pass: settings.password,
        };
        break;

      default:
        throw new Error(`Provider email non supportato: ${settings.provider}`);
    }

    return config;
  }

  async sendEmail(to: string, subject: string, text: string, html?: string, attachments?: any[]): Promise<string> {
    if (!this.transporter || !this.isConnected) {
      await this.initializeTransporter();
    }

    if (!this.transporter) {
      throw new Error('Email service non configurato correttamente');
    }

    try {
      const mailOptions = {
        from: await this.getFromAddress(),
        to,
        subject,
        text,
        html: html || text,
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email inviata con successo a ${to}, messageId: ${result.messageId}`);
      
      return result.messageId;
    } catch (error) {
      logger.error('Errore invio email:', error);
      throw error;
    }
  }

  private async getFromAddress(): Promise<string> {
    const settings = await this.getEmailSettings();
    return settings?.username || 'admin@studio-gori.com';
  }

  async sendTemplateEmail(
    templateId: string, 
    to: string, 
    variables: Record<string, any>,
    attachments?: any[]
  ): Promise<string> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template email non trovato: ${templateId}`);
    }

    // Sostituisci le variabili nel template
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return this.sendEmail(to, subject, body, body, attachments);
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }
      
      if (this.transporter) {
        await this.transporter.verify();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Test connessione email fallito:', error);
      return false;
    }
  }

  // Metodo per ricaricare la configurazione
  async reloadConfiguration(): Promise<void> {
    this.isConnected = false;
    this.transporter = null;
    await this.initializeTransporter();
  }

  async connectIMAP(): Promise<void> {
    // if (!config.IMAP_HOST || !config.SMTP_USER || !config.SMTP_PASS) { // Removed as config is removed
    //   logger.warn('IMAP configuration not complete');
    //   return;
    // }

    // const imap = new (require('imap'))({ // Removed as Imap is removed
    //   user: config.SMTP_USER,
    //   password: config.SMTP_PASS,
    //   host: config.IMAP_HOST,
    //   port: config.IMAP_PORT,
    //   tls: true,
    //   tlsOptions: { rejectUnauthorized: false },
    // });

    // return new Promise((resolve, reject) => {
    //   imap.once('ready', () => {
    //     logger.info('IMAP connection ready');
    //     this.imapConnection = imap;
    //     this.startEmailMonitoring();
    //     resolve();
    //   });

    //   imap.once('error', (err: Error) => {
    //     logger.error('IMAP connection error:', err);
    //     reject(err);
    //   });

    //   imap.connect();
    // });
  }

  private startEmailMonitoring() {
    if (!this.imapConnection) return;

    // this.imapConnection.openBox('INBOX', false, (err: Error, box: any) => { // Removed as Imap is removed
    //   if (err) {
    //     logger.error('Error opening inbox:', err);
    //     return;
    //   }

    //   logger.info('Monitoring inbox for new emails');

    //   this.imapConnection.on('mail', (numNewMsgs: number) => {
    //     logger.info(`${numNewMsgs} new email(s) received`);
    //     this.fetchNewEmails();
    //   });
    // });
  }

  private async fetchNewEmails() {
    if (!this.imapConnection) return;

    // try {
    //   // Fetch unseen emails
    //   this.imapConnection.search(['UNSEEN'], (err: Error, results: number[]) => { // Removed as Imap is removed
    //     if (err || !results.length) return;

    //     const fetch = this.imapConnection.fetch(results, { // Removed as Imap is removed
    //       bodies: ['HEADER', 'TEXT'],
    //       markSeen: false,
    //     });

    //     fetch.on('message', (msg: any, seqno: number) => {
    //       let header: any = {};
    //       let body = '';

    //       msg.on('body', (stream: any, info: any) => {
    //         let buffer = '';
    //         stream.on('data', (chunk: any) => {
    //           buffer += chunk.toString('utf8');
    //         });
    //         stream.once('end', () => {
    //           if (info.which === 'HEADER') {
    //             header = this.parseEmailHeader(buffer);
    //           } else {
    //             body = buffer;
    //           }
    //         });
    //       });

    //       msg.once('end', () => {
    //         this.processIncomingEmail(header, body, seqno);
    //       });
    //     });
    //   });
    // } catch (error) {
    //   logger.error('Error fetching emails:', error);
    // }
  }

  private parseEmailHeader(headerStr: string): any {
    const lines = headerStr.split('\n');
    const header: any = {};

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        header[key] = value;
      }
    });

    return header;
  }

  private async processIncomingEmail(header: any, body: string, seqno: number) {
    try {
      const fromEmail = header.from;
      const subject = header.subject || '';
      const messageId = header['message-id'] || `imap_${Date.now()}_${seqno}`;

      // Try to find client by email
      const client = await prisma.client.findFirst({
        where: { email: { contains: fromEmail.includes('<') ? fromEmail.split('<')[1].split('>')[0] : fromEmail } },
      });

      // Save email to database
      const email = await prisma.email.create({
        data: {
          messageId,
          clientId: client?.id,
          fromEmail,
          toEmail: 'placeholder@example.com', // Placeholder, will be updated with actual SMTP user
          subject,
          content: body,
          isRead: false,
          isSent: false,
          receivedAt: new Date(),
        },
      });

      // Analyze email with AI if client found
      // if (client && config.ENABLE_AI_ANALYSIS) { // Removed as config is removed
      //   try {
      //     const analysis = await aiService.analyzeWhatsAppMessage( // Removed as aiService is removed
      //       `Email: ${subject}\n\n${body}`,
      //       `Cliente: ${client.firstName} ${client.lastName}`
      //     );

      //     await prisma.email.update({
      //       where: { id: email.id },
      //       data: {
      //         // Store AI analysis in a JSON field if available
      //       },
      //     });
      //   } catch (aiError) {
      //     logger.error('Error analyzing email with AI:', aiError);
      //   }
      // }

      // Emit event for real-time updates
      this.emit('email_received', {
        email,
        client,
        analysis: null, // Could include AI analysis
      });

      logger.info(`Email processed: ${subject} from ${fromEmail}`);
    } catch (error) {
      logger.error('Error processing incoming email:', error);
    }
  }

  async sendPracticeReminder(practiceId: string): Promise<void> {
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      include: { client: true },
    });

    if (!practice || !practice.client?.email) {
      throw new Error('Practice or client email not found');
    }

    await this.sendTemplateEmail('practice_reminder', practice.client.email, {
      clientName: `${practice.client.firstName} ${practice.client.lastName}`,
      practiceTitle: practice.title,
      practiceType: practice.type,
      practiceStatus: practice.status,
      dueDate: practice.dueDate?.toLocaleDateString('it-IT') || 'Non specificata',
      description: practice.description || '',
      studioName: 'Studio Geometra',
    });
  }

  async sendPracticeCompletedNotification(practiceId: string): Promise<void> {
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      include: { 
        client: true,
        documents: { take: 5 },
      },
    });

    if (!practice || !practice.client?.email) {
      throw new Error('Practice or client email not found');
    }

    await this.sendTemplateEmail('practice_completed', practice.client.email, {
      clientName: `${practice.client.firstName} ${practice.client.lastName}`,
      practiceTitle: practice.title,
      invoiceNumber: practice.invoiceNumber || '',
      amount: practice.amount?.toString() || '',
      documents: practice.documents.length > 0 ? 'Sì' : '',
      studioName: 'Studio Geometra',
    });
  }

  async sendAppointmentReminder(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment || !appointment.client?.email) {
      throw new Error('Appointment or client email not found');
    }

    await this.sendTemplateEmail('appointment_reminder', appointment.client.email, {
      clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
      appointmentDate: appointment.startTime.toLocaleDateString('it-IT'),
      appointmentTime: appointment.startTime.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      location: appointment.location || 'Studio',
      notes: appointment.notes || '',
      studioName: 'Studio Geometra',
    });

    // Mark reminder as sent
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });
  }

  async getEmails(filters: {
    clientId?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { clientId, isRead, limit = 50, offset = 0 } = filters;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (isRead !== undefined) where.isRead = isRead;

    return await prisma.email.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async markEmailAsRead(emailId: string): Promise<void> {
    await prisma.email.update({
      where: { id: emailId },
      data: { isRead: true },
    });
  }

  getTemplates(): EmailTemplate[] {
    return this.templates;
  }

  isServiceReady(): boolean {
    return this.isConnected;
  }
}

export const emailService = new EmailService();
export default emailService;
