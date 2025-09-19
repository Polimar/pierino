#!/bin/bash

# Setup script per la webapp geometra
echo "🏗️  Setup Geometra Webapp per Ubuntu Server"
echo "========================================="

# Controlla se il sistema è Ubuntu
if [ ! -f /etc/os-release ] || ! grep -q "ubuntu" /etc/os-release; then
    echo "❌ Questo script è progettato per Ubuntu Server"
    exit 1
fi

# Aggiorna il sistema
echo "📦 Aggiornamento del sistema..."
sudo apt update && sudo apt upgrade -y

# Installa Node.js 18
echo "📦 Installazione Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installa Docker
echo "🐳 Installazione Docker..."
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Installa Docker Compose
echo "🐳 Installazione Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Aggiungi l'utente corrente al gruppo docker
echo "👤 Configurazione permessi Docker..."
sudo usermod -aG docker $USER

# Installa dipendenze di sistema per processing AI
echo "🤖 Installazione dipendenze AI..."
sudo apt install -y ffmpeg tesseract-ocr tesseract-ocr-ita python3 python3-pip

# Crea le directory necessarie
echo "📁 Creazione directory..."
sudo mkdir -p /var/log/geometra
sudo mkdir -p /opt/geometra/data
sudo mkdir -p /opt/geometra/ssl
sudo chown -R $USER:$USER /opt/geometra

# Copia i file del progetto
echo "📋 Copia dei file del progetto..."
cp -r . /opt/geometra/

# Crea il file .env se non esiste
if [ ! -f /opt/geometra/.env ]; then
    echo "⚙️  Creazione file di configurazione..."
    cp /opt/geometra/env.example /opt/geometra/.env
    
    # Genera segreti casuali
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    # Aggiorna il file .env
    sed -i "s/your_super_secret_jwt_key_change_in_production/$JWT_SECRET/g" /opt/geometra/.env
    sed -i "s/your_super_secret_refresh_key_change_in_production/$JWT_REFRESH_SECRET/g" /opt/geometra/.env
    sed -i "s/your_session_secret_change_in_production/$SESSION_SECRET/g" /opt/geometra/.env
    sed -i "s/your_webhook_secret_change_in_production/$WEBHOOK_SECRET/g" /opt/geometra/.env
    
    echo "✅ File .env creato con segreti generati automaticamente"
fi

# Genera certificati SSL self-signed se non esistono
if [ ! -f /opt/geometra/ssl/server.crt ]; then
    echo "🔒 Generazione certificati SSL..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /opt/geometra/ssl/server.key \
        -out /opt/geometra/ssl/server.crt \
        -subj "/C=IT/ST=Italy/L=City/O=Geometra Studio/CN=localhost"
    
    sudo chown -R $USER:$USER /opt/geometra/ssl
    echo "✅ Certificati SSL generati"
fi

# Configura il firewall
echo "🔥 Configurazione firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Installa dipendenze del progetto
echo "📦 Installazione dipendenze del progetto..."
cd /opt/geometra
npm install

# Build dei servizi Docker
echo "🏗️  Build delle immagini Docker..."
sudo docker-compose build

# Crea il servizio systemd
echo "⚙️  Configurazione servizio systemd..."
sudo tee /etc/systemd/system/geometra.service > /dev/null <<EOF
[Unit]
Description=Geometra Webapp
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/geometra
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Abilita e avvia il servizio
sudo systemctl daemon-reload
sudo systemctl enable geometra
sudo systemctl start geometra

# Configurazione backup automatico
echo "💾 Configurazione backup automatico..."
sudo tee /opt/geometra/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/geometra/backups"
mkdir -p $BACKUP_DIR
cd /opt/geometra

# Backup database
docker-compose exec -T db pg_dump -U postgres geometra_app | gzip > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup dati applicazione
tar -czf $BACKUP_DIR/data_$(date +%Y%m%d_%H%M%S).tar.gz data/

# Mantieni solo gli ultimi 7 backup
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /opt/geometra/backup.sh

# Aggiungi cron job per backup giornaliero
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/geometra/backup.sh") | crontab -

# Configurazione log rotation
sudo tee /etc/logrotate.d/geometra > /dev/null <<EOF
/var/log/geometra/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

echo ""
echo "🎉 Setup completato!"
echo "=================================="
echo ""
echo "📊 L'applicazione è disponibile su:"
echo "   HTTP:  http://$(hostname -I | awk '{print $1}')"
echo "   HTTPS: https://$(hostname -I | awk '{print $1}')"
echo ""
echo "🔑 Credenziali di demo:"
echo "   Admin:      admin@geometra.com / password123"
echo "   Geometra:   geometra@geometra.com / password123"
echo "   Segreteria: segreteria@geometra.com / password123"
echo ""
echo "⚙️  Comandi utili:"
echo "   Stato servizi:     sudo systemctl status geometra"
echo "   Restart servizi:   sudo systemctl restart geometra"
echo "   Log applicazione:  sudo docker-compose logs -f"
echo "   Backup manuale:    /opt/geometra/backup.sh"
echo ""
echo "📝 File di configurazione: /opt/geometra/.env"
echo "💾 Backup automatici:      /opt/geometra/backups/"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Modifica i segreti in .env per produzione"
echo "   2. Configura email SMTP in .env"
echo "   3. Sostituisci i certificati SSL self-signed"
echo "   4. Configura le API key AI se necessario"
echo ""
echo "🔄 RIAVVIO NECESSARIO per applicare i permessi Docker"
echo "   Esegui: sudo reboot"
EOF
