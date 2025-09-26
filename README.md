# Studio Gori - Gestionale Completo

## 🏗️ Descrizione del Progetto

Applicazione web fullstack per la gestione completa della segreteria di Studio Gori con integrazione WhatsApp nativa, AI assistente locale e gestione email automatica.

### ✨ Caratteristiche Principali

- 🔐 **Autenticazione JWT** con ruoli multipli e gestione utenti dinamica
- 👥 **Gestione Clienti** completa con CRUD
- 📋 **Gestione Pratiche** con stati e priorità
- 💬 **WhatsApp Integrato** con supporto multimediale
- 🤖 **AI Assistente Centralizzato** con Ollama e configurazione dinamica
- 📧 **Email Automatica** con template
- 📊 **Dashboard Real-time** con notifiche
- 🏗️ **Deployment Ubuntu** con Docker
- 👤 **Gestione Utenti Dinamica** completa con permessi avanzati
- 🔑 **Sistema Password** sicuro e dinamico

## 🚀 Quick Start

### Installazione su Ubuntu Server

```bash
# Download e setup automatico
wget https://raw.githubusercontent.com/your-repo/geometra-webapp/main/setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

### Sviluppo Locale

```bash
# Clone del repository
git clone https://github.com/your-repo/geometra-webapp.git
cd geometra-webapp

# Setup ambiente
cp env.example .env
npm run install:all

# Avvia database
docker-compose up -d db redis ollama

# Setup database
cd backend && npx prisma migrate dev && npx prisma db seed

