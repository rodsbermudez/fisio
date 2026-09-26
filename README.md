# Fisio - Plataforma de Gestão para Fisioterapeutas

Este projeto é uma aplicação web composta por:

- **Frontend**: React + Vite + Tailwind CSS (`/app`)
- **Backend**: Laravel API (`/api`)
- **Banco de Dados**: MySQL/MariaDB do XAMPP

A arquitetura segue o padrão **decoupled**, onde frontend e backend são mantidos em pastas separadas e se comunicam via API REST.

---

## Estrutura de Pastas

```
/opt/lampp/htdocs/fisio/
├── api/                          # Backend Laravel
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── public/                   # Document root da API
│   ├── routes/
│   ├── .env                      # Configurações da API
│   └── artisan
├── app/                          # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── assets/
│   ├── dist/                     # Build de produção
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── config/                       # Configurações auxiliares
│   ├── apache-fisio.conf         # Configuração do Apache
│   └── update-apache-config.sh   # Script para aplicar config
├── start-api.sh                  # Inicia o backend
├── start-app.sh                  # Inicia o frontend
└── README.md                     # Este arquivo
```

---

## Variáveis de Ambiente e URLs

Todas as URLs do projeto são configuradas por variáveis de ambiente. Isso facilita a migração para produção, onde o frontend e o backend estarão em domínios separados (ex: `app.suadominio.com` e `api.suadominio.com`).

### Frontend (`app/.env`)

```env
# URL da API Laravel
VITE_API_URL=http://localhost/fisio/api

# Base URL do frontend (usado pelo React Router e Vite)
VITE_BASE_URL=/fisio/app/

# Modo do ambiente
VITE_APP_ENV=local
VITE_APP_NAME=Fisio
```

### Backend (`api/.env`)

```env
# URL pública da API
APP_URL=http://localhost/fisio/api

# URLs permitidas pelo CORS (separadas por vírgula)
FRONTEND_URLS=http://localhost/fisio/app,http://localhost:5173,http://app.fisio.local
```

### Exemplo para produção

**Frontend (`app/.env`):**
```env
VITE_API_URL=https://api.suadominio.com
VITE_BASE_URL=/
VITE_APP_ENV=production
VITE_APP_NAME=Fisio
```

**Backend (`api/.env`):**
```env
APP_URL=https://api.suadominio.com
FRONTEND_URLS=https://app.suadominio.com
```

> **Importante**: A comunicação entre app e api é feita sempre pela URL configurada em `VITE_API_URL`, nunca por caminhos locais ou pastas. Isso garante que a aplicação funcione corretamente em qualquer ambiente (local, homologação, produção).

---

## Requisitos do Ambiente

- **XAMPP** instalado e rodando (Apache + MySQL)
- **PHP 8.3+** no sistema (usado pelo Composer e Laravel)
- **Composer** instalado
- **Node.js 18+** e **npm** instalados
- Extensões PHP do sistema:
  ```bash
  sudo apt install -y php8.3-xml php8.3-mysql
  ```

> **Nota importante sobre o XAMPP**: O PHP interno do XAMPP (8.2.12) não possui todas as extensões necessárias para rodar o Laravel diretamente. Por isso, o backend roda via servidor embutido do Laravel (`php artisan serve`), e o Apache do XAMPP faz proxy reverso para ele. Isso evita mexer na instalação do XAMPP.

---

## Configuração do Banco de Dados

1. Acesse o **phpMyAdmin** do XAMPP: `http://localhost/phpmyadmin`
2. Crie o banco de dados com o nome: `Fisio`
3. O collation recomendado é: `utf8mb4_unicode_ci`

As credenciais configuradas na API são:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=Fisio
DB_USERNAME=root
DB_PASSWORD=
```

---

## Configuração do Apache do XAMPP

Para acessar a aplicação pelas URLs amigáveis `localhost/fisio/api` e `localhost/fisio/app`, é necessário configurar o Apache do XAMPP para fazer proxy reverso.

### Aplicar a configuração

Rode o script de configuração:

```bash
sudo /opt/lampp/htdocs/fisio/config/update-apache-config.sh
```

Esse script faz:
1. Remove configurações antigas de `/fisio` do `httpd.conf`
2. Adiciona os proxies para API e frontend
3. Reinicia o Apache do XAMPP

### O que o script adiciona ao `httpd.conf`

```apache
ProxyPreserveHost On

