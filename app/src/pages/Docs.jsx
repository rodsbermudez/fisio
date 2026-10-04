import { useEffect } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Tag,
  DoorOpen,
  Wallet,
  UserCog,
  Activity,
  HelpCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import Layout from '../components/layout/Layout';

const sections = [
  { id: 'intro', title: 'Introdução' },
  { id: 'menu', title: 'Itens do Menu' },
  { id: 'ciclos', title: 'Ciclos de Tratamento' },
  { id: 'planos', title: 'Planos dos Pacientes' },
  { id: 'agenda', title: 'Agenda e Atendimentos' },
  { id: 'ficha', title: 'Ficha de Avaliação' },
  { id: 'faq', title: 'Dicas e FAQ' },
];

function Section({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="card p-6 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand" />
        </div>
        <h2 className="text-xl font-semibold text-slate-dark">{title}</h2>
      </div>
      <div className="text-slate-body leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-slate-dark mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function Docs() {
  useEffect(() => {
    document.title = 'Documentação | FisioFlow';
  }, []);

  return (
    <Layout title="Documentação" subtitle="Guia de uso da área da clínica">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table of contents */}
        <aside className="lg:w-64 shrink-0">
          <nav className="lg:sticky lg:top-6 card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-brand" />
              <h3 className="font-semibold text-slate-dark">Navegação</h3>
            </div>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block text-sm text-slate-body hover:text-brand hover:bg-slate-surface px-3 py-2 rounded-lg transition-colors"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-8">
          <Section id="intro" title="Introdução" icon={Info}>
            <p>
              O <strong>FisioFlow</strong> é um sistema de gestão para clínicas de fisioterapia. Esta
              documentação explica a área utilizada pela clínica: cadastro de pacientes, controle de
              atendimentos, planos, agenda e ciclos de tratamento.
            </p>
            <p>
              O objetivo é centralizar o dia a dia da clínica em um só lugar, facilitando o
              acompanhamento de cada paciente desde a avaliação inicial até a alta.
            </p>
          </Section>

          <Section id="menu" title="Itens do Menu" icon={BookOpen}>
            <p>Abaixo você entende para que serve cada item do menu lateral.</p>

            <SubSection title="Dashboard">
              <p>
                <LayoutDashboard className="inline w-4 h-4 mr-1 text-brand" />
                Painel inicial com visão geral da clínica: pacientes ativos, sessões do dia, sessões
                da semana, planos ativos, agenda do dia selecionado, distribuição de atendimentos por
                status, próximos agendamentos e aniversariantes do mês.
              </p>
            </SubSection>

            <SubSection title="Agenda">
              <p>
                <CalendarDays className="inline w-4 h-4 mr-1 text-brand" />
                Calendário completo dos atendimentos. É possível visualizar por mês, semana, dia ou
                lista, filtrar por sala e profissional, ativar "Minha agenda" para ver apenas seus
                atendimentos e remarcar sessões arrastando no calendário.
              </p>
            </SubSection>

            <SubSection title="Pacientes">
              <p>
                <Users className="inline w-4 h-4 mr-1 text-brand" />
                Cadastro de todos os pacientes da clínica. Acesse o perfil para ver dados pessoais,
                planos contratados, histórico de atendimentos e ciclos de tratamento em andamento.
              </p>
            </SubSection>

            <SubSection title="Ficha de Avaliação">
              <p>
                <ClipboardList className="inline w-4 h-4 mr-1 text-brand" />
                Modelos de fichas de avaliação. Você pode criar templates com os campos que usará na
                primeira consulta do paciente, como anamnese, exame físico, objetivos e escalas.
              </p>
            </SubSection>

            <SubSection title="Tipos de Atendimento">
              <p>
                <Tag className="inline w-4 h-4 mr-1 text-brand" />
                Cadastro dos serviços oferecidos pela clínica, como fisioterapia, pilates,
                hidroterapia, etc. Cada tipo pode ter preço e duração padrão.
              </p>
            </SubSection>

            <SubSection title="Salas">
              <p>
                <DoorOpen className="inline w-4 h-4 mr-1 text-brand" />
                Locais onde os atendimentos acontecem. Cada sala tem nome, capacidade e cor para
                identificação visual na agenda.
              </p>
            </SubSection>

            <SubSection title="Planos">
              <p>
                <Wallet className="inline w-4 h-4 mr-1 text-brand" />
                Planos comercializados pela clínica. Aqui você define quantas sessões incluem, se
                possuem avaliação inicial, tipo de cobrança e valores.
              </p>
            </SubSection>

            <SubSection title="Funcionários / Meus Dados">
              <p>
                <UserCog className="inline w-4 h-4 mr-1 text-brand" />
                Para clínicas com equipe, gerencia os profissionais. Para profissionais autônomos,
                esse item vira "Meus dados" e permite editar as próprias informações.
              </p>
            </SubSection>
          </Section>

          <Section id="ciclos" title="Ciclos de Tratamento" icon={Activity}>
            <p>
              Um <strong>ciclo de tratamento</strong> é um conjunto de sessões de um paciente,
              vinculado a um plano contratado. Ele representa todo o tratamento desde a avaliação
              inicial até a conclusão.
            </p>

            <SubSection title="Como criar um ciclo">
              <ul className="list-disc list-inside space-y-1">
                <li>Acesse o perfil do paciente.</li>
                <li>Clique em <strong>Novo Ciclo</strong>.</li>
                <li>Escolha o plano do paciente.</li>
                <li>Preencha diagnóstico, objetivos, data de início e observações.</li>
                <li>Salve. O ciclo ficará disponível no perfil do paciente.</li>
              </ul>
            </SubSection>

            <SubSection title="Avaliação inicial">
              <p>
                Se o plano incluir avaliação, o primeiro atendimento do ciclo deve ser marcado como
                <strong>avaliação</strong>. Nesse momento o profissional preenche a ficha de
                avaliação baseada no modelo definido pela clínica.
              </p>
            </SubSection>

            <SubSection title="Sessões e status">
              <p>Cada sessão agendada aparece na agenda e dentro do ciclo. Os status são:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Agendado</strong>: sessão marcada, ainda não realizada.
                </li>
                <li>
                  <strong>Realizado</strong>: sessão concluída com sucesso.
                </li>
                <li>
                  <strong>Cancelado</strong>: sessão cancelada previamente.
                </li>
                <li>
                  <strong>Faltou</strong>: paciente não compareceu.
                </li>
              </ul>
            </SubSection>

            <SubSection title="Acompanhamento">
              <p>
                Dentro do ciclo você acompanha quantas sessões já foram realizadas, quantas faltam,
                as evoluções registradas e o histórico financeiro. Quando todas as sessões forem
                concluídas, o ciclo pode ser considerado finalizado.
              </p>
            </SubSection>
          </Section>

          <Section id="planos" title="Planos dos Pacientes" icon={Wallet}>
            <p>
              Os <strong>planos dos pacientes</strong> são as contratações reais. Enquanto o menu
              "Planos" define os planos disponíveis para venda, o plano do paciente é o vínculo de
              um plano específico a uma pessoa.
            </p>

            <SubSection title="Tipos de cobrança">
              <p>O plano pode ser cobrado de diferentes formas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Por quantidade de sessões</strong>: paciente compra um pacote fixo (ex: 10
                  sessões).
                </li>
                <li>
                  <strong>Periodicidade</strong>: cobrança recorrente (semana ou mês) com sessões
                  incluídas.
                </li>
              </ul>
            </SubSection>

            <SubSection title="Extensões">
              <p>
                Se o paciente precisar de mais sessões além do previsto, é possível fazer uma
                <strong>extensão</strong> do plano, adicionando novas sessões sem criar um novo
                contrato.
              </p>
            </SubSection>

            <SubSection title="Histórico">
              <p>
                No perfil do paciente é possível visualizar todos os planos já contratados, datas,
                valores, sessões realizadas e extensões.
              </p>
            </SubSection>
          </Section>

          <Section id="agenda" title="Agenda e Atendimentos" icon={CalendarDays}>
            <p>
              A agenda é onde a clínica organiza o dia a dia. Todos os atendimentos agendados
              aparecem visualmente, permitindo controle de salas e profissionais.
            </p>

            <SubSection title="Criando um atendimento">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Dentro de um ciclo, clique em <strong>Novo Atendimento</strong>.
                </li>
                <li>Escolha a sala, o profissional, a data e o horário.</li>
                <li>Marque se é avaliação ou sessão normal.</li>
                <li>Salve. O atendimento aparecerá na agenda.</li>
              </ul>
            </SubSection>

            <SubSection title="Avaliação vs. Atendimento">
              <p>
                <strong>Avaliação</strong> é a primeira consulta, quando se preenche a ficha e define
                o tratamento. <strong>Atendimento</strong> são as sessões subsequentes de
                fisioterapia.
              </p>
            </SubSection>

            <SubSection title="Filtros e visualizações">
              <p>
                Use o filtro de <strong>sala</strong> para ver a ocupação de um local específico e o
                filtro de <strong>profissional</strong> para ver a agenda de uma pessoa. O botão
                "Minha agenda" mostra apenas os atendimentos do profissional logado.
              </p>
            </SubSection>
          </Section>

          <Section id="ficha" title="Ficha de Avaliação" icon={ClipboardList}>
            <p>
              A ficha de avaliação é preenchida na primeira sessão do paciente e serve de base para
              todo o tratamento.
            </p>

            <SubSection title="Modelos personalizáveis">
              <p>
                Em <strong>Ficha de Avaliação</strong> você cria modelos com os campos que a clínica
                utiliza. Campos podem ser de texto, número, data, seleção, textarea, etc.
              </p>
            </SubSection>

            <SubSection title="Como usar no atendimento">
              <p>
                Ao criar uma avaliação dentro de um ciclo, o sistema exibe o modelo selecionado. O
                profissional preenche os dados e eles ficam salvos no histórico do paciente.
              </p>
            </SubSection>
          </Section>

          <Section id="faq" title="Dicas e FAQ" icon={HelpCircle}>
            <SubSection title="Qual a diferença entre Plano e Plano do Paciente?">
              <p>
                <strong>Planos</strong> são os produtos que a clínica vende (ex: "10 sessões de
                fisioterapia"). <strong>Planos dos Pacientes</strong> são as contratações reais, ou
                seja, quando um paciente adquire um plano.
              </p>
            </SubSection>

            <SubSection title="O que fazer quando as sessões do plano acabam?">
              <p>
                Você pode criar uma <strong>extensão</strong> no plano do paciente ou criar um novo
                plano/contrato, iniciando um novo ciclo de tratamento.
              </p>
            </SubSection>

            <SubSection title='Como funciona o "Minha agenda"?'>
              <p>
                Quando ativado, a agenda mostra apenas os atendimentos do profissional logado. Isso
                ajuda o profissional a focar no próprio dia. Para autônomos, essa visualização é a
                padrão.
              </p>
            </SubSection>

            <SubSection title='Por que alguns horários aparecem como "Ocupado"?'>
              <p>
                Quando um profissional visualiza a agenda sem o modo "Minha agenda", atendimentos de
                outros profissionais aparecem como <strong>Ocupado</strong> para preservar a
                privacidade do paciente.
              </p>
            </SubSection>

            <div className="mt-6 p-4 bg-brand-light rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <p className="text-sm text-slate-body">
                <strong>Dica:</strong> mantenha os cadastros de salas, tipos de atendimento e planos
                sempre atualizados. Assim a criação de ciclos e agendamentos fica muito mais rápida.
              </p>
            </div>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
