#!/bin/bash
# Script para aplicar/atualizar a configuração do Apache do XAMPP
# para expor a API Fisio em http://localhost/fisio/api
# e o frontend em http://localhost/fisio/app

echo "Atualizando configuração do Apache..."

# Remove configurações antigas de /fisio do httpd.conf (se houver)
sudo sed -i '/# Configuração para expor a API Laravel/,/# end-fisio-config/d' /opt/lampp/etc/httpd.conf
sudo sed -i '/ProxyPass \/fisio/d' /opt/lampp/etc/httpd.conf
sudo sed -i '/ProxyPassReverse \/fisio/d' /opt/lampp/etc/httpd.conf
sudo sed -i '/ProxyPreserveHost On/d' /opt/lampp/etc/httpd.conf

# Adiciona a nova configuração com marcador
sudo tee -a /opt/lampp/etc/httpd.conf > /dev/null <<'EOF'
# Configuração para expor a API Laravel e o Frontend React
# begin-fisio-config
ProxyPreserveHost On

# API Laravel
# Mantém o prefixo /api/ para que as rotas do Laravel funcionem corretamente
ProxyPass /fisio/api/ http://127.0.0.1:8000/api/
ProxyPassReverse /fisio/api/ http://127.0.0.1:8000/api/

# Frontend React (Vite) - passa o prefixo completo para o Vite
ProxyPass /fisio/app/ http://127.0.0.1:5173/fisio/app/
ProxyPassReverse /fisio/app/ http://127.0.0.1:5173/fisio/app/
# end-fisio-config
EOF

echo "Reiniciando Apache do XAMPP..."
sudo /opt/lampp/xampp restartapache

echo "Configuração aplicada!"
echo ""
echo "Agora inicie os servidores:"
echo "  cd /opt/lampp/htdocs/fisio"
echo "  ./start-api.sh   (em um terminal)"
echo "  ./start-app.sh   (em outro terminal)"
echo ""
echo "Acesse:"
echo "  API:    http://localhost/fisio/api/health"
echo "  App:    http://localhost/fisio/app/"
