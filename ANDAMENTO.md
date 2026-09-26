# FisioFlow - Andamento do Projeto

Este documento serve como **roteiro de desenvolvimento** e **checklist de acompanhamento** da plataforma FisioFlow. Aqui registramos o que já foi entregue, o que está em andamento e o backlog de funcionalidades, baseado no PRD (`prd-plataforma-fisioterapia.txt`).

---

## 1. Visão Geral do Produto

A **FisioFlow** é uma plataforma SaaS para fisioterapeutas e clínicas, com ênfase em fisioterapia pélvica/obstétrica e Pilates clínico.

### Diferenciais principais

- **Arquitetura Multitenant**: isolamento lógico de dados por tenant (LGPD).
- **Prontuário em 3 Níveis**:
  1. Cadastro Geral da Paciente (dados estáticos)
  2. Ciclo de Tratamento / Ficha de Avaliação (dados temporais)
  3. Evolução de Sessão (registros diários/semanais)
- **Form Builder Dinâmico**: criação de modelos de fichas personalizáveis.
- **Versionamento Imutável**: avaliações finalizadas viram registro permanente; modelos editados geram novas versões.
- **Dois Portais**: SaaS Admin (equipe fundadora) e Workspace Clínico (fisioterapeutas).

---

## 2. Arquitetura e Decisões Técnicas

### Stack definida

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + React Router DOM 6 |
| Backend | Laravel 11 + Laravel Sanctum |
| Banco de Dados | MySQL/MariaDB (XAMPP em dev) |
| Servidor Local | Apache do XAMPP + proxy reverso |
| Autenticação | Bearer token via Laravel Sanctum |

### Estrutura de pastas

```
/opt/lampp/htdocs/fisio/
├── api/        # Laravel API
├── app/        # React SPA
├── config/     # Configurações do Apache
├── start-api.sh
├── start-app.sh
├── README.md   # Setup técnico completo
└── ANDAMENTO.md # Este arquivo
```

### Decisões importantes

- URLs são configuradas por variáveis de ambiente (`.env` no frontend e backend) para facilitar migração para produção.
- Comunicação entre app e api é sempre por URL, nunca por caminhos locais.
- O backend roda via `php artisan serve` e o Apache do XAMPP faz proxy reverso para ele.
- O frontend roda via `npm run dev` e também é exposto pelo proxy do Apache.
- Autenticação por **Bearer token** (Sanctum), com token salvo no `localStorage` do frontend.

---

## 3. O que já foi entregue

### Ambiente e Infraestrutura

- [x] Criar estrutura de pastas `app/` e `api/` na raiz do projeto
- [x] Criar projeto Laravel 11 em `/api`
- [x] Criar projeto React + Vite em `/app`
- [x] Configurar conexão com banco de dados `Fisio` no MySQL do XAMPP
- [x] Executar migrations iniciais do Laravel (users, cache, jobs, personal_access_tokens)
- [x] Instalar e configurar Laravel Sanctum
- [x] Configurar CORS do Laravel para comunicação com o frontend
- [x] Configurar proxy reverso no Apache do XAMPP
- [x] Criar scripts `start-api.sh` e `start-app.sh`
- [x] Documentar setup completo no `README.md`
- [x] Padronizar URLs como variáveis de ambiente (`.env` frontend e backend)

### Backend (API)

- [x] Estrutura base do Laravel 11 instalada
- [x] Laravel Sanctum instalado e configurado (Bearer token)
- [x] Rota de health check: `GET /api/health`
- [x] Configuração de CORS com variáveis de ambiente (`FRONTEND_URLS`)
- [x] Banco de dados conectado e migrations executadas
- [x] Modelagem e migrations de `tenants` e `users`
- [x] Implementar TenantScope (Global Scope) para isolamento de dados
- [x] Controllers de autenticação (`register`, `login`, `logout`, `me`)
- [x] Rotas de autenticação protegidas por Sanctum
- [x] Seeders iniciais com usuários de teste
- [x] Migration e model `Patient` com isolamento por tenant
- [x] CRUD completo de pacientes (`PatientController` + `apiResource`)
- [x] Validação de CPF (Rule customizada)
- [x] Busca e paginação na listagem de pacientes

