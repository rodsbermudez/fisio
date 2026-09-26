#!/bin/bash
# Script para iniciar a API Laravel localmente
# A API ficará disponível em http://127.0.0.1:8000
# E também via proxy em http://localhost/fisio/api (se configurado no Apache)

cd "$(dirname "$0")/api"
echo "Iniciando API Fisio em http://127.0.0.1:8000 ..."
php artisan serve --host=127.0.0.1 --port=8000
