import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string; // Con prefisso +39
  whatsappNumber?: string; // Numero WhatsApp separato
  role: 'ADMIN' | 'GEOMETRA' | 'SECRETARY';
  createdAt: string;
  lastLogin?: string;
}

export interface AppSettings {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  whatsapp: {
    enabled: boolean;
    phoneNumber?: string;
    apiKey?: string;
  };
  email: {
    provider: 'gmail' | 'outlook' | 'custom';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    secure: boolean;
  };
  general: {
    companyName: string;
    timezone: string;
    language: string;
  };
}

class FileStorageService {
  private dataDir: string;
  private usersFile: string;
  private settingsFile: string;

  constructor() {
    this.dataDir = '/app/data';
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.ensureDataDir();
    this.initializeDefaults();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initializeDefaults() {
    // Inizializza utenti default se non esistono
    if (!fs.existsSync(this.usersFile)) {
      const defaultUsers: User[] = [
        {
          id: '1',
          email: 'admin@geometra.com',
          firstName: 'Admin',
          lastName: 'Sistema',
          role: 'ADMIN',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'geometra@studiogori.com',
          firstName: 'Mario',
          lastName: 'Gori',
          role: 'GEOMETRA',
          createdAt: new Date().toISOString()
        }
      ];
      this.writeUsers(defaultUsers);
    }

    // Inizializza impostazioni default se non esistono
    if (!fs.existsSync(this.settingsFile)) {
      const defaultSettings: AppSettings = {
        ai: {
          model: 'llama3.2',
          temperature: 0.7,
          maxTokens: 2048
        },
        whatsapp: {
          enabled: false,
          phoneNumber: '',
          apiKey: ''
        },
        email: {
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          username: '',
          password: '',
          secure: true
        },
        general: {
          companyName: 'Studio Gori',
          timezone: 'Europe/Rome',
          language: 'it'
        }
      };
      this.writeSettings(defaultSettings);
    }
  }

  // USERS CRUD
  getUsers(): User[] {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  private writeUsers(users: User[]): void {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users:', error);
      throw new Error('Failed to save users');
    }
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: (users.length + 1).toString(),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.writeUsers(users);
    return newUser;
  }

  updateUser(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    users[userIndex] = { ...users[userIndex], ...userData };
    this.writeUsers(users);
    return users[userIndex];
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);

    if (filteredUsers.length === users.length) {
      return false; // User not found
    }

    this.writeUsers(filteredUsers);
    return true;
  }

  updateUserPassword(id: string, hashedPassword: string): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return null;
    }

    // Note: In the file storage system, we don't store passwords in the users.json
    // This method is just a placeholder - in a real implementation with database,
    // you would update the password hash in the database
    console.log(`Password update requested for user ${id} - would update hash: ${hashedPassword.substring(0, 10)}...`);

    // For file storage, we can't actually update passwords since they're handled by auth
    // But we return the user to indicate success
    return users[userIndex];
  }

  updateUserPhone(id: string, phone?: string, whatsappNumber?: string): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return null;
    }

    users[userIndex].phone = phone;
    users[userIndex].whatsappNumber = whatsappNumber;
    this.writeUsers(users);
    return users[userIndex];
  }

  // SETTINGS CRUD
  getSettings(): AppSettings {
    try {
      const data = fs.readFileSync(this.settingsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading settings:', error);
      throw new Error('Failed to load settings');
    }
  }

  private writeSettings(settings: AppSettings): void {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Error writing settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  // WHATSAPP CONFIG CRUD
  getWhatsAppConfig(): any {
    try {
      const whatsappConfigFile = path.join(this.dataDir, 'whatsapp_config.json');
      const data = fs.readFileSync(whatsappConfigFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading WhatsApp config:', error);
      throw new Error('Failed to load WhatsApp config');
    }
  }

  saveWhatsAppConfig(config: any): void {
    try {
      const whatsappConfigFile = path.join(this.dataDir, 'whatsapp_config.json');
      fs.writeFileSync(whatsappConfigFile, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      throw new Error('Failed to save WhatsApp config');
    }
  }

  getWhatsAppMessages(): any[] {
    try {
      const whatsappMessagesFile = path.join(this.dataDir, 'whatsapp_messages.json');
      const data = fs.readFileSync(whatsappMessagesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading WhatsApp messages:', error);
      return [];
    }
  }

  saveWhatsAppMessages(messages: any[]): void {
    try {
      const whatsappMessagesFile = path.join(this.dataDir, 'whatsapp_messages.json');
      fs.writeFileSync(whatsappMessagesFile, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error('Error saving WhatsApp messages:', error);
      throw new Error('Failed to save WhatsApp messages');
    }
  }

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    const currentSettings = this.getSettings();
    const newSettings: AppSettings = {
      ai: { ...currentSettings.ai, ...updates.ai },
      whatsapp: { ...currentSettings.whatsapp, ...updates.whatsapp },
      email: { ...currentSettings.email, ...updates.email },
      general: { ...currentSettings.general, ...updates.general }
    };
    this.writeSettings(newSettings);
    return newSettings;
  }
}

export const fileStorage = new FileStorageService();

