# BACKEND-ONLY Dockerfile - NO FRONTEND BUILD!
FROM node:18-alpine AS base

# Installa dipendenze di sistema necessarie per BACKEND
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

# Copia SOLO backend package.json
COPY backend/package*.json ./backend/

# Installa SOLO dipendenze backend
RUN cd backend && npm install

# Production stage - BACKEND ONLY
FROM node:18-alpine AS production

# Installa dipendenze runtime per BACKEND
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
    chromium \
    openssl \
    openssl-dev

# Installa il language pack italiano per Tesseract (ita)
RUN mkdir -p /usr/share/tessdata && \
    curl -fsSL -o /usr/share/tessdata/ita.traineddata \
    https://github.com/tesseract-ocr/tessdata_best/raw/main/ita.traineddata

WORKDIR /app

# Installa ts-node per eseguire TypeScript direttamente
RUN npm install -g ts-node

# Copia SOLO file backend
COPY --from=base /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/prisma ./backend/prisma

# Genera Prisma client
RUN cd backend && npx prisma generate

# Crea directory per dati persistenti
RUN mkdir -p /app/data/uploads /app/data/whatsapp_session

# Variabili ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Esponi porta
EXPOSE 3000

# Health check (temporarily disabled for debug)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#     CMD sh -c "cd backend && ts-node --transpile-only --project tsconfig.json src/healthcheck.ts" || exit 1

# Avvia SOLO backend
CMD ["sh", "-c", "cd backend && ts-node --transpile-only --project tsconfig.json src/server.ts"]