# Avvia sviluppo
npm run dev
```

## 🔑 Sistema di Autenticazione

Il sistema utilizza **gestione utenti dinamica** - non ci sono più credenziali statiche!

### Utenti di Sistema

Il database viene automaticamente popolato con utenti di sistema:

- **Admin**: `admin@geometra.com` / `password123`
- **Geometra**: `geometra@geometra.com` / `password123`
- **Segreteria**: `segreteria@geometra.com` / `password123`

### Gestione Utenti Avanzata

- 👤 **Admin** può creare, modificare, eliminare utenti
- 🔑 **Cambio Password** dinamico per tutti gli utenti
- 📱 **Modifica Profilo** per ogni utente
- 🔒 **Permessi Granulari** per ogni ruolo
- 🚫 **Nessun Utente Statico** - tutto dal database

## 📱 Accesso

- **Frontend**: http://localhost:5173 (dev) o https://vps-3dee2600.vps.ovh.net (prod)
- **API**: https://vps-3dee2600.vps.ovh.net/api
- **Database UI**: https://vps-3dee2600.vps.ovh.net/api/prisma-studio

## Stack Tecnologico Richiesto
- **Frontend**: React.js con TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js con Express.js e TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Autenticazione**: JWT con refresh token
- **WhatsApp**: WhatsApp Business API (ufficiale) o whatsapp-web.js
- **Email**: Nodemailer con supporto SMTP/IMAP
- **Storage**: Multer per file upload, AWS S3 o storage locale
- **Real-time**: Socket.IO per notifiche live
- **AI Locale**: Ollama per modelli LLM locali (Llama, Mistral, etc.)
- **AI Processing**: 
  - OpenAI Whisper per trascrizione audio
  - Tesseract.js per OCR immagini
  - Sharp per elaborazione immagini
  - FFmpeg per conversione media
- **API AI Esterne**: Supporto OpenAI, Anthropic, Google Gemini (opzionali)

## Funzionalità Core

### 1. Sistema di Autenticazione Avanzato
- Login/logout sicuro con JWT e refresh token
- **Gestione Utenti Dinamica** completa (no più seeder statico!)
- Gestione ruoli multipli (Admin, Segreteria, Geometra)
- **Cambio Password Dinamico** per tutti gli utenti
- **Modifica Profilo Personale** per ogni utente
- Password recovery via email
- Sessioni persistenti con refresh token automatico
- **Permessi Granulari** - Admin gestisce utenti, utenti modificano solo se stessi

### 2. Dashboard Principale
- Overview delle attività giornaliere
- Statistiche pratiche in corso/completate
- Calendario appuntamenti
- Notifiche in tempo reale
- Widget per messaggi WhatsApp non letti
- Widget per email non lette

### 3. Gestione Clienti (CRUD completo)
- Anagrafica completa (dati personali, fiscali, contatti)
- Storico delle pratiche per cliente
- Note e comunicazioni
- Documenti allegati
- Ricerca avanzata e filtri
- Export dati in CSV/PDF

### 4. Gestione Pratiche
- Tipologie: Condoni, SCIA, Permessi di costruire, Catasto, Topografia, APE, etc.
- Stati: In attesa, In lavorazione, Sospesa, Completata, Archiviata
- Scadenze e promemoria automatici
- Timeline delle attività
- Calcolo automatico compensi
- Generazione preventivi e fatture
- Documenti e allegati organizzati per pratica

### 5. Integrazione WhatsApp (PRIORITARIA)
- **Connessione nativa** senza app esterne
- Ricezione messaggi in tempo reale (testo, audio, immagini, documenti)
- **Gestione messaggi vocali**: trascrizione automatica con Whisper/Speech-to-Text
- **Gestione immagini**: visualizzazione, salvataggio, OCR per estrarre testo
- Invio messaggi multimediali dal gestionale
- Associazione automatica messaggi ai clienti esistenti
- Creazione nuovi clienti da messaggi WhatsApp
- Invio documenti e PDF via WhatsApp
- Template messaggi predefiniti
- Stato di lettura e consegna
- Backup conversazioni e media nel database
- Notifiche desktop per nuovi messaggi
- Player audio integrato per messaggi vocali
- Galleria immagini per ogni conversazione

### 6. AI Assistente Centralizzato (AGGIORNATO v1.2!)
- **Configurazione AI Centralizzata** nella sezione "AI Core" delle Impostazioni
- **Selezione Dinamica Modelli** da Ollama in tempo reale
- **Download Nuovi Modelli** con interfaccia dedicata e pull automatico
- **Prompt Personalizzabili** dalle impostazioni (niente più hardcoded)
- **Risposte Automatiche Unificate** per WhatsApp, Email e Documenti
- **AI Assistant Pro** come pagina separata nel sidebar con chat diretta
- **Framework AI Tools** con 5 tools implementati per function calling:
  - Tool WhatsApp per invio messaggi automatici
  - Tool Calendario per fissare appuntamenti
  - Tool Ricerca Clienti nel database
  - Tool Ricerca Documenti con OCR e trascrizioni
  - Tool Gestione Pratiche (crea, aggiorna, cerca)
- **Orari di Lavoro** configurabili per risposte automatiche
- **Context Management** avanzato per conversazioni multiple

### 7. Gestione Email Automatica
- Configurazione account email multipli
- Ricezione automatica email (IMAP)
- Invio email (SMTP) dal gestionale
- Associazione email ai clienti/pratiche
- Template email personalizzabili
- Firma automatica
- Allegati e documenti
- Filtri automatici per categorizzazione
- Backup email nel database

### 8. Calendario e Appuntamenti
- Calendario interattivo mensile/settimanale/giornaliero
- Appuntamenti con clienti
- Promemoria automatici (email/WhatsApp)
- Sincronizzazione con Google Calendar (opzionale)
- Blocchi orari e disponibilità
- Conferma appuntamenti automatica

### 9. Gestione Documenti
- Upload e organizzazione file per cliente/pratica
- Generazione automatica documenti (contratti, lettere, etc.)
- Template personalizzabili
- Versioning documenti
- Firma digitale (integrazione futura)
- Ricerca full-text nei documenti
- Antivirus integrato per upload

### 10. Sistema di Notifiche
- Notifiche push in-app
- Email automatiche per scadenze
- Messaggi WhatsApp automatici
- Alert per pratiche in scadenza
- Promemoria appuntamenti
- Centro notifiche unificato

### 11. Reporting e Analytics
- **AI Locale con Ollama**: 
  - Installazione e gestione Ollama integrata
  - Modelli locali (Llama 3.1, Mistral, Codellama)
  - Privacy completa - nessun dato inviato esternamente
  - Elaborazione veloce senza costi API
- **Integrazione API Esterne** (opzionale):
  - Supporto OpenAI GPT-4/3.5
  - Anthropic Claude
  - Google Gemini
  - Azure OpenAI
  - Configurazione flessibile API keys
- **Funzionalità AI Segreteria**:
  - **Analisi WhatsApp automatica**: categorizzazione messaggi, urgenza, sentiment
  - **Bozze risposte intelligenti**: suggerimenti contestuali basati su storico cliente
  - **Trascrizione audio**: conversione vocali WhatsApp in testo con riassunto
  - **OCR intelligente**: estrazione dati da immagini (documenti, planimetrie)
  - **Generazione documenti**: lettere, contratti, preventivi personalizzati
  - **Classificazione pratiche**: suggerimento tipologia e priorità automatica
  - **Analisi email**: categorizzazione automatica, estrazione info importanti
  - **Chatbot clienti**: risposte automatiche FAQ comuni
  - **Riassunti intelligenti**: sintesi conversazioni lunghe e pratiche complesse
  - **Promemoria intelligenti**: analisi scadenze e suggerimenti proattivi
- **Interface AI**:
  - Chat AI integrata nella dashboard
  - Comandi rapidi per automazioni
  - Training personalizzato su dati studio
  - Feedback loop per migliorare risposte
  - Modalità "supervisioned" per approvare risposte automatiche
- Report pratiche per periodo
- Statistiche fatturato
- Performance per tipologia pratica
- Grafici e dashboard analytics
- Export report in PDF/Excel
- KPI personalizzabili

## Specifiche Tecniche Dettagliate

### Database Schema (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Client {
  id              String    @id @default(cuid())
  firstName       String
  lastName        String
  email           String?
  phone           String?
  whatsappNumber  String?   @unique
  fiscalCode      String?
  vatNumber       String?
  address         String?
  city            String?
  province        String?
  postalCode      String?
  practices       Practice[]
  appointments    Appointment[]
  documents       Document[]
  whatsappChats   WhatsappMessage[]
  emails          Email[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Practice {
  id          String        @id @default(cuid())
  title       String
  type        PracticeType
  status      PracticeStatus @default(PENDING)
  client      Client        @relation(fields: [clientId], references: [id])
  clientId    String
  description String?
  startDate   DateTime      @default(now())
  dueDate     DateTime?
  completedAt DateTime?
  amount      Decimal?
  documents   Document[]
  activities  Activity[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model WhatsappMessage {
  id            String    @id @default(cuid())
  messageId     String    @unique
  client        Client?   @relation(fields: [clientId], references: [id])
  clientId      String?
  fromMe        Boolean   @default(false)
  content       String
  messageType   MessageType @default(TEXT)
  mediaUrl      String?   // URL del file media (audio, immagine, documento)
  mediaPath     String?   // Path locale del file media
  mediaMimeType String?   // Tipo MIME del file media
  transcription String?   // Trascrizione automatica per audio
  ocrText       String?   // Testo estratto da immagini
  aiAnalysis    String?   // Analisi AI del messaggio
  aiPriority    Priority? // Priorità suggerita dall'AI
  timestamp     DateTime
  isRead        Boolean   @default(false)
  createdAt     DateTime  @default(now())
}

model AIConfiguration {
  id              String   @id @default(cuid())
  provider        AIProvider @default(OLLAMA)
  ollamaModel     String?  @default("llama3.1")
  ollamaEndpoint  String?  @default("http://localhost:11434")
  openaiApiKey    String?
  openaiModel     String?
  anthropicApiKey String?
  anthropicModel  String?
  geminiApiKey    String?
  geminiModel     String?
  isActive        Boolean  @default(true)
  settings        Json?    // Configurazioni specifiche per provider
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AIConversation {
  id          String    @id @default(cuid())
  userId      String
  context     String    // Contesto della conversazione (client, pratica, etc.)
  messages    Json[]    // Array dei messaggi della conversazione
  summary     String?   // Riassunto AI della conversazione
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model MediaFile {
  id            String    @id @default(cuid())
  filename      String
  originalName  String
  mimeType      String
  size          Int
  path          String
  url           String?
  client        Client?   @relation(fields: [clientId], references: [id])
  clientId      String?
  practice      Practice? @relation(fields: [practiceId], references: [id])
  practiceId    String?
  whatsappMsg   WhatsappMessage? @relation(fields: [whatsappMsgId], references: [id])
  whatsappMsgId String?
  transcription String?   // Per file audio
  ocrText       String?   // Per immagini con testo
  aiTags        String[]  // Tag automatici AI
  createdAt     DateTime  @default(now())
}

enum MessageType {
  TEXT
  AUDIO
  IMAGE
  VIDEO
  DOCUMENT
  LOCATION
  CONTACT
}

enum AIProvider {
  OLLAMA
  OPENAI
  ANTHROPIC
  GEMINI
  AZURE_OPENAI
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Role {
  ADMIN
  GEOMETRA
  SECRETARY
}

enum PracticeType {
  CONDONO
  SCIA
  PERMESSO_COSTRUIRE
  CATASTO
  TOPOGRAFIA
  APE
  ALTRO
}

enum PracticeStatus {
  PENDING
  IN_PROGRESS
  SUSPENDED
  COMPLETED
  ARCHIVED
}
```

