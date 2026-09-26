#!/bin/bash
# Script para iniciar o frontend React localmente
# O app ficará disponível em http://localhost:5173

cd "$(dirname "$0")/app"
echo "Iniciando Frontend Fisio em http://localhost:5173 ..."
npm run dev -- --port 5173
