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
    curl

# Installa il language pack italiano per Tesseract (ita)
RUN mkdir -p /usr/share/tessdata && \
    curl -fsSL -o /usr/share/tessdata/ita.traineddata \
    https://github.com/tesseract-ocr/tessdata_best/raw/main/ita.traineddata

WORKDIR /app

# Copia package.json e installa dipendenze (inclusi dev per build)
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Installa dipendenze (dev incluse per poter buildare)
RUN npm install && \
    cd backend && npm install && \
    cd ../frontend && npm install

# Build stage
FROM base AS builder

WORKDIR /app

# Copia tutto il codice
COPY . .

# Genera Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Installa dipendenze runtime
RUN apk add --no-cache \
    ffmpeg \
    tesseract-ocr \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype \
    curl \
    chromium

# Installa il language pack italiano per Tesseract (ita)
RUN mkdir -p /usr/share/tessdata && \
    curl -fsSL -o /usr/share/tessdata/ita.traineddata \
    https://github.com/tesseract-ocr/tessdata_best/raw/main/ita.traineddata

WORKDIR /app

# Installa ts-node per eseguire TypeScript direttamente
RUN npm install -g ts-node

# Copia i file necessari
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/src ./backend/src
COPY --from=builder /app/backend/tsconfig.json ./backend/tsconfig.json
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

# Crea directory per dati persistenti
RUN mkdir -p /app/data/uploads /app/data/whatsapp_session

# Variabili ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Esponi porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD sh -c "cd backend && ts-node --transpile-only --project tsconfig.json src/healthcheck.ts" || exit 1

# Avvia applicazione
CMD ["sh", "-c", "cp -r /app/frontend/dist/* /app/frontend/dist/. 2>/dev/null || true && cd backend && ts-node --transpile-only --project tsconfig.json src/server.ts"]