### API Endpoints Essenziali

#### Autenticazione e Utenti
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- **Gestione Utenti (Admin only):**
  - `GET /api/users` - Lista tutti gli utenti
  - `POST /api/users` - Crea nuovo utente
  - `GET /api/users/:id` - Dettagli utente specifico
  - `PUT /api/users/:id` - Aggiorna utente
  - `DELETE /api/users/:id` - Elimina utente
  - `PUT /api/users/:id/password` - Cambia password utente
  - `PUT /api/users/:id/phone` - Aggiorna numeri telefono
- **Profilo Personale (Tutti gli utenti):**
  - `GET /api/auth/profile` - Visualizza profilo personale
  - `PUT /api/auth/profile` - Modifica profilo personale
  - `PUT /api/auth/change-password` - Cambia password personale

#### Clienti
- `GET /api/clients` - Lista con paginazione e filtri
- `POST /api/clients` - Crea nuovo cliente
- `GET /api/clients/:id` - Dettagli cliente
- `PUT /api/clients/:id` - Aggiorna cliente
- `DELETE /api/clients/:id` - Elimina cliente

#### Pratiche
- `GET /api/practices` - Lista pratiche
- `POST /api/practices` - Crea nuova pratica
- `GET /api/practices/:id` - Dettagli pratica
- `PUT /api/practices/:id` - Aggiorna pratica
- `DELETE /api/practices/:id` - Elimina pratica

#### WhatsApp Business API
- `GET /api/whatsapp/status` - Stato configurazione e token webhook
- `GET /api/whatsapp/config` - Configurazione attuale (admin only)
- `POST /api/whatsapp/config` - Aggiorna configurazione (admin only)
- `POST /api/whatsapp/test-connection` - Test connessione API Facebook
- `POST /api/whatsapp/test-ai` - Test AI e modelli Ollama
- `POST /api/whatsapp/generate-token` - Genera nuovo token webhook (admin only)
- `GET /api/whatsapp/webhook` - Endpoint verifica webhook Facebook (GET)
- `POST /api/whatsapp/webhook` - Ricezione messaggi Facebook (POST)
- `GET /api/whatsapp/messages` - Lista messaggi con filtri media
- `POST /api/whatsapp/send` - Invia messaggio (testo/media)
- `POST /api/whatsapp/send-audio` - Invia messaggio audio
- `POST /api/whatsapp/send-image` - Invia immagine
- `POST /api/whatsapp/connect` - Connetti WhatsApp
- `POST /api/whatsapp/disconnect` - Disconnetti
- `POST /api/whatsapp/transcribe` - Trascrivi audio
- `POST /api/whatsapp/ocr` - Estrai testo da immagine
- `GET /api/whatsapp/media/:messageId` - Download media

#### AI Assistente (AGGIORNATO v1.2!)
- `GET /api/ai/models` - Lista modelli disponibili da Ollama in tempo reale
- `POST /api/ai/pull-model` - Scarica nuovo modello da Ollama
- `POST /api/ai/chat` - Chat diretta con AI (configurazione dinamica)
- `POST /api/ai/test-tools` - Test framework AI Tools con function calling
- `POST /api/ai/configure` - Configura provider AI
- `GET /api/ai/config` - Ottieni configurazione AI
- `POST /api/ai/analyze-message` - Analizza messaggio WhatsApp
- `POST /api/ai/generate-response` - Genera risposta suggerita
- `POST /api/ai/transcribe-audio` - Trascrivi file audio
- `POST /api/ai/extract-text` - OCR da immagine
- `POST /api/ai/generate-document` - Genera documento
- `POST /api/ai/classify-practice` - Classifica tipo pratica
- `GET /api/ai/suggestions` - Suggerimenti AI contestuali
- `POST /api/ai/summarize` - Riassumi conversazione/pratica

