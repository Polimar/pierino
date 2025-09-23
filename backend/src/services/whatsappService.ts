import { Client, LocalAuth, MessageMedia, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import config from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('WhatsAppService');

interface QRCodeData {
  qr: string;
  qrImage: string;
}

type StoredMessageType = 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT';

class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private isReady = false;
  private isConnecting = false;
  private qrData: QRCodeData | null = null;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'geometra-client',
        dataPath: config.WHATSAPP_SESSION_PATH,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      try {
        const qrImage = await qrcode.toDataURL(qr);
        this.qrData = { qr, qrImage };
        this.emit('qr', this.qrData);
        logger.info('QR Code generated');
      } catch (error) {
        logger.error('Error generating QR code:', error);
      }
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.isConnecting = false;
      this.qrData = null;
      this.emit('ready');
      logger.info('WhatsApp client is ready');
    });

    this.client.on('authenticated', () => {
      this.emit('authenticated');
      logger.info('WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      this.isConnecting = false;
      this.emit('auth_failure', msg);
      logger.error('WhatsApp authentication failed:', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.isConnecting = false;
      this.emit('disconnected', reason);
      logger.warn('WhatsApp client disconnected:', reason);
    });

    this.client.on('message', async (message) => {
      try {
        await this.handleIncomingMessage(message);
      } catch (error) {
        logger.error('Error handling incoming message:', error);
      }
    });

    this.client.on('message_create', async (message) => {
      if (message.fromMe) {
        try {
          await this.handleOutgoingMessage(message);
        } catch (error) {
          logger.error('Error handling outgoing message:', error);
        }
      }
    });
  }

  private async handleIncomingMessage(message: Message) {
    try {
      const contact = await message.getContact();
      const chat = await message.getChat();
      
      // Determine message type
      let messageType: StoredMessageType = 'TEXT';
      let mediaPath: string | undefined;
      let mediaMimeType: string | undefined;

      if (message.hasMedia) {
        const media = await message.downloadMedia();
        
        if (media) {
          // Save media file
          const mediaDir = path.join(config.WHATSAPP_MEDIA_PATH, contact.number);
          if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
          }

          const fileName = `${Date.now()}_${message.id.id}`;
          const fileExtension = this.getFileExtension(media.mimetype);
          const filePath = path.join(mediaDir, `${fileName}.${fileExtension}`);
          
          fs.writeFileSync(filePath, media.data, 'base64');
          
          mediaPath = filePath;
          mediaMimeType = media.mimetype;
          
          // Determine message type based on MIME type
          if (media.mimetype.startsWith('image/')) {
            messageType = 'IMAGE';
          } else if (media.mimetype.startsWith('audio/')) {
            messageType = 'AUDIO';
          } else if (media.mimetype.startsWith('video/')) {
            messageType = 'VIDEO';
          } else {
            messageType = 'DOCUMENT';
          }
        }
      } else if (message.location) {
        messageType = 'LOCATION';
      } else if (message.vCards && message.vCards.length > 0) {
        messageType = 'CONTACT';
      }

      // Persist to filesystem log (append)
      this.appendToMessagesLog({
        messageId: message.id.id,
        fromMe: false,
        contact: {
          name: contact.pushname || contact.number,
          number: contact.number,
        },
        content: message.body || '',
        messageType,
        mediaPath,
        mediaMimeType,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        isRead: false,
      });

      // Emit event for real-time updates
      this.emit('message_received', {
        message: {
          messageId: message.id.id,
          fromMe: false,
          content: message.body || '',
          messageType,
          mediaPath,
          mediaMimeType,
          timestamp: new Date(message.timestamp * 1000).toISOString(),
          isRead: false,
        },
        contact: {
          name: contact.pushname || contact.number,
          number: contact.number,
        },
      });

      logger.info(`Received message from ${contact.number}: ${message.body?.substring(0, 50)}...`);

    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  private async handleOutgoingMessage(message: Message) {
    try {
      const contact = await message.getContact();
      // Determine message type
      let messageType: StoredMessageType = 'TEXT';
      let mediaPath: string | undefined;
      let mediaMimeType: string | undefined;

      if (message.hasMedia) {
        const media = await message.downloadMedia();
        
        if (media) {
          const mediaDir = path.join(config.WHATSAPP_MEDIA_PATH, contact.number);
          if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
          }

          const fileName = `${Date.now()}_${message.id.id}`;
          const fileExtension = this.getFileExtension(media.mimetype);
          const filePath = path.join(mediaDir, `${fileName}.${fileExtension}`);
          
          fs.writeFileSync(filePath, media.data, 'base64');
          
          mediaPath = filePath;
          mediaMimeType = media.mimetype;
          
          if (media.mimetype.startsWith('image/')) {
            messageType = 'IMAGE';
          } else if (media.mimetype.startsWith('audio/')) {
            messageType = 'AUDIO';
          } else if (media.mimetype.startsWith('video/')) {
            messageType = 'VIDEO';
          } else {
            messageType = 'DOCUMENT';
          }
        }
      }

      // Persist to filesystem log (append)
      this.appendToMessagesLog({
        messageId: message.id.id,
        fromMe: true,
        contact: {
          name: contact.pushname || contact.number,
          number: contact.number,
        },
        content: message.body || '',
        messageType,
        mediaPath,
        mediaMimeType,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        isRead: true,
      });

      logger.info(`Sent message to ${contact.number}: ${message.body?.substring(0, 50)}...`);

    } catch (error) {
      logger.error('Error handling outgoing message:', error);
    }
  }

  private getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mp4': 'm4a',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };

    return extensions[mimeType] || 'bin';
  }

  async connect(): Promise<void> {
    if (this.isReady || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      
      // Ricrea client per evitare stati inconsistenti
      this.initializeClient();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isConnecting = false;
          reject(new Error('Timeout connecting to WhatsApp (60s)'));
        }, 60000);

        this.once('ready', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });

        this.once('qr', () => {
          logger.info('QR code generated, awaiting scan...');
          // Non risolve qui, aspetta 'ready'
        });

        this.once('auth_failure', (msg: string) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          reject(new Error(`Auth failed: ${msg}`));
        });

        this.client?.initialize().catch((err) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          reject(err);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      logger.error('Error connecting to WhatsApp:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      this.isConnecting = false;
      this.qrData = null;
    }
  }

  async sendMessage(to: string, message: string): Promise<string> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const sentMessage = await this.client.sendMessage(chatId, message);
      
      logger.info(`Message sent to ${to}: ${message.substring(0, 50)}...`);
      return sentMessage.id.id;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendMedia(to: string, mediaPath: string, caption?: string): Promise<string> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const media = MessageMedia.fromFilePath(mediaPath);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      
      const sentMessage = await this.client.sendMessage(chatId, media, { caption });
      
      logger.info(`Media sent to ${to}: ${mediaPath}`);
      return sentMessage.id.id;
    } catch (error) {
      logger.error('Error sending media:', error);
      throw error;
    }
  }

  async getChats() {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready');
    }

    const chats = await this.client.getChats();
    return chats.map(chat => ({
      id: chat.id.id,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      lastMessage: chat.lastMessage,
    }));
  }

  async getContacts() {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready');
    }

    const contacts = await this.client.getContacts();
    return contacts.map(contact => ({
      id: contact.id.id,
      name: contact.pushname || contact.name,
      number: contact.number,
      isMyContact: contact.isMyContact,
    }));
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      qrData: this.qrData,
    };
  }

  async markAsRead(_messageId: string): Promise<void> {
    // Filesystem-only: could update a JSON store if needed
    return;
  }

  async getMessages(limit = 50) {
    const log = this.readMessagesLog();
    return log.slice(-limit).reverse();
  }

  private getMessagesLogPath() {
    const dir = path.join(config.WHATSAPP_MEDIA_PATH || '/app/data/uploads/whatsapp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'messages.log.json');
  }

  private readMessagesLog(): any[] {
    const p = this.getMessagesLogPath();
    if (!fs.existsSync(p)) return [];
    try {
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  private appendToMessagesLog(entry: any) {
    const p = this.getMessagesLogPath();
    const curr = this.readMessagesLog();
    curr.push(entry);
    fs.writeFileSync(p, JSON.stringify(curr, null, 2));
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
