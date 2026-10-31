#!/bin/bash
# ==============================================================================
# Script de Despliegue Automatizado para Azure Virtual Machine (Ubuntu + PM2)
# ==============================================================================

set -e

echo "🚀 [1/5] Actualizando repositorio desde Git..."
git fetch origin main
git reset --hard origin/main

echo "📦 [2/5] Instalando dependencias de Node.js..."
npm install --prefer-offline --no-audit

echo "🔨 [3/5] Compilando aplicación Frontend (Vite)..."
npm run build

echo "📁 [4/5] Creando directorio de logs..."
mkdir -p logs

echo "🔄 [5/5] Reiniciando proceso en PM2..."
pm2 restart calculo-app || pm2 start ecosystem.config.cjs --env production

pm2 save

echo "✅ ¡Despliegue completado con éxito en Azure VM!"
pm2 status calculo-app