#### Media Management
- `POST /api/media/upload` - Upload file media
- `GET /api/media/:id` - Ottieni file media
- `POST /api/media/process` - Elabora file (OCR, trascrizione)
- `GET /api/media/gallery/:clientId` - Galleria media cliente

#### Email
- `GET /api/emails` - Lista email
- `POST /api/emails/send` - Invia email
- `POST /api/emails/configure` - Configura account
- `GET /api/emails/accounts` - Lista account configurati

### Architettura Frontend

#### Struttura Cartelle
```
src/
├── components/
│   ├── ui/              # Shadcn components
│   ├── forms/           # Form components
│   ├── tables/          # Data tables
│   ├── charts/          # Analytics charts
│   ├── media/           # Media components (audio player, image gallery)
│   ├── ai/              # AI chat interface, suggestions
│   └── layout/          # Layout components
├── pages/
│   ├── auth/            # Login, register
│   ├── dashboard/       # Main dashboard
│   ├── clients/         # Client management
│   ├── practices/       # Practice management
│   ├── whatsapp/        # WhatsApp conversations only (config moved)
│   ├── ai-assistant-pro/# AI Assistant Pro direct chat (NEW!)
│   ├── email/           # Email management
│   ├── media/           # Media gallery and management
│   └── settings/        # Configuration (AI Core centralized)
├── hooks/               # Custom React hooks
├── services/            # API services
│   ├── ai/              # AI service integrations
│   ├── media/           # Media processing services
│   └── whatsapp/        # WhatsApp API services
├── store/               # Zustand store
├── types/               # TypeScript types
├── utils/               # Utility functions
│   ├── ai/              # AI processing utilities
│   ├── media/           # Media processing utilities
│   └── whatsapp/        # WhatsApp utilities
└── workers/             # Web workers for heavy processing
```

#### Store State Management (Zustand)
```typescript
interface AppStore {
  user: User | null
  clients: Client[]
  practices: Practice[]
  whatsappMessages: WhatsappMessage[]
  emails: Email[]
  notifications: Notification[]
  aiConfig: AIConfiguration | null
  aiConversations: AIConversation[]
  mediaFiles: MediaFile[]
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  fetchClients: () => Promise<void>
  createClient: (client: CreateClientInput) => Promise<void>
  sendWhatsappMessage: (message: SendMessageInput) => Promise<void>
  sendWhatsappMedia: (media: SendMediaInput) => Promise<void>
  transcribeAudio: (audioFile: File) => Promise<string>
  extractTextFromImage: (imageFile: File) => Promise<string>
  
  // AI Actions
  configureAI: (config: AIConfigInput) => Promise<void>
  chatWithAI: (message: string, context?: string) => Promise<string>
  analyzeWhatsappMessage: (messageId: string) => Promise<AIAnalysis>
  generateResponse: (messageId: string) => Promise<string>
  classifyPractice: (description: string) => Promise<PracticeType>
  summarizeConversation: (conversationId: string) => Promise<string>
  // ... other actions
}
```

## Sicurezza e Performance

### Sicurezza
- Validazione input con Joi/Zod
- Rate limiting per API
- CORS configurato correttamente
- Headers di sicurezza (Helmet.js)
- Sanitizzazione dati
- Crittografia password con bcrypt
- Validazione file upload
- XSS protection

### Performance
- Lazy loading componenti React
- Paginazione server-side
- Caching con Redis (opzionale)
- Compressione response
- Ottimizzazione bundle Webpack
- CDN per assets statici
- Database indexing appropriato

## Configurazione Deployment

### Variabili Ambiente
```env
# Database
DATABASE_URL="postgresql://..."
POSTGRES_DB=geometra_app
POSTGRES_USER=admin
POSTGRES_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp_session
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret
WHATSAPP_MEDIA_PATH=./uploads/whatsapp

# AI Configuration
# Ollama (Locale - Default)
OLLAMA_ENDPOINT=http://ollama:11434
OLLAMA_MODEL=llama3.1
OLLAMA_ENABLED=true

# OpenAI (Opzionale)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4
OPENAI_ENABLED=false

# Anthropic (Opzionale)
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-sonnet
ANTHROPIC_ENABLED=false

# Google Gemini (Opzionale)
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-pro
GEMINI_ENABLED=false

# AI Processing
WHISPER_MODEL=base
ENABLE_AUDIO_TRANSCRIPTION=true
ENABLE_OCR=true
ENABLE_AI_ANALYSIS=true
AI_RESPONSE_TIMEOUT=30000

# Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,png

# App
NODE_ENV=production
PORT=3000
CLIENT_URL=https://vps-3dee2600.vps.ovh.net
API_URL=https://vps-3dee2600.vps.ovh.net/api
```

### Docker Setup
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Architettura Container Separati

🔑 **IMPORTANTE**: L'applicazione utilizza **2 CONTAINER SEPARATI** per garantire la separazione degli ambienti:

1. **`app`** → Backend Express.js con API REST (porta 3000)
2. **`frontend`** → Nginx per servire React build (porta 80)

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/geometra_app
      - OLLAMA_ENDPOINT=http://ollama:11434
    depends_on:
      - db
      - ollama
      - redis
    volumes:
      - app_data:/app/data
    labels:
      # Solo API routes (/api/*)
      - "traefik.http.routers.api.rule=Host(`vps-3dee2600.vps.ovh.net`) && PathPrefix(`/api`)"
      - "traefik.http.services.api.loadbalancer.server.port=3000"

  frontend:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro 
    depends_on:
      - app
    labels:
      # Tutte le route non-API (/, /settings, /dashboard, etc.)
      - "traefik.http.routers.frontend.rule=Host(`vps-3dee2600.vps.ovh.net`)"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: studio_gori_app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  traefik:
    image: traefik:v3.2
    command:
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./letsencrypt:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro

volumes:
  postgres_data:
  ollama_data:
  redis_data:
  app_data:
```

## Fasi di Sviluppo

### Fase 1 - Setup e Autenticazione (Week 1-2)
1. Setup progetto e configurazione
2. Database schema e Prisma setup
3. Sistema di autenticazione JWT
4. Layout base e routing
5. Componenti UI base con Shadcn

### Fase 2 - Core CRUD (Week 3-4)
1. Gestione clienti completa
2. Gestione pratiche base
3. Dashboard principale
4. Sistema di notifiche base

### Fase 3 - WhatsApp Integration (Week 5-6)
1. Configurazione WhatsApp Business API
2. Ricezione messaggi real-time (testo, audio, immagini)
3. Invio messaggi multimediali dal gestionale
4. Trascrizione automatica audio con Whisper
5. OCR per estrazione testo da immagini
6. Associazione messaggi-clienti
7. Interface chat integrata con player audio e galleria immagini

### Fase 4 - AI Integration (Week 7-8)
1. Setup Ollama e modelli locali
2. Configurazione API esterne (OpenAI, Anthropic, Gemini)
3. Sistema di analisi messaggi WhatsApp automatica
4. Generazione risposte intelligenti
5. Trascrizione e OCR con AI
6. Classificazione automatica pratiche
7. Chat AI integrata nella dashboard

### Fase 5 - Email Integration (Week 9-10)
1. Configurazione SMTP/IMAP
2. Ricezione email automatica con analisi AI
3. Invio email dal gestionale
4. Template email system con AI suggestions
5. Associazione email-pratiche automatica

### Fase 6 - Features Avanzate (Week 11-12)
1. Calendario e appuntamenti
2. Gestione documenti avanzata con AI
3. Reporting e analytics con insights AI
4. Ottimizzazioni performance

### Fase 7 - Testing e Deploy (Week 13-14)
1. Testing completo (incluso AI e media processing)
2. Ottimizzazioni sicurezza
3. Documentation completa
4. Deployment e monitoring
5. Training modelli AI personalizzati

## Note Implementative Critiche

### WhatsApp Implementation
- Utilizzare WhatsApp Business API ufficiale per stabilità
- Implementare webhook per messaggi in entrata multimediali
- Gestire correttamente la sessione WhatsApp
- **Media Processing**: 
  - Implementare storage sicuro per audio/immagini
  - Pipeline di elaborazione asincrona per trascrizione/OCR
  - Compressione e ottimizzazione automatica media
  - Backup automatico dei file multimediali
- Backup periodico delle conversazioni e media
- Handling degli errori di connessione e riconnessione automatica

### AI Integration
- **Ollama Setup**: Docker container per Ollama con modelli preinstallati
- **Fallback Strategy**: Sistema di fallback da locale ad API esterne
- **Context Management**: Gestione del contesto conversazionale per AI
- **Privacy Controls**: Dati sensibili processati solo localmente
- **Performance**: Caching delle risposte AI frequenti
- **Training**: Sistema per migliorare le risposte basato su feedback utente

### Media Processing
- **Audio Processing**: 
  - Supporto formati: MP3, WAV, OGG, M4A
  - Trascrizione con Whisper OpenAI
  - Noise reduction e normalizzazione audio
- **Image Processing**:
  - Supporto formati: JPEG, PNG, WebP, PDF
  - OCR con Tesseract per italiano
  - Compressione intelligente per storage ottimizzato
  - Riconoscimento documenti tecnici (planimetrie, certificati)

### Email Processing
- Implementare polling IMAP ottimizzato
- Gestione allegati grandi
- Filtri antispam integrati
- Sincronizzazione bidirezionale
- Gestione account multipli

### Real-time Features
- WebSocket per aggiornamenti live
- Notifiche push browser
- Sincronizzazione stato tra tab
- Handling disconnessioni

## Deliverables Finali
1. Applicazione web fullstack funzionante con AI integrata
2. Database con dati di test e configurazioni AI
3. Documentazione API completa (inclusi endpoint AI)
4. **Setup Ollama** con modelli preconfigurati
5. **Guida configurazione AI** per provider esterni
6. Manuale utente con sezione AI assistente
7. Guida deployment (incluso Ollama Docker)
8. Test suite completa (inclusi test AI e media processing)
9. Docker configuration per production con tutti i servizi

## Criteri di Successo
- [x] **Login/logout funzionante con ruoli**
- [x] **Sistema di autenticazione avanzato con JWT e refresh token**
- [x] **Gestione utenti dinamica completa (NOVITÀ!)**
- [x] **Sistema password dinamico e sicuro**
- [x] **CRUD completo clienti e pratiche**
- [x] **WhatsApp Business API completo con OAuth**
- [x] **Test connessione e validazione credenziali**
- [x] **Webhook Facebook con token automatico**
- [x] **Gestione messaggi multimediali completa**
- [x] **Trascrizione automatica messaggi vocali**
- [x] **OCR automatico per immagini WhatsApp**
- [x] **AI Ollama locale funzionante e testato**
- [x] **Configurazione AI centralizzata nel tab AI Core**
- [x] **Selezione dinamica modelli da Ollama**
- [x] **Download nuovi modelli con interfaccia dedicata**
- [x] **AI Assistant Pro separato nel sidebar**
- [x] **Framework AI Tools con 5 tools implementati**
- [x] **Prompt personalizzabili dalle impostazioni**
- [x] **Risposte automatiche unificate per tutti i servizi**
- [ ] **Configurazione API esterne AI (OpenAI, Claude, Gemini)**
- [ ] Email ricezione/invio automatico con analisi AI
- [ ] Dashboard informativa e real-time con insights AI
- [ ] Gestione documenti completa con AI processing
- [ ] Notifiche automatiche intelligenti
- [ ] **Player audio integrato per WhatsApp**
- [ ] **Galleria immagini per conversazioni**
- [ ] Performance ottimali (<2s load time, <5s AI response)
- [ ] Mobile responsive
- [ ] Deploy production ready con tutti i servizi AI

## 🛠️ Comandi Utili

### Sviluppo
```bash
npm run dev              # Avvia frontend e backend
npm run dev:backend      # Solo backend
npm run dev:frontend     # Solo frontend
npm run setup:dev        # Setup completo ambiente sviluppo
```

### WhatsApp Business API
```bash
# Test connessione API
curl -X POST http://localhost:3000/api/whatsapp/test-connection \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test AI Ollama
curl -X POST http://localhost:3000/api/whatsapp/test-ai \
  -H "Authorization: Bearer YOUR_TOKEN"

