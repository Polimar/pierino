# Deployment Guide - Studio Gori Webapp

Guida completa per il deployment di Studio Gori su server Ubuntu.

## Requisiti Server

- **OS**: Ubuntu 20.04 LTS o superiore
- **RAM**: Minimo 4GB (consigliato 8GB)
- **Storage**: Minimo 50GB SSD
- **CPU**: 2+ cores
- **Rete**: Connessione internet stabile

## Installazione Automatica

### Metodo 1: Script Automatico (Consigliato)

```bash
# Scarica e esegui lo script di setup
wget https://raw.githubusercontent.com/your-repo/geometra-webapp/main/setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

### Metodo 2: Docker Compose

```bash
# Clona il repository
git clone https://github.com/your-repo/geometra-webapp.git
cd geometra-webapp

# Copia e configura l'ambiente
cp env.example .env
nano .env  # Modifica le configurazioni

# Avvia i servizi
docker-compose up -d
```

## Configurazione Ambiente

### File `.env` principale

```bash
# Database
DATABASE_URL="postgresql://postgres:studiogori2024@db:5432/studio_gori_app"

# JWT Secrets (CAMBIA IN PRODUZIONE!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AI Configuration - Ollama (Locale)
OLLAMA_ENDPOINT=http://ollama:11434
OLLAMA_MODEL=llama3.1
OLLAMA_ENABLED=true

# AI Configuration - API Esterne (Opzionali)
OPENAI_API_KEY=your_openai_key
OPENAI_ENABLED=false
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_ENABLED=false
GEMINI_API_KEY=your_gemini_key
GEMINI_ENABLED=false

# WhatsApp
WHATSAPP_SESSION_PATH=./data/whatsapp_session
WHATSAPP_MEDIA_PATH=./data/uploads/whatsapp

# Storage
UPLOAD_PATH=./data/uploads
MAX_FILE_SIZE=52428800  # 50MB
```

## Servizi Docker

L'applicazione utilizza i seguenti servizi:

### 1. App (Backend + Frontend)
- **Porta**: 3000
- **Funzione**: Server principale con API e frontend
- **Volume**: `app_data:/app/data`

### 2. Database (PostgreSQL)
- **Porta**: 5432
- **Database**: `geometra_app`
- **Volume**: `postgres_data:/var/lib/postgresql/data`

### 3. Ollama (AI Locale)
- **Porta**: 11434
- **Modelli**: Llama 3.1, Mistral
- **Volume**: `ollama_data:/root/.ollama`

### 4. Redis (Cache/Sessioni)
- **Porta**: 6379
- **Volume**: `redis_data:/data`

### 5. Nginx (Reverse Proxy)
- **Porte**: 80, 443
- **SSL**: Certificati in `/etc/nginx/ssl`

## Gestione Servizi

### Comandi Docker Compose

```bash
# Avvia tutti i servizi
docker-compose up -d

# Visualizza stato servizi
docker-compose ps

# Visualizza log
docker-compose logs -f

# Visualizza log di un servizio specifico
docker-compose logs -f app

# Riavvia un servizio
docker-compose restart app

# Aggiorna e riavvia
docker-compose down && docker-compose up -d

# Backup database
docker-compose exec db pg_dump -U postgres geometra_app | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip -c backup_20240101.sql.gz | docker-compose exec -T db psql -U postgres geometra_app
```

### Gestione Systemd

```bash
# Stato del servizio
sudo systemctl status geometra

# Avvia/Ferma servizio
sudo systemctl start geometra
sudo systemctl stop geometra

# Riavvia servizio
sudo systemctl restart geometra

# Abilita/Disabilita avvio automatico
sudo systemctl enable geometra
sudo systemctl disable geometra
```

## Database Management

### Setup Iniziale

```bash
# Accedi al container database
docker-compose exec db psql -U postgres geometra_app

# Esegui migrazioni Prisma
docker-compose exec app npx prisma migrate deploy

# Genera client Prisma
docker-compose exec app npx prisma generate

# Seedare dati di demo
docker-compose exec app npm run seed
```

### Backup e Restore

```bash
# Backup automatico (configurato nel setup)
/opt/geometra/backup.sh

# Backup manuale
docker-compose exec -T db pg_dump -U postgres geometra_app > backup.sql