# API Laravel
# Mantém o prefixo /api/ para que as rotas do Laravel funcionem corretamente
ProxyPass /fisio/api/ http://127.0.0.1:8000/api/
ProxyPassReverse /fisio/api/ http://127.0.0.1:8000/api/

# Frontend React (Vite)
ProxyPass /fisio/app/ http://127.0.0.1:5173/fisio/app/
ProxyPassReverse /fisio/app/ http://127.0.0.1:5173/fisio/app/
```

### Requisitos do Apache

Os seguintes módulos devem estar habilitados no XAMPP (geralmente já estão):

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule rewrite_module modules/mod_rewrite.so
```

---

## Iniciando o Projeto

### 1. Inicie a API (Backend Laravel)

Em um terminal:

```bash
cd /opt/lampp/htdocs/fisio
./start-api.sh
```

A API ficará disponível em:
- `http://127.0.0.1:8000`
- `http://localhost/fisio/api/`

### 2. Inicie o Frontend (React)

Em outro terminal:

```bash
cd /opt/lampp/htdocs/fisio
./start-app.sh
```

O frontend ficará disponível em:
- `http://localhost:5173/fisio/app/`
- `http://localhost/fisio/app/`

### 3. Verifique se está funcionando

Teste a API:
```
http://localhost/fisio/api/health
```

Deve retornar:
```json
{"status":"ok","service":"Fisio API","version":"1.0.0","timestamp":"..."}
```

Acesse o app:
```
http://localhost/fisio/app/
```

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `./start-api.sh` | Inicia o backend Laravel na porta 8000 |
| `./start-app.sh` | Inicia o frontend React/Vite na porta 5173 |
| `./config/update-apache-config.sh` | Aplica/atualiza a configuração do proxy no Apache |

---

## Comandos Úteis

### Backend (dentro de `/api`)

```bash
# Instalar dependências
composer install

# Rodar migrations
php artisan migrate

# Gerar chave da aplicação
php artisan key:generate

# Publicar configuração de CORS
php artisan config:publish cors
```

### Frontend (dentro de `/app`)

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Visualizar build de produção
npm run preview
```

---

## Autenticação e Multitenancy

### Modelo de Dados

A plataforma usa **multitenancy lógico** (logical multi-tenancy). Cada contrato é um `tenant`, e todos os dados clínicos estão isolados pelo `tenant_id`.

**Tabelas principais:**

- `tenants`: representa a clínica ou profissional autônomo contratante.
- `users`: fisioterapeutas e administradores vinculados a um tenant.

**Roles de usuário:**

- `admin`: administrador da plataforma SaaS.
- `owner`: dono do tenant (profissional autônomo ou responsável pela clínica).
- `therapist`: fisioterapeuta colaborador de uma clínica.

### Isolamento de Dados

O isolamento por tenant é feito automaticamente pelo **TenantScope** (Global Scope do Eloquent). Todo model que possui `tenant_id` e usa o trait `BelongsToTenant` será filtrado pelo tenant do usuário autenticado.

```php
use App\Traits\BelongsToTenant;