# Visualizza stato WhatsApp
curl http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ollama AI
```bash
# Test modello AI (diretto Ollama)
curl http://localhost:11434/api/generate \
  -d '{"model":"mistral:7b","prompt":"Test","stream":false}'

# Lista modelli disponibili (diretto Ollama)
curl http://localhost:11434/api/tags

# Test AI tramite API Studio Gori
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test AI", "model": "mistral:7b", "temperature": 0.7}'

# Lista modelli tramite API Studio Gori
curl -X GET http://localhost:3000/api/ai/models \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download nuovo modello
curl -X POST http://localhost:3000/api/ai/pull-model \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelName": "llama3.1:8b"}'
```

### Database
```bash
npm run prisma:migrate   # Esegui migrazioni
npm run prisma:generate  # Genera client Prisma
npm run prisma:studio    # Apri Prisma Studio
npm run prisma:reset     # Reset completo database
```

### Gestione Utenti
```bash
# Non c'è più seeder statico - gli utenti sono dinamici!
# Il database viene configurato automaticamente con:
# - Schema completo con tabelle utenti, clienti, pratiche
# - Utenti di sistema predefiniti
# - Permessi e ruoli configurati

# Test gestione utenti (dopo login admin)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@geometra.com", "password": "password123"}'

# Crea nuovo utente (admin only)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "nuovo@studio.com", "firstName": "Nuovo", "lastName": "Utente", "role": "SECRETARY"}'

# Lista tutti gli utenti (admin only)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Sistema Password
```bash
# Test cambio password personale
curl -X PUT http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "vecchia", "newPassword": "nuova123"}'