### Frontend (App)

- [x] React + Vite configurado
- [x] Tailwind CSS instalado com tokens de cor do guia de estilo
- [x] Estrutura de pastas organizada (components, pages, services, etc.)
- [x] Componentes base criados: Layout, Sidebar, Header, Card, StatCard, Badge
- [x] Tela de Dashboard criada
- [x] Tela de Login criada e funcional
- [x] Tela de Cadastro criada e funcional
- [x] AuthContext para gerenciamento de estado de autenticação
- [x] ProtectedRoute e GuestRoute para controle de acesso
- [x] Roteamento com React Router configurado
- [x] Serviço de API com axios configurado
- [x] Tela de listagem de pacientes com busca e paginação
- [x] Tela de cadastro/edição de paciente
- [x] Tela de perfil da paciente
- [x] Dashboard integrado com dados reais de pacientes

### Documentação

- [x] Criar `README.md` com setup completo no XAMPP
- [x] Criar `ANDAMENTO.md` (este arquivo)

---

## 4. MVP - Backlog de Funcionalidades

### Fase 1: Fundação (Autenticação, Tenant e Usuários) ✅ Concluída

- [x] Definir modelagem de banco: tenants, users, roles
- [x] Criar tabela `tenants`
- [x] Criar tabela `users` com vínculo a tenant
- [x] Implementar cadastro de tenant (modo autônomo)
- [x] Implementar login/logout com Sanctum
- [x] Implementar TenantScope (Global Scope) para isolamento por tenant
- [x] Criar tela de cadastro de conta no frontend
- [x] Criar tela de login funcional no frontend
- [x] Configurar proteção de rotas no frontend
- [ ] Implementar recuperação de senha (futuro)

### Fase 2: Cadastro de Pacientes (Nível 1) ✅ Concluída

- [x] Criar migration e model `patients`
- [x] Criar controller e rotas CRUD de pacientes
- [x] Implementar validação de CPF
- [x] Criar tela de listagem de pacientes
- [x] Criar tela de cadastro/edição de paciente
- [x] Criar tela de perfil da paciente
- [x] Implementar busca e filtros na listagem
- [x] Integrar dashboard com dados reais de pacientes
- [x] Máscaras de telefone, data, CPF e CEP no formulário
- [x] Endereço completo com campos separados e select de estados
- [x] Contato de emergência exibido no perfil
- [x] Toggle de ativar/desativar paciente no perfil
- [x] Ajustes de gênero neutro nos textos ("Novo Paciente", "Ativo/Inativo")

### Fase 3: Modelos de Ficha (Form Builder) ✅ Concluída

- [x] Criar migrations e models: `templates`, `template_versions`, `template_fields`, `treatment_cycles`, `evaluations`
- [x] Definir estrutura JSON para schema dos campos
- [x] Implementar tipos de campo: input, textarea, select, radio, checkbox, number, toggle
- [x] Criar interface de Form Builder com drag-and-drop (`@hello-pangea/dnd`)
- [x] Implementar salvamento de modelos
- [x] Implementar listagem de modelos
- [x] Implementar versionamento de modelos apenas quando há avaliações vinculadas
- [x] Criar controllers e rotas CRUD de templates, ciclos de tratamento e avaliações
- [x] Preview de modelos na listagem (modal) e no builder
- [x] Layout do builder com infos gerais em largura total e campos ao lado da sidebar
- [x] Toggle visual para ativar/desativar modelo e campo obrigatório

### Fase 4: Ciclo de Tratamento (Nível 2) ✅ Concluída