class Patient extends Model
{
    use BelongsToTenant;
}
```

### Autenticação

A autenticação usa **Laravel Sanctum** com tokens Bearer. O frontend armazena o token no `localStorage` e envia no header `Authorization` de cada requisição.

**Rotas públicas:**
- `POST /api/register` — cria tenant e usuário owner
- `POST /api/login` — autentica e retorna token
- `GET /api/health` — verificação de saúde da API

**Rotas protegidas:**
- `GET /api/me` — retorna usuário autenticado
- `POST /api/logout` — revoga token atual

### Usuários de teste

Após rodar os seeders, você pode usar:

```
E-mail: ana@fisioflow.test
Senha: password
```

---

## Funcionalidades Implementadas

### Cadastros base
- Autenticação com Laravel Sanctum via **Bearer token** (login, registro, logout)
- Multitenancy com isolamento por `tenant_id`
- Cadastro de pacientes com máscaras (CPF, telefone, CEP, data) e endereço completo
- Ativação/desativação de pacientes

### Prontuário em 3 níveis
- **Nível 1 — Cadastro geral da paciente**: dados pessoais, endereço e contato de emergência
- **Nível 2 — Ciclo de tratamento**: ciclos com tipos de atendimento, avaliações e planos
- **Nível 3 — Atendimentos**: agendamentos com sala, data, hora, duração e evolução

### Form Builder
- Criação de modelos de ficha com drag-and-drop
- 7 tipos de campo: texto curto, texto longo, número, select, radio, checkbox e toggle
- Versionamento automático quando a ficha é usada em avaliações
- Preview dos modelos

### Planos de atendimento
- Cadastro de planos comerciais (quantidade, tipo de atendimento, duração, valor)
- Dois tipos de cobrança: **por quantidade de atendimentos** ou **por mensalidade**
- Plano mensal: gera atendimentos para todos os dias/horários selecionados durante 1 mês
- Extensão de plano mensal: cria atendimentos do dia seguinte ao último até +1 mês
- Configuração opcional de avaliação inicial (valor e duração)
- Atribuição de plano ao paciente com cópia independente dos dados
- Datas de início e de avaliação no formato brasileiro (`dd/mm/aaaa`)
- Geração em lote de atendimentos agendados com base em dias/horários/sala
- Agendamento extra de avaliação inicial quando o plano prever
- Extensão de plano mantendo o mesmo ciclo de tratamento
- Edição de regras do plano do paciente com opção de reagendamento
- Histórico do plano ativo com extensões, avaliações e atendimentos realizados
- Controle financeiro por evento: pagamento de cada extensão e de cada avaliação
- Cálculo automático de valor em aberto (extensões + avaliações pendentes)
- Valor do plano armazenado como valor total (não unitário)
- Profissional responsável no plano atribuído, com padrão no usuário logado
- Atendimentos gerados (regulares, mensais e avaliação) herdam o profissional do plano
- Troca de profissional reatribui os atendimentos futuros agendados
- Terapeuta só pode atribuir planos para si mesmo
- **Excluir plano** (cadastro errado): remove o ciclo de tratamento, avaliações e todos os atendimentos vinculados
- **Encerrar plano**: bloqueia renovação e novos atendimentos de pacote, mas mantém os atendimentos já agendados (créditos pagos) válidos
- Reativar plano encerrado volta a permitir novos atendimentos e renovação
- **Créditos de aulas** (planos por quantidade): saldo não consumido pode ser agendado mesmo com o plano encerrado
- Limite de crédito: não permite agendar atendimento regular além do saldo de aulas disponível
- Avaliações podem ser agendadas a qualquer momento (inclusive em plano encerrado), cobradas pelo valor de avaliação definido no plano

### Salas e capacidade
- Cadastro de salas com cor de identificação
- Controle de capacidade máxima de atendimentos simultâneos
- Validação de capacidade ao gerar atendimentos em lote

### Status de atendimento
- Agendado, Realizado, Cancelado, Faltou
- Atendimento marcável como avaliação quando o plano do ciclo permite
- Campo de evolução (texto livre) para descrição clínica
- Alteração rápida de status via dropdown na tela do ciclo
- `completed` e `missed` consomem aula do saldo; voltar para `scheduled`/`cancelled` restaura
- Profissional responsável exibido em cada atendimento na tela do ciclo
- Profissional responsável exibido nos eventos da agenda

### Dashboard do fisioterapeuta
- Painel com dados reais da clínica/tenant
- Cards de resumo: pacientes ativos, atendimentos do dia, atendimentos da semana, planos ativos
- Lista de próximos atendimentos do dia
- Lista de pacientes com aniversário no mês
- Gráfico/visualização de atendimentos por status
- Acesso rápido aos principais fluxos (pacientes, planos, salas, tipos de atendimento)
- Navegação por dia na agenda (anterior/hoje/próximo)

### Agenda visual
- Calendário com react-big-calendar e localização pt-BR
- Visualizações: dia, semana, mês e lista
- Filtro por sala e por profissional
- Recursos por sala na visão "Dia"
- Cores por sala e indicação de ocupação (ex: 2/4)
- Drag-and-drop para remarcar atendimentos
- Modo "Minha agenda" para owner e terapeuta
- Terapeuta com "Minha agenda" desligado vê a ocupação da sala em cinza claro (atendimentos de outros profissionais como "Ocupado")
- Visão "Dia" respeita a sala selecionada
- Persistência do estado da agenda (sessionStorage)
- Redirecionamento de volta à agenda após editar atendimento

### Clínicas e múltiplos funcionários
- Cadastro como profissional autônomo ou clínica (pessoa jurídica)
- Roles `owner` e `therapist`
- CRUD de funcionários/terapeutas pelo owner
- Isolamento de dados por tenant com global scope
- Permissões por role:
  - Owner vê todos os atendimentos, gerencia funcionários, salas, planos e tipos de atendimento
  - Therapist vê apenas seus próprios atendimentos e pacientes do tenant
- Filtro de profissionais na agenda respeita as permissões
- Seleção de profissional ao agendar atendimento (owner)
- Convite por e-mail deixado para implementação futura

### Perfis de acesso
- **admin**: usuário de plataforma (sem tenant). Ainda **sem portal/telas** implementadas.
- **owner**: dono da clínica/consultório. Vê todos os dados do tenant e gerencia funcionários.
- **therapist**: profissional. Vê apenas os próprios atendimentos (e a ocupação das salas na agenda).

### Em desenvolvimento / planejado
- **Portal Administrativo (SaaS Admin)** — permitir ao `admin` criar e gerenciar clínicas e profissionais
- **Controle financeiro** — evolução do `is_paid` atual para registro de pagamentos (data/forma) e contas a receber
- **Relatórios** — atendimentos, planos, saldos e exportação de prontuários
- **Upload de fotos e PDFs**
- **Notificações e lembretes**
- **Convite de funcionários por e-mail**

---

## Configurações Importantes

Todas as URLs são definidas por variáveis de ambiente. Não há hardcode de caminhos locais no código.

### CORS (`api/config/cors.php`)

As origens permitidas vêm da variável de ambiente `FRONTEND_URLS`:

```php
$frontendUrls = env('FRONTEND_URLS', 'http://localhost/fisio/app,http://localhost:5173');