# Test cambio password altri utenti (admin only)
curl -X PUT http://localhost:3000/api/users/USER_ID/password \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "nuovaPassword123"}'
```

### Docker - Gestione Container Separati

🔑 **ARCHITETTURA DUAL-CONTAINER**: 
- `app` → Backend Express API
- `frontend` → Nginx serving React build

#### Comandi Base
```bash
npm run docker:up        # Avvia tutti i servizi
npm run docker:down      # Ferma tutti i servizi
npm run docker:build     # Build immagini
npm run docker:logs      # Visualizza log
npm run docker:db        # Solo database e cache
```

#### 📋 PROCESSO DEPLOYMENT CORRETTO (2 Container)

**SEMPRE seguire questo ordine per deployment:**

1. **Modifica codice backend** (API, servizi, route):
   ```bash
   # Copia SOLO se necessario (files già locali)
   docker compose cp app:/app/backend/src ./backend/
   ```

2. **Modifica codice frontend** (React, UI, components):
   ```bash
   cd frontend && npm run build  # Build sempre locale!
   # Il volume mount ./frontend/dist fa il resto
   ```

3. **Build container app** (solo se modifiche backend):
   ```bash
   docker compose build app --no-cache
   ```

4. **Deploy entrambi i container**:
   ```bash
   docker compose down
   docker compose up -d
   ```

5. **Verifica entrambi i servizi**:
   ```bash
   # Frontend
   curl https://vps-3dee2600.vps.ovh.net/ | grep index-
   
   # Backend API  
   curl https://vps-3dee2600.vps.ovh.net/api/health
   ```

#### ⚠️ CRITICAL: File Management Separato

- **Backend**: Modifiche in `./backend/src` → Build container `app`
- **Frontend**: Modifiche in `./frontend/src` → Build locale → Volume mount automatico
- **Mai copiare frontend DA container**: il build deve essere sempre locale!

### Produzione
```bash
npm run build            # Build per produzione
npm run start            # Avvia produzione
npm run health           # Health check
```

## 📋 Status Sviluppo

- ✅ **Setup Progetto** - Struttura completa frontend/backend
- ✅ **Autenticazione JWT Avanzata** - Login, ruoli, sicurezza, gestione utenti dinamica
- ✅ **Database Schema** - Prisma ORM completo con gestione utenti
- ✅ **CRUD Clienti** - Gestione completa clienti
- ✅ **Gestione Utenti Dinamica** - CRUD completo, permessi, password, profili
- ✅ **Sistema Password Dinamico** - Cambio password sicuro e granulare
- ✅ **WhatsApp Business API** - OAuth, webhook, test, AI integration
- ✅ **AI Assistente Centralizzato** - Configurazione AI Core, modelli dinamici, tools
- ✅ **AI Assistant Pro** - Chat diretta separata nel sidebar
- ✅ **Framework AI Tools** - 5 tools per function calling implementati
- ✅ **Frontend WhatsApp** - Solo conversazioni (configurazione spostata)
- ✅ **Docker Setup** - Deploy ready con tutti i servizi
- ✅ **Ubuntu Deployment** - Script automatico + documentazione
- 🔄 **CRUD Pratiche** - In sviluppo
- 🔄 **Email System** - In pianificazione
- 🔄 **Dashboard Real-time** - In pianificazione

## 🏆 Funzionalità Implementate

### ✅ Core System
- Autenticazione JWT con ruoli multipli (Admin, Geometra, Segreteria)
- **Gestione Utenti Dinamica Completa** - CRUD, permessi, password, profili
- Sistema di sicurezza avanzato con rate limiting e permessi granulari
- Database PostgreSQL con schema completo e utenti dinamici
- API REST con validazione e error handling
- **Sistema Password Dinamico** - Cambio password sicuro per tutti gli utenti
- **Modifica Profilo Personale** - Ogni utente può aggiornare i propri dati

### ✅ Gestione Utenti Dinamica (NOVITÀ!)
- **CRUD Completo Utenti** - Admin può creare, modificare, eliminare utenti
- **Sistema Password Dinamico** - Cambio password sicuro per tutti gli utenti
- **Modifica Profilo Personale** - Ogni utente può aggiornare i propri dati
- **Permessi Granulari** - Admin gestisce utenti, utenti modificano solo se stessi
- **Validazione Completa** - Email uniche, password sicure, ruoli validi
- **Database Dinamico** - Niente più seeder statico, tutto dal database!
- **API REST Complete** - Endpoint dedicati per ogni operazione

### ✅ Gestione Clienti
- CRUD completo con paginazione e ricerca
- Validazione dati completa (CF, P.IVA, telefoni)
- Gestione note e documenti allegati
- Contatori statistiche automatici

### ✅ WhatsApp Business API Completo
- **Configurazione OAuth** con Client ID, Access Token, Business Account ID
- **Webhook Facebook** con token di verifica generato automaticamente
- **Test connessione** integrato per validazione credenziali
- **Messaggi real-time** con supporto completo multimediale (testo, audio, immagini, video, documenti)
- **AI automatica** per risposte intelligenti e gestione conversazioni
- **Orari di ufficio** configurabili per risposte automatiche
- **Persistenza JSON** per conversazioni e configurazioni
- **Frontend completo** con interfaccia moderna per gestione WhatsApp
- **Associazione automatica** messaggi-clienti esistenti
- **Creazione clienti** da contatti WhatsApp
- **Storage sicuro** media con organizzazione automatica

### ✅ AI Assistente Centralizzato (AGGIORNATO v1.2!)
- **Configurazione AI Centralizzata** nella sezione "AI Core" delle Impostazioni
- **Selezione Dinamica Modelli** da Ollama in tempo reale (niente più hardcoded)
- **Download Nuovi Modelli** con interfaccia dedicata e pull automatico
- **Prompt Personalizzabili** dalle impostazioni database (niente più hardcoded)
- **AI Assistant Pro Separato** come pagina dedicata nel sidebar con chat diretta
- **Framework AI Tools Completo** con 5 tools implementati per function calling:
  - Tool WhatsApp per invio messaggi automatici
  - Tool Calendario per fissare appuntamenti  
  - Tool Ricerca Clienti nel database con filtri avanzati
  - Tool Ricerca Documenti con OCR e trascrizioni
  - Tool Gestione Pratiche (crea, aggiorna, cerca, verifica scadenze)
- **Risposte Automatiche Unificate** per WhatsApp, Email e Documenti
- **Ollama locale attivo** (privacy-first) con modelli Mistral 7B e Mistral Small 3.1
- **Test AI integrato** per validazione modelli e connessione
- **API esterne opzionali**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Analisi automatica messaggi WhatsApp** (urgenza, sentiment, categoria)
- **Generazione risposte intelligenti** contestuali per WhatsApp
- **Classificazione automatica tipo pratiche** con AI
- **Sistema di fallback robusto** locale → cloud
- **Orari di lavoro AI** configurabili per risposte automatiche
- **Context management** avanzato per conversazioni multiple

### ✅ Infrastructure
- **Docker Compose** completo con tutti i servizi
- **Nginx reverse proxy** con SSL/TLS
- **Redis** per caching e sessioni
- **Backup automatici** database e dati
- **Monitoring e logging** avanzato
- **Health checks** integrati

### ✅ Security & Performance
- Headers di sicurezza con Helmet
- Rate limiting differenziato per endpoint
- Validazione input e sanitizzazione XSS
- Compressione gzip e ottimizzazione assets
- SSL/TLS con certificati auto-generati
- Firewall configurato automaticamente

## 🔧 Configurazione Avanzata

### AI Provider Setup

**Ollama (Locale - Default)**:
```env
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_ENABLED=true
```

**OpenAI (Opzionale)**:
```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4
OPENAI_ENABLED=true
```

**Anthropic Claude (Opzionale)**:
```env
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_MODEL=claude-3-sonnet
ANTHROPIC_ENABLED=true
```

### Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### WhatsApp Business API
```env
WHATSAPP_SESSION_PATH=./data/whatsapp_session
WHATSAPP_MEDIA_PATH=./data/uploads/whatsapp
```

## 📚 Documentazione

- 📖 [Deployment Guide](./README_DEPLOYMENT.md) - Guida completa deployment Ubuntu
- 🔧 [API Documentation](./backend/README.md) - Documentazione API complete
- 🎨 [Frontend Guide](./frontend/README.md) - Guida sviluppo frontend
- 🤖 [AI Integration](./docs/AI_SETUP.md) - Setup assistente AI

## 🆘 Supporto e Troubleshooting

### Problemi Comuni

**WhatsApp non si connette**:
```bash
# Controlla log
docker-compose logs app | grep WhatsApp

