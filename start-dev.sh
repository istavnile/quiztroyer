#!/bin/bash
# Quiztroyer - Script de inicio para desarrollo local
set -e

echo "========================================"
echo "  🎮 QUIZTROYER - Dev Setup"
echo "========================================"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
  echo "📄 Creando backend/.env desde ejemplo..."
  cp backend/.env.example backend/.env
fi

echo ""
echo "📦 Instalando dependencias del backend..."
cd backend && npm install

echo ""
echo "📦 Instalando dependencias del frontend..."
cd ../frontend && npm install

echo ""
echo "🗄️  Configurando base de datos..."
cd ../backend
npx prisma generate
npx prisma db push

echo ""
echo "🌱 Cargando datos de ejemplo..."
npm run db:seed

echo ""
echo "========================================"
echo "  ✅ Todo listo para desarrollo!"
echo ""
echo "  Abre 2 terminales:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "  URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:4000"
echo "  Admin:    http://localhost:5173/admin"
echo "  Password: admin123 (cambiar en .env)"
echo ""
echo "  Demo quiz: http://localhost:5173/join/demo-quiz"
echo "  PIN demo:  1234"
echo "========================================"
