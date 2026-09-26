#!/bin/bash
set -e

# Script de deploy para fisio.patropicomunica.com.br
# Arquitetura A2: domínio único com frontend dentro de api/public
# Execute este script no VPS, no diretório do projeto.

# Ajuste APP_DIR conforme o usuário/pasta do seu CloudPanel.
# No seu VPS a pasta correta é /home/patropicomunica-fisio/htdocs/...
DOMAIN="fisio.patropicomunica.com.br"
APP_DIR="/home/patropicomunica-fisio/htdocs/${DOMAIN}"
PUBLIC_DIR="${APP_DIR}/api/public"

echo "=== Deploy do Fisio em ${DOMAIN} ==="

# 1. Dependências do backend
echo "[1/5] Instalando dependências do Laravel..."
cd "${APP_DIR}/api"
composer install --no-dev --optimize-autoloader --no-interaction

# 2. Build do frontend com env de produção
echo "[2/5] Buildando o frontend..."
cd "${APP_DIR}/app"
if [ ! -f .env.production ]; then
    cp .env.production.example .env.production
fi
npm ci
npm run build

# 3. Copiar build do frontend para dentro do public do Laravel
echo "[3/5] Copiando frontend para api/public..."
cp -r "${APP_DIR}/app/dist/"* "${PUBLIC_DIR}/"

# 4. Comandos do Laravel
echo "[4/5] Configurando Laravel..."
cd "${APP_DIR}/api"

if [ ! -f .env ]; then
    echo "AVISO: api/.env não encontrado. Copie api/.env.production.example para api/.env, preencha os dados e gere APP_KEY com 'php artisan key:generate'."
    exit 1
fi

php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Permissões
echo "[5/5] Ajustando permissões..."
chown -R www-data:www-data "${APP_DIR}/api/storage"
chmod -R 775 "${APP_DIR}/api/storage"

echo "=== Deploy finalizado ==="
echo "Próximos passos manuais:"
echo "  - Verifique se api/.env está preenchido corretamente."
echo "  - Cole o conteúdo de config/cloudpanel-vhost.conf no Custom Vhost do CloudPanel."
echo "  - Ative o SSL e reinicie o Nginx."