# Reset sessione
rm -rf data/whatsapp_session/*
docker-compose restart app
```

**AI non risponde**:
```bash
# Test Ollama
curl http://vps-3dee2600.vps.ovh.net:11434/api/tags

# Verifica modelli
docker-compose exec ollama ollama list
```

**Database errori**:
```bash
# Reset database
npm run prisma:reset

# Riapplica migrazioni
npm run prisma:migrate
```

## 🚀 Roadmap

### Prossime Release

**v1.1 - Gestione Pratiche**:
- CRUD completo pratiche con workflow
- Sistema attività e timeline
- Calcolo automatico compensi
- Generazione documenti

**v1.2 - Email Integration**:
- Ricezione automatica email (IMAP)
- Template email con AI
- Associazione email-pratiche
- Firma digitale

**v1.3 - Dashboard Avanzata**:
- Notifiche real-time con Socket.IO
- Analytics e reporting
- Calendario integrato
- KPI e metriche

**v1.4 - Mobile & Advanced AI**:
- App mobile React Native
- Riconoscimento vocale
- OCR avanzato per documenti tecnici
- Training personalizzato AI

## 📄 Licenza

MIT License - Vedi [LICENSE](./LICENSE) file per dettagli.

---

**Sviluppato con ❤️ per modernizzare gli studi tecnici italiani**

*Versione 1.2.0 - Settembre 2025*

## 📅 Changelog v1.2.0

### 🤖 **AI Assistente Centralizzato (NOVITÀ MAGGIORE!)**
- ✅ **Configurazione AI spostata** dal tab WhatsApp alla sezione "AI Core" delle Impostazioni
- ✅ **Selezione dinamica modelli** da Ollama in tempo reale (niente più hardcoded)
- ✅ **Download nuovi modelli** con interfaccia dedicata per pull automatico
- ✅ **Prompt personalizzabili** dalle impostazioni database invece di hardcoded
- ✅ **AI Assistant Pro separato** come pagina dedicata nel sidebar con chat diretta
- ✅ **Framework AI Tools completo** con 5 tools implementati per function calling:
  - Tool WhatsApp per invio messaggi automatici con contesto
  - Tool Calendario per fissare appuntamenti intelligenti
  - Tool Ricerca Clienti nel database con filtri avanzati
  - Tool Ricerca Documenti con OCR e trascrizioni
  - Tool Gestione Pratiche (crea, aggiorna, cerca, verifica scadenze)
- ✅ **Risposte automatiche unificate** per WhatsApp, Email e Documenti
- ✅ **Orari di lavoro AI** configurabili per risposte automatiche
- ✅ **Context management** avanzato per conversazioni multiple
- ✅ **API endpoints nuovi**: `/api/ai/models`, `/api/ai/pull-model`, `/api/ai/test-tools`

### 🎨 **Refactor Frontend WhatsApp**
- 🔄 **Tab WhatsApp semplificato** - mostra solo conversazioni, configurazione spostata
- 🔧 **Interfaccia AI unificata** - tutta la configurazione AI in un posto
- 📱 **Mobile responsive** migliorato per nuova struttura
- 🧪 **Test Puppeteer** completi per nuove funzionalità

### 🔧 **Miglioramenti Architettura**
- 🏗️ **Backend modulare** - servizi AI separati e riutilizzabili
- 🔗 **API consistenti** - endpoint standardizzati per AI
- 📊 **Configurazione centralizzata** - tutto nel database, niente hardcoded
- 🧪 **Test completi** - API e frontend verificati

### 🐛 **Bug Fix**
- 🐛 Risolto problema modelli AI hardcoded
- 🐛 Sistemata configurazione AI dispersa
- 🐛 Corretta gestione prompt personalizzati
- 🐛 Fix timeout AI con ottimizzazioni

## 📅 Changelog v1.1.0

### 🆕 **Gestione Utenti Dinamica (NOVITÀ MAGGIORE!)**
- ✅ **Rimosso seeder statico** - Sistema completamente dinamico
- ✅ **CRUD completo utenti** - Admin può creare, modificare, eliminare utenti
- ✅ **Sistema password dinamico** - Cambio password sicuro per tutti
- ✅ **Modifica profilo personale** - Ogni utente gestisce i propri dati
- ✅ **Permessi granulari** - Admin gestisce utenti, utenti solo se stessi
- ✅ **API REST complete** - Endpoint dedicati per ogni operazione
- ✅ **Validazione avanzata** - Email uniche, password sicure, ruoli validi
- ✅ **Test completi** - API e frontend verificati con Puppeteer

### 🔧 **Miglioramenti Sistema**
- 🔄 **Database dinamico** - Niente più utenti hardcoded
- 🔐 **Sicurezza avanzata** - Controllo accessi granulare
- 📱 **UX migliorata** - Gestione utenti intuitiva
- 🧪 **Test automatici** - Verifica continua del sistema

### 🐛 **Bug Fix**
- 🐛 Risolto problema credenziali demo non aggiornate
- 🐛 Sistemato permessi utenti normali
- 🐛 Corretta gestione password database