- [x] Criar migration e model `treatment_cycles`
- [x] Criar migration e model `evaluations` (ficha preenchida)
- [x] Implementar criação de novo ciclo para paciente
- [x] Implementar preenchimento de avaliação a partir de um modelo
- [x] Implementar "finalização" da avaliação com possibilidade de reabrir
- [x] Criar tela de novo ciclo
- [x] Criar tela de preenchimento de avaliação
- [x] Criar tela de detalhes/histórico de ciclos da paciente
- [x] Criar cadastro de tipos de atendimento por tenant
- [x] Vincular um ou mais tipos de atendimento ao ciclo
- [x] Exibir tipos de atendimento como badges coloridos no ciclo e no perfil do paciente

### Fase 4.1: Planos de Atendimento e Capacidade de Salas ✅ Concluída

- [x] Ajustar cadastro de salas com campo `capacity` (capacidade máxima de atendimentos simultâneos)
- [x] Criar migration e model `plans` (planos comerciais)
- [x] Criar migration e model `patient_plans` (planos atribuídos ao paciente)
- [x] Implementar CRUD de planos comerciais
- [x] Implementar atribuição de plano ao paciente com cópia independente dos dados
- [x] Implementar geração em lote de atendimentos a partir de planos atribuídos
- [x] Respeitar capacidade da sala ao gerar atendimentos em lote
- [x] Implementar extensão de plano do paciente (renovação com mesmas regras)
- [x] Implementar edição de regras do plano do paciente com opção de reagendamento
- [x] Datas de início e de avaliação no formato brasileiro (`dd/mm/aaaa`)
- [x] Criar aba "Planos ativos" no perfil do paciente (coluna esquerda)
- [x] Vincular atendimentos ao `patient_plan_id` para controle de saldo e histórico
- [x] Extensão de plano mantendo o mesmo ciclo de tratamento
- [x] Configuração de avaliação inicial no plano comercial (valor, duração, opcional)
- [x] Agendamento de avaliação ao atribuir plano (data, hora, sala)
- [x] Atendimento único marcável como avaliação quando o plano do ciclo permite
- [x] Criar tabela/model `patient_plan_extensions` para histórico de extensões
- [x] Controle financeiro por evento: pagamento de cada extensão e de cada avaliação
- [x] Histórico do plano ativo com extensões, avaliações e atendimentos realizados
- [x] Valor do plano armazenado como valor total (não unitário)
- [x] Cálculo automático de valor em aberto por plano
- [x] Tela do ciclo reorganizada com colunas invertidas e card do plano
- [x] Dropdown de status nos atendimentos da tela do ciclo
- [x] Contador de avaliações realizadas/total no card do plano
- [x] Campo `billing_type` em `plans` e `patient_plans` (appointments / monthly)
- [x] Geração de atendimentos para planos mensais (todos os dias selecionados durante 1 mês)
- [x] Extensão de plano mensal gerando próximo mês a partir do último atendimento
- [x] Plano mensal com avaliação inicial como atendimento extra
- [x] Interface de cadastro/listagem de planos com seleção de tipo de cobrança
- [x] Card do plano mostrando período quando mensal
- [x] Coluna `number_of_appointments` nullable em `plans` e `patient_plans` para suportar planos mensais
- [x] Correção do registro da extensão inicial para planos mensais (quantity real gerada)
- [x] Componente `DateInput` com `react-datepicker` e locale pt-BR para todos os campos de data
- [x] Menu lateral reduzido (escondido Agenda, Configurações, Prontuários)
- [x] Dashboard consumindo dados reais da API
- [x] Tarja de valores em aberto no perfil do paciente e na listagem de pacientes
- [x] Card de saldo de aulas disponíveis na tela do ciclo

### Fase 5: Atendimentos, Salas e Agenda (Nível 3) ✅ Concluída

