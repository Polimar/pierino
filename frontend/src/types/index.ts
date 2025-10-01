// User and Auth types
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'GEOMETRA' | 'SECRETARY';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'OPERATOR';
}

// Client types
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  fiscalCode?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  birthDate?: string;
  birthPlace?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  practices?: Practice[];
  _count?: {
    practices: number;
    documents: number;
    whatsappChats: number;
    emails: number;
    appointments: number;
  };
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  fiscalCode?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  birthDate?: string;
  birthPlace?: string;
  notes?: string;
}

// Practice types
export interface Practice {
  id: string;
  title: string;
  type: PracticeType;
  status: PracticeStatus;
  priority: Priority;
  clientId: string;
  client?: Client;
  description?: string;
  startDate: string;
  dueDate?: string;
  completedAt?: string;
  amount?: number;
  paidAmount?: number;
  isPaid: boolean;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
  activities?: Activity[];
  appointments?: Appointment[];
}

export type PracticeType = 
  | 'CONDONO'
  | 'SCIA'
  | 'PERMESSO_COSTRUIRE'
  | 'CATASTO'
  | 'TOPOGRAFIA'
  | 'APE'
  | 'SANATORIA'
  | 'AGIBILITA'
  | 'VARIANTE'
  | 'ACCATASTAMENTO'
  | 'VOLTURA'
  | 'VISURA'
  | 'ALTRO';

export type PracticeStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUSPENDED'
  | 'WAITING_DOCUMENTS'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreatePracticeData {
  title: string;
  type: PracticeType;
  clientId: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  amount?: number;
  priority?: Priority;
}

// WhatsApp types
export interface WhatsappMessage {
  id: string;
  messageId: string;
  clientId?: string;
  client?: Client;
  fromMe: boolean;
  content: string;
  messageType: MessageType;
  mediaUrl?: string;
  mediaPath?: string;
  mediaMimeType?: string;
  transcription?: string;
  ocrText?: string;
  aiAnalysis?: string;
  aiPriority?: Priority;
  isRead: boolean;
  timestamp: string;
  createdAt: string;
  mediaFiles?: MediaFile[];
}

export type MessageType = 
  | 'TEXT'
  | 'AUDIO'
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'CONTACT'
  | 'STICKER';

// Document and Media types
export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  clientId?: string;
  practiceId?: string;
  emailId?: string;
  documentType: DocumentType;
  isPublic: boolean;
  extractedText?: string;
  aiTags: string[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 
  | 'CONTRACT'
  | 'INVOICE'
  | 'ESTIMATE'
  | 'CERTIFICATE'
  | 'PLAN'
  | 'PHOTO'
  | 'REPORT'
  | 'CORRESPONDENCE'
  | 'IDENTITY_DOCUMENT'
  | 'CADASTRAL_DOCUMENT'
  | 'OTHER';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  clientId?: string;
  practiceId?: string;
  whatsappMsgId?: string;
  transcription?: string;
  ocrText?: string;
  aiTags: string[];
  thumbnail?: string;
  duration?: number;
  createdAt: string;
}

// Activity types
export interface Activity {
  id: string;
  practiceId: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export type ActivityType = 
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'DOCUMENT_REVIEW'
  | 'SITE_VISIT'
  | 'FILING'
  | 'PAYMENT'
  | 'FOLLOW_UP'
  | 'OTHER';

export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Appointment types
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  client?: Client;
  practiceId?: string;
  practice?: Practice;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  location?: string;
  reminderSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

// Email types
export interface Email {
  id: string;
  messageId: string;
  clientId?: string;
  client?: Client;
  practiceId?: string;
  practice?: Practice;
  fromEmail: string;
  toEmail: string;
  ccEmail?: string;
  bccEmail?: string;
  subject: string;
  content: string;
  htmlContent?: string;
  isRead: boolean;
  isSent: boolean;
  sentAt?: string;
  receivedAt?: string;
  createdAt: string;
  attachments?: Document[];
}

// AI types
export interface AIConfiguration {
  id: string;
  provider: AIProvider;
  ollamaModel?: string;
  ollamaEndpoint?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  isActive: boolean;
  settings?: any;
  maxTokens?: number;
  temperature?: number;
  createdAt: string;
  updatedAt: string;
}

export type AIProvider = 
  | 'OLLAMA'
  | 'OPENAI'
  | 'ANTHROPIC'
  | 'GEMINI'
  | 'AZURE_OPENAI';

export interface AIConversation {
  id: string;
  userId: string;
  title?: string;
  context?: string;
  messages: AIMessage[];
  summary?: string;
  tokenCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: Priority;
  expiresAt?: string;
  createdAt: string;
}

export type NotificationType = 
  | 'PRACTICE_DEADLINE'
  | 'APPOINTMENT_REMINDER'
  | 'WHATSAPP_MESSAGE'
  | 'EMAIL_RECEIVED'
  | 'PAYMENT_DUE'
  | 'DOCUMENT_EXPIRY'
  | 'SYSTEM_ALERT'
  | 'AI_SUGGESTION';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any;
}
