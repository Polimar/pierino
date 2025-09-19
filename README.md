## Descrizione del Progetto
Sviluppa un'applicazione web fullstack per la gestione completa della segreteria di uno studio di geometra con integrazione WhatsApp nativa e gestione email automatica.

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

### 1. Sistema di Autenticazione
- Login/logout sicuro con JWT
- Gestione ruoli (Admin, Segreteria, Geometra)
- Password recovery via email
- Sessioni persistent con refresh token

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

### 6. Gestione Email Automatica
- Configurazione account email multipli
- Ricezione automatica email (IMAP)
- Invio email (SMTP) dal gestionale
- Associazione email ai clienti/pratiche
- Template email personalizzabili
- Firma automatica
- Allegati e documenti
- Filtri automatici per categorizzazione
- Backup email nel database

### 7. Calendario e Appuntamenti
- Calendario interattivo mensile/settimanale/giornaliero
- Appuntamenti con clienti
- Promemoria automatici (email/WhatsApp)
- Sincronizzazione con Google Calendar (opzionale)
- Blocchi orari e disponibilità
- Conferma appuntamenti automatica

### 8. Gestione Documenti
- Upload e organizzazione file per cliente/pratica
- Generazione automatica documenti (contratti, lettere, etc.)
- Template personalizzabili
- Versioning documenti
- Firma digitale (integrazione futura)
- Ricerca full-text nei documenti
- Antivirus integrato per upload

### 9. Sistema di Notifiche
- Notifiche push in-app
- Email automatiche per scadenze
- Messaggi WhatsApp automatici
- Alert per pratiche in scadenza
- Promemoria appuntamenti
- Centro notifiche unificato

### 10. Reporting e Analytics
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

#### Autenticazione
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`

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

#### WhatsApp
- `GET /api/whatsapp/messages` - Lista messaggi con filtri media
- `POST /api/whatsapp/send` - Invia messaggio (testo/media)
- `POST /api/whatsapp/send-audio` - Invia messaggio audio
- `POST /api/whatsapp/send-image` - Invia immagine
- `POST /api/whatsapp/connect` - Connetti WhatsApp
- `GET /api/whatsapp/status` - Stato connessione
- `POST /api/whatsapp/disconnect` - Disconnetti
- `POST /api/whatsapp/transcribe` - Trascrivi audio
- `POST /api/whatsapp/ocr` - Estrai testo da immagine
- `GET /api/whatsapp/media/:messageId` - Download media

#### AI Assistente
- `POST /api/ai/configure` - Configura provider AI
- `GET /api/ai/config` - Ottieni configurazione AI
- `POST /api/ai/chat` - Chat con AI assistente
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
│   ├── whatsapp/        # WhatsApp interface
│   ├── email/           # Email management
│   ├── ai-assistant/    # AI assistant interface
│   ├── media/           # Media gallery and management
│   └── settings/        # Configuration
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
OLLAMA_ENDPOINT=http://localhost:11434
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
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:3000/api
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
    volumes:
      - ./uploads:/app/uploads
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: geometra_app
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
    command: >
      sh -c "ollama serve & 
             sleep 10 && 
             ollama pull llama3.1 && 
             ollama pull mistral && 
             wait"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  ollama_data:
  redis_data:
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
- [ ] Login/logout funzionante con ruoli
- [ ] CRUD completo clienti e pratiche
- [ ] **WhatsApp integrato con supporto audio/immagini**
- [ ] **Trascrizione automatica messaggi vocali**
- [ ] **OCR automatico per immagini WhatsApp**
- [ ] **AI Ollama locale funzionante**
- [ ] **AI assistente per analisi messaggi e generazione risposte**
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

---

**Nota**: Prioritizza l'integrazione WhatsApp e email nelle prime fasi di sviluppo in quanto sono funzionalità core del sistema. Implementa un sistema di logging robusto per debugging delle integrazioni esterne.

---

**Note Finali**: 
- **Priorità Massima**: Integrazione WhatsApp con supporto completo multimediale (audio, immagini, documenti)
- **AI Locale First**: Implementare prima Ollama locale per privacy e controllo, poi aggiungere API esterne come opzione
- **Privacy by Design**: Tutti i dati sensibili devono essere processabili localmente senza inviarli a servizi esterni
- **Performance AI**: Implementare caching intelligente e processing asincrono per mantenere l'app reattiva
- **Fallback System**: Sistema di fallback robusto da AI locale a API esterne in caso di problemi
- **User Training**: Interface per "addestrare" l'AI sulle specifiche dello studio (terminologia, procedure, template)
- **Compliance**: Assicurarsi che la gestione dei dati rispetti GDPR e normative italiane sulla privacy
- **Scalabilità**: Architettura preparata per gestire mig# Prompt per Applicazione Fullstack - Gestionale Studio Geometra
