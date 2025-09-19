# Multi-stage build per ottimizzazione
FROM node:18-alpine AS base

# Installa dipendenze di sistema necessarie
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-ita

WORKDIR /app

# Copia package.json e installa dipendenze
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Installa dipendenze
RUN npm ci --only=production && \
    cd backend && npm ci --only=production && \
    cd ../frontend && npm ci --only=production

# Build stage
FROM base AS builder

WORKDIR /app

# Copia tutto il codice
COPY . .

# Genera Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Production stage
FROM node:18-alpine AS production

# Installa dipendenze runtime
RUN apk add --no-cache \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-ita \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype

WORKDIR /app

# Copia solo i file necessari per produzione
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist

# Crea directory per dati persistenti
RUN mkdir -p /app/data/uploads /app/data/whatsapp_session

# Variabili ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Esponi porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node backend/dist/healthcheck.js || exit 1

# Avvia applicazione
CMD ["node", "backend/dist/server.js"]
