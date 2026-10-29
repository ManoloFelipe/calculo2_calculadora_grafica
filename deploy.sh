#!/bin/bash
# ==============================================================================
# Script de Despliegue Automatizado para Azure Virtual Machine (Ubuntu + PM2)
# ==============================================================================

set -e

echo "🚀 [1/5] Actualizando repositorio desde Git..."
git pull origin main || echo "Continuando con archivos locales..."

echo "📦 [2/5] Instalando dependencias de Node.js..."
npm ci --prefer-offline --no-audit || npm install

echo "🔨 [3/5] Compilando aplicación Frontend (Vite)..."
npm run build

echo "📁 [4/5] Creando directorio de logs..."
mkdir -p logs

echo "🔄 [5/5] Iniciando proceso en PM2 (Modo Fork, Puerto 3005)..."
pm2 delete calculo-app > /dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --env production

pm2 save

echo "✅ ¡Despliegue completado con éxito en Azure VM!"
pm2 status calculo-app