# Restore da backup
docker-compose exec -T db psql -U postgres geometra_app < backup.sql
```

## Monitoraggio

### Log Files

```bash
# Log applicazione
docker-compose logs -f app

# Log database
docker-compose logs -f db

# Log Nginx
docker-compose logs -f nginx

# Log sistema
sudo journalctl -u geometra -f
```

### Metriche Sistema

```bash
# Utilizzo risorse Docker
docker stats

# Spazio disco
df -h

# Memoria RAM
free -h

# Processi
htop
```

## Sicurezza

### SSL/TLS

1. **Certificati Self-Signed** (generati automaticamente):
   ```bash
   # Rigenerare certificati
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /opt/geometra/ssl/server.key \
     -out /opt/geometra/ssl/server.crt
   ```

2. **Let's Encrypt** (consigliato per produzione):
   ```bash
   # Installa Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Ottieni certificato
   sudo certbot --nginx -d vps-3dee2600.vps.ovh.net
   
   # Rinnovo automatico
   sudo crontab -e
   # Aggiungi: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Firewall

```bash
# Stato firewall
sudo ufw status

# Porte aperte necessarie
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### Aggiornamenti Sicurezza

```bash
# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Aggiorna immagini Docker
docker-compose pull
docker-compose up -d
```

## Performance Tuning

### Database PostgreSQL

```sql
-- Ottimizzazioni performance (dentro il container DB)
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### Redis

```bash
# Configurazione Redis per produzione
echo "maxmemory 512mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
```

### Nginx

```nginx
# Ottimizzazioni Nginx (già incluse in nginx.conf)
gzip on;
gzip_vary on;
gzip_comp_level 6;
client_max_body_size 50M;
```

## Troubleshooting

### Problemi Comuni

1. **Servizio non si avvia**:
   ```bash
   # Controlla log
   docker-compose logs
   
   # Controlla porte occupate
   sudo netstat -tulpn | grep :3000
   
   # Riavvia tutto
   docker-compose down && docker-compose up -d
   ```

2. **Database non raggiungibile**:
   ```bash
   # Controlla stato database
   docker-compose ps db
   
   # Controlla log database
   docker-compose logs db
   
   # Test connessione
   docker-compose exec app npx prisma db push
   ```

3. **WhatsApp non si connette**:
   ```bash
   # Controlla log
   docker-compose logs app | grep WhatsApp
   
   # Rimuovi sessione e riconnetti
   rm -rf data/whatsapp_session/*
   ```

4. **Ollama non funziona**:
   ```bash
   # Controlla stato Ollama
   docker-compose ps ollama
   
   # Test API
   curl http://localhost:11434/api/tags
   
   # Reinstalla modelli
   docker-compose exec ollama ollama pull llama3.1
   ```

### Debug Mode

```bash
# Abilita debug mode
echo "LOG_LEVEL=debug" >> .env
docker-compose restart app

# Controlla log dettagliati
docker-compose logs -f app
```

## Backup e Recovery

### Strategia Backup

1. **Database**: Backup giornaliero automatico
2. **File dati**: Backup incrementale settimanale
3. **Configurazioni**: Backup mensile

### Script Backup Completo

```bash
#!/bin/bash
BACKUP_DIR="/opt/geometra/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec -T db pg_dump -U postgres geometra_app | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application data backup
tar -czf $BACKUP_DIR/data_$DATE.tar.gz data/

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml nginx.conf

# Remote backup (opzionale)
# rsync -av $BACKUP_DIR/ user@backup-server:/backups/geometra/
```

### Recovery

```bash
# Stop servizi
docker-compose down

# Restore database
gunzip -c backups/db_20240101_120000.sql.gz | docker-compose exec -T db psql -U postgres geometra_app

# Restore data
tar -xzf backups/data_20240101_120000.tar.gz

# Restart servizi
docker-compose up -d
```

## Credenziali Default

Dopo l'installazione, utilizza queste credenziali di demo:

- **Admin**: `admin@geometra.com` / `password123`
- **Geometra**: `geometra@geometra.com` / `password123` 
- **Segreteria**: `segreteria@geometra.com` / `password123`

⚠️ **IMPORTANTE**: Cambia immediatamente le password in produzione!

## Supporto

Per supporto tecnico:
1. Controlla i log: `docker-compose logs -f`
2. Verifica la configurazione: `.env`
3. Testa le connessioni di rete
4. Consulta la documentazione API

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Settembre 2024
