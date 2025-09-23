import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger';

const logger = createLogger('WhatsAppSimple');

interface QRCodeData {
  qr: string;
  qrImage: string;
}

// Simulatore WhatsApp per debug (senza Puppeteer)
class WhatsAppServiceSimple extends EventEmitter {
  private isReady = false;
  private isConnecting = false;
  private qrData: QRCodeData | null = null;
  private sessionDir: string;

  constructor() {
    super();
    this.sessionDir = '/app/data/whatsapp_session';
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    if (this.isReady || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      logger.info('Avvio connessione WhatsApp (simulata)...');

      // Simula generazione QR
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fakeQrData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      this.qrData = {
        qr: 'fake-qr-data-for-testing',
        qrImage: fakeQrData
      };

      this.emit('qr', this.qrData);
      logger.info('QR Code simulato generato');

      // Simula attesa scansione (auto-connessione dopo 10s per test)
      setTimeout(() => {
        this.isReady = true;
        this.isConnecting = false;
        this.qrData = null;
        this.emit('ready');
        logger.info('WhatsApp simulato connesso');
      }, 10000);

    } catch (error) {
      this.isConnecting = false;
      logger.error('Errore connessione WhatsApp simulato:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isReady = false;
    this.isConnecting = false;
    this.qrData = null;
    this.emit('disconnected', 'Manual disconnect');
    logger.info('WhatsApp simulato disconnesso');
  }

  async sendMessage(to: string, message: string): Promise<string> {
    if (!this.isReady) {
      throw new Error('WhatsApp client non connesso');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Salva messaggio inviato su filesystem
    this.appendToMessagesLog({
      messageId,
      fromMe: true,
      contact: { name: to, number: to },
      content: message,
      messageType: 'TEXT',
      timestamp: new Date().toISOString(),
      isRead: true,
    });

    logger.info(`Messaggio simulato inviato a ${to}: ${message.substring(0, 50)}...`);
    return messageId;
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      qrData: this.qrData,
    };
  }

  async getMessages(limit = 50) {
    const log = this.readMessagesLog();
    return log.slice(-limit).reverse();
  }

  async markAsRead(_messageId: string): Promise<void> {
    return;
  }

  private getMessagesLogPath() {
    return path.join(this.sessionDir, 'messages.log.json');
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

export const whatsappService = new WhatsAppServiceSimple();
export default whatsappService;

