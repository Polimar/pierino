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

class WhatsAppService {
  constructor() {
    throw new Error('whatsappService legacy non è più supportato. Usa whatsappBusinessService');
  }
}

export const whatsappService = null as never;
export default whatsappService;