'allowed_origins' => array_map('trim', explode(',', $frontendUrls)),
'supports_credentials' => true,
```

### Base URL do Frontend (`app/vite.config.js`)

```js
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/fisio/app/',
  // ...
})
```

### Roteamento (`app/src/App.jsx`)

```jsx
const BASE_URL = import.meta.env.VITE_BASE_URL || '/fisio/app/';

<BrowserRouter basename={BASE_URL}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/login" element={<Login />} />
  </Routes>
</BrowserRouter>
```

### Comunicação com a API (`app/src/services/api.js`)

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/fisio/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
```

---

## Solução de Problemas

### Tela em branco no frontend

1. Verifique se o frontend está rodando na porta correta (5173)
2. Verifique se o Apache está configurado corretamente
3. Abra o console do navegador (F12) e verifique erros em vermelho

### Erro "The page isn't redirecting properly"

Geralmente indica loop de redirecionamento. Verifique:
1. Se o Vite está na porta 5173
2. Se a configuração do proxy Apache está correta
3. Se não há `.htaccess` conflitante na pasta `app/`

### Loop infinito de recarregamento

O HMR do Vite pode ter problemas através do proxy. O projeto está configurado com HMR desabilitado no `vite.config.js` para evitar isso no acesso via `localhost/fisio/app/`.

Para desenvolvimento com HMR ativo, use a porta direta:
```
http://localhost:5173/fisio/app/
```

### API não responde

1. Verifique se `./start-api.sh` está rodando
2. Teste diretamente: `http://127.0.0.1:8000/api/health`
3. Verifique se o banco de dados `Fisio` existe e está acessível

### Porta 5173 ou 8000 ocupada

```bash
# Listar processos na porta
lsof -i :5173
lsof -i :8000

# Matar processos
pkill -f "vite"
pkill -f "artisan serve"
```

---

## Tecnologias Utilizadas

### Backend
- PHP 8.3+
- Laravel 11
- Laravel Sanctum (autenticação)
- MySQL/MariaDB
- Composer

### Frontend
- React 18
- Vite 5
- Tailwind CSS 3
- React Router DOM 6
- Axios
- Lucide React (ícones)

### Infraestrutura
- XAMPP (Apache + MySQL)
- Proxy reverso do Apache

---

## Notas de Segurança

- O `APP_DEBUG` está como `true` em desenvolvimento. Em produção, deve ser `false`.
- O CORS está configurado para origens locais. Em produção, ajuste para os domínios reais.
- O banco de dados está acessível sem senha (`DB_PASSWORD=`) apenas no ambiente local de desenvolvimento.

---

## Próximos Passos Sugeridos

- Módulo de agenda visual por sala/profissional
- Controle financeiro de contratos e recebimentos
- Relatórios de atendimentos, planos e saldos
- Módulo de clínicas com múltiplos funcionários e permissões
- Portal administrativo SaaS
- Upload de fotos, PDFs e documentos
- Notificações e lembretes de atendimentos

---

**Documentação criada em:** 05/09/2026
