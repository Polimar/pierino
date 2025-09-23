#!/bin/bash

echo "🔄 Aggiornamento sviluppo Studio Gori..."

# Build frontend
echo "📦 Building frontend..."
cd /home/ubuntu/pierino/pierino/frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build completato"
    
    # Restart frontend container
    echo "🔄 Riavvio container frontend..."
    cd /home/ubuntu/pierino/pierino
    docker compose restart frontend
    
    echo "✅ Frontend aggiornato e riavviato"
    echo "🌐 Controlla: https://vps-3dee2600.vps.ovh.net/"
else
    echo "❌ Errore nel build del frontend"
    exit 1
fi