- [x] Criar migration e model `rooms` (salas de atendimento)
- [x] Criar migration e model `appointments` (atendimentos agendáveis)
- [x] Implementar CRUD de salas com cor de identificação
- [x] Implementar CRUD de atendimentos vinculados a ciclos e salas
- [x] Criar status de atendimento: Agendado, Realizado, Cancelado, Faltou
- [x] Criar campo de evolução (texto livre) no atendimento
- [x] Criar tela de cadastro de salas
- [x] Criar tela de agendamento/preenchimento de atendimento
- [x] Listar atendimentos dentro do ciclo de tratamento (abas: Agendados, Concluídos, Cancelados/Faltas)
- [x] Preparar estrutura para cadastro em lote e agenda futura
- [x] Implementar agenda visual com react-big-calendar
- [x] Visualizações dia/semana/mês/lista
- [x] Filtros por sala e profissional
- [x] Cores por sala e lotação visível (ex: 2/4)
- [x] Drag-and-drop para remarcar atendimentos
- [x] Modo "Minha agenda" para owner e terapeuta
- [x] Terapeuta com "Minha agenda" desligado vê a ocupação da sala em cinza claro ("Ocupado")
- [x] Visão "Dia" respeita a sala selecionada
- [x] Persistência do estado da agenda (sessionStorage)
- [x] Redirecionamento de volta à agenda após editar atendimento
- [x] Dashboard com navegação por dia na agenda
- [x] Profissional exibido em cada atendimento (tela do ciclo e agenda)

### Fase 6: Clínicas e Múltiplos Funcionários ✅ Concluída

- [x] Adaptar cadastro para clínicas (pessoa jurídica) e modo autônomo
- [x] Criar roles: owner, therapist
- [x] CRUD de funcionários/terapeutas pelo owner
- [x] Gerenciamento de funcionários pelo owner (tela `/funcionarios`)
- [x] Adaptar permissões no backend (owner vê tudo; therapist vê apenas os próprios atendimentos)
- [x] Adaptar interface para mostrar/esconder menus/filtros por role
- [x] Agenda refletindo permissões (therapist vê seus + ocupados, owner vê tudo)
- [x] Campo `is_active` em usuários
- [x] Profissional responsável ao agendar atendimento
- [ ] ~~Implementar convite de funcionários por e-mail~~ (deixado para fase posterior)

### Fase 6.1: Regras de Planos, Profissional e Créditos ✅ Concluída

- [x] Campo `professional_id` em `patient_plans`
- [x] Profissional responsável no plano, com padrão no usuário logado
- [x] Atendimentos gerados (regular, mensal e avaliação) herdam o profissional do plano
- [x] Troca de profissional reatribui os atendimentos futuros agendados
- [x] Terapeuta só pode atribuir planos para si mesmo
- [x] **Excluir plano**: remove ciclo de tratamento, avaliações e todos os atendimentos
- [x] **Encerrar plano**: bloqueia renovação e novos pacotes, mantém atendimentos agendados (créditos pagos)
- [x] Reativar plano encerrado
- [x] Créditos de aulas (`schedulable_appointments`) para planos por quantidade
- [x] Limite de crédito: não permite agendar atendimento regular além do saldo
- [x] Avaliações permitidas mesmo com plano encerrado, cobradas pelo valor definido no plano

### Fase 7: Portal Administrativo (SaaS Admin) 🔜 Próxima

- [x] Role `admin` no model `User` (isAdmin)
- [x] Usuário admin de plataforma (sem vínculo a tenant)
- [ ] Estrutura de roles admin vs cliente no frontend
- [ ] Tela de gerenciamento de clínicas/tenants (criar, editar, listar)
- [ ] Criação de clínicas e profissionais pela plataforma (sem depender do cadastro público)
- [ ] Tela de métricas de uso por clínica
- [ ] Ativação/suspensão de tenants (`is_active`, `subscription_ends_at`)
- [ ] Context switcher (admin ↔ clínico)

### Fase 8: Módulos Complementares

- [x] Dashboard com métricas reais
- [x] Agenda de atendimentos
- [ ] Controle financeiro de contratos (básico: `is_paid` por extensão/avaliação; módulo completo pendente)
- [ ] Upload de fotos e PDFs
- [ ] Relatórios e impressão de prontuários
- [ ] Notificações e lembretes
- [ ] Convite de funcionários por e-mail

