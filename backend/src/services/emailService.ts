import nodemailer from 'nodemailer';
import { Imap } from 'imap';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import prisma from '@/config/database';
import config from '@/config/env';
import { createLogger } from '@/utils/logger';
import aiService from './aiService';

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

  private initializeTransporter() {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      logger.warn('Email SMTP configuration not complete');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });

    // Test connection
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('SMTP connection failed:', error);
      } else {
        logger.info('SMTP server is ready to send emails');
        this.isConnected = true;
      }
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string, attachments?: any[]): Promise<string> {
    if (!this.transporter || !this.isConnected) {
      throw new Error('Email service not initialized or not connected');
    }

    try {
      const mailOptions = {
        from: config.SMTP_USER,
        to,
        subject,
        text,
        html: html || text,
        attachments: attachments || [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${to}: ${subject}`);
      return info.messageId;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTemplateEmail(
    templateId: string, 
    to: string, 
    variables: Record<string, any>,
    attachments?: any[]
  ): Promise<string> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Simple template variable replacement
    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      body = body.replace(regex, String(value));
    });

    // Handle conditional blocks (basic implementation)
    body = body.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    return await this.sendEmail(to, subject, body, undefined, attachments);
  }

  async connectIMAP(): Promise<void> {
    if (!config.IMAP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      logger.warn('IMAP configuration not complete');
      return;
    }

    const imap = new (require('imap'))({
      user: config.SMTP_USER,
      password: config.SMTP_PASS,
      host: config.IMAP_HOST,
      port: config.IMAP_PORT,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        logger.info('IMAP connection ready');
        this.imapConnection = imap;
        this.startEmailMonitoring();
        resolve();
      });

      imap.once('error', (err: Error) => {
        logger.error('IMAP connection error:', err);
        reject(err);
      });

      imap.connect();
    });
  }

  private startEmailMonitoring() {
    if (!this.imapConnection) return;

    this.imapConnection.openBox('INBOX', false, (err: Error, box: any) => {
      if (err) {
        logger.error('Error opening inbox:', err);
        return;
      }

      logger.info('Monitoring inbox for new emails');

      this.imapConnection.on('mail', (numNewMsgs: number) => {
        logger.info(`${numNewMsgs} new email(s) received`);
        this.fetchNewEmails();
      });
    });
  }

  private async fetchNewEmails() {
    if (!this.imapConnection) return;

    try {
      // Fetch unseen emails
      this.imapConnection.search(['UNSEEN'], (err: Error, results: number[]) => {
        if (err || !results.length) return;

        const fetch = this.imapConnection.fetch(results, {
          bodies: ['HEADER', 'TEXT'],
          markSeen: false,
        });

        fetch.on('message', (msg: any, seqno: number) => {
          let header: any = {};
          let body = '';

          msg.on('body', (stream: any, info: any) => {
            let buffer = '';
            stream.on('data', (chunk: any) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              if (info.which === 'HEADER') {
                header = this.parseEmailHeader(buffer);
              } else {
                body = buffer;
              }
            });
          });

          msg.once('end', () => {
            this.processIncomingEmail(header, body, seqno);
          });
        });
      });
    } catch (error) {
      logger.error('Error fetching emails:', error);
    }
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
          toEmail: config.SMTP_USER,
          subject,
          content: body,
          isRead: false,
          isSent: false,
          receivedAt: new Date(),
        },
      });

      // Analyze email with AI if client found
      if (client && config.ENABLE_AI_ANALYSIS) {
        try {
          const analysis = await aiService.analyzeWhatsAppMessage(
            `Email: ${subject}\n\n${body}`,
            `Cliente: ${client.firstName} ${client.lastName}`
          );

          await prisma.email.update({
            where: { id: email.id },
            data: {
              // Store AI analysis in a JSON field if available
            },
          });
        } catch (aiError) {
          logger.error('Error analyzing email with AI:', aiError);
        }
      }

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