---

## 5. Próximos Passos Imediatos (Prioridade 1)

Baseado no PRD e no estado atual, a ordem recomendada é:

1. **Portal Administrativo (Fase 7)** — recomendado
   - Tela para o `admin` criar e gerenciar clínicas e profissionais
   - Ativação/suspensão de clínicas
   - Métricas de uso

2. **Controle financeiro (limitado)**
   - Registro de pagamentos com data/forma (a partir dos `is_paid` atuais)
   - Contas a receber consolidadas
   - Sem aprofundar em faturamento complexo neste momento

3. **Relatórios**
   - Métricas de atendimentos, planos e saldos
   - Exportação de prontuários

4. **Convite de funcionários por e-mail** (fase posterior)

---

## 6. Estado Atual do Portal Admin

O que **existe hoje**:

- Role `admin` no model `User` (método `isAdmin()`).
- Um usuário `admin` de plataforma (sem `tenant_id`), criado para testes.
- Endpoints de API já isolam dados por tenant.

O que **ainda não existe**:

- Nenhuma tela/portal para o `admin`.
- Nenhuma forma de o `admin` criar clínicas ou profissionais pela plataforma.
- Hoje a criação acontece assim:
  - **Clínica**: pelo cadastro público (`/register`), que cria o tenant + usuário owner.
  - **Profissionais**: pelo owner da clínica, na tela `/funcionarios`.
- Não há gestão de assinaturas, suspensão de clínicas ou métricas globais.

**Conclusão:** correto, a parte que você usaria para criar clínicas e profissionais como plataforma (SaaS Admin) ainda **não foi implementada** — é exatamente a Fase 7.

---

## 7. Decisões Pendentes de Alinhamento

- [ ] **Portal Admin**: o `admin` cria a clínica e já cria o owner, ou apenas aprova/gerencia?
- [ ] **Profissionais**: o `admin` cria profissionais direto, ou apenas o owner da clínica?
- [ ] **Assinaturas**: haverá planos SaaS, trial e cobrança por clínica?
- [ ] **Ciclo de tratamento em clínicas**: quando paciente muda de profissional, cria novo ciclo ou continua?
- [ ] **Onboarding**: fluxo de cadastro inicial e convite de usuários.
- [ ] **Hospedagem de produção**: VPS com subdomínios (app.fisioflow.com / api.fisioflow.com)?
- [ ] **Controle financeiro**: pagamentos parciais? um pagamento quita vários itens? estorno?

---

## 8. Notas Técnicas

- O isolamento por tenant é implementado via **Global Scope do Eloquent** (`TenantScope` + trait `BelongsToTenant`), garantindo que as queries filtrem pelo `tenant_id` do usuário autenticado.
- Avaliações finalizadas são armazenadas com uma **cópia snapshot do modelo** (schema + respostas) para garantir imutabilidade legal.
- O Form Builder usa JSON Schema para definir campos, facilitando futuras extensões.
- A autenticação usa **Sanctum com Bearer token** (token no `localStorage`).
- O frontend mantém todas as URLs em variáveis de ambiente para facilitar deploy em produção.

---

## 9. Links Rápidos

- Setup técnico: `README.md`
- Requisitos completos: `prd-plataforma-fisioterapia.txt` (anexo original)
- API local: `http://localhost/fisio/api/`
- App local: `http://localhost/fisio/app/`

---

**Última atualização:** 19/09/2026
**Status atual:** Fases 1, 2, 3, 4, 4.1, 5, 6 e 6.1 concluídas. Autenticação (Bearer token), multitenancy, pacientes, Form Builder, ciclos de tratamento, tipos de atendimento, planos (quantidade/mensal) com créditos, salas com capacidade, atendimentos, agenda visual (dia/semana/mês/lista), múltiplos funcionários (owner/therapist) e regras de encerramento/exclusão de planos implementados. Próxima frente: **Fase 7 — Portal Administrativo (SaaS Admin)**.
