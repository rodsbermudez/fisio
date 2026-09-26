import { useState, useEffect } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Clock,
  Stethoscope,
  CheckCircle2,
  UserX,
  TrendingUp,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getDashboard } from '../services/dashboard';
import { dateToBr } from '../utils/masks';
import OnboardingChecklist from '../components/dashboard/OnboardingChecklist';

const statusLabels = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  missed: 'Faltou',
};

const statusColors = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'default',
  missed: 'danger',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getDashboard({ date: format(selectedDate, 'yyyy-MM-dd') });
        setData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedDate]);

  const formatTime = (time) => (time ? time.substring(0, 5) : '—');

  const handlePreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Visão geral da clínica">
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Dashboard" subtitle="Visão geral da clínica">
        <div className="p-12 text-center text-slate-muted">
          Não foi possível carregar o dashboard.
        </div>
      </Layout>
    );
  }

  const isToday = isSameDay(selectedDate, new Date());
  const agendaDateLabel = isToday
    ? 'Agenda de Hoje'
    : `Agenda de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`;
  const agendaSubtitle = data.today_appointments_count === 0
    ? `Nenhum atendimento previsto para ${isToday ? 'hoje' : format(selectedDate, "dd/MM/yyyy")}`
    : `${data.today_appointments_count} atendimento(s) previsto(s)`;

  const statusOrder = ['scheduled', 'completed', 'cancelled', 'missed'];
  const statusEntries = statusOrder
    .filter((status) => data.appointments_by_status[status])
    .map((status) => ({ status, total: data.appointments_by_status[status] }));

  return (
    <Layout
      title="Dashboard"
      subtitle="Visão geral da clínica de fisioterapia"
    >
      {/* Checklist de onboarding */}
      <OnboardingChecklist onboarding={data.onboarding} />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pacientes Ativas"
          value={data.active_patients_count}
          trend="Cadastradas no sistema"
          trendUp={true}
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Sessões Hoje"
          value={data.today_appointments_count}
          trend="Atendimentos agendados"
          trendUp={true}
          icon={CalendarCheck}
          color="success"
        />
        <StatCard
          title="Sessões na Semana"
          value={data.week_appointments_count}
          trend="Total de atendimentos"
          trendUp={true}
          icon={CalendarDays}
          color="info"
        />
        <StatCard
          title="Planos Ativos"
          value={data.active_plans_count}
          trend="Contratos em vigor"
          trendUp={true}
          icon={Wallet}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Atendimentos do dia */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-dark">{agendaDateLabel}</h3>
              <p className="text-sm text-slate-muted">{agendaSubtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviousDay}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-border bg-white text-slate-body hover:bg-slate-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleToday}
                disabled={isToday}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-border bg-white text-slate-body hover:bg-slate-50 disabled:opacity-50"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-border bg-white text-slate-body hover:bg-slate-50"
              >
                Próximo
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {data.today_appointments.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-border rounded-lg">
                <CalendarCheck className="w-10 h-10 text-slate-muted mx-auto mb-3" />
                <p className="text-slate-muted text-sm">
                  Nenhum atendimento agendado para {isToday ? 'hoje' : format(selectedDate, "dd/MM/yyyy")}.
                </p>
              </div>
            ) : (
              data.today_appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-slate-border rounded-lg hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-light flex items-center justify-center">
                      <Clock className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-dark">{appointment.patient?.name || '—'}</p>
                      <p className="text-sm text-slate-muted">
                        {appointment.room?.name || '—'} · {appointment.service_type?.name || '—'} · {appointment.is_evaluation ? 'Avaliação' : `${appointment.duration_minutes} min`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-dark">{formatTime(appointment.start_time)}</p>
                    <Badge variant={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Status dos atendimentos */}
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-dark">Atendimentos por Status</h3>
            <p className="text-sm text-slate-muted">Distribuição geral</p>
          </div>

          {statusEntries.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-border rounded-lg">
              <TrendingUp className="w-10 h-10 text-slate-muted mx-auto mb-3" />
              <p className="text-slate-muted text-sm">Nenhum atendimento registrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusEntries.map(({ status, total }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[status]}>{statusLabels[status]}</Badge>
                  </div>
                  <span className="font-semibold text-slate-dark">{total}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-border space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-muted flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Avaliações pendentes
              </span>
              <span className="font-medium text-slate-dark">{data.pending_evaluations_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-muted flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Realizados no mês
              </span>
              <span className="font-medium text-slate-dark">{data.completed_appointments_this_month}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos atendimentos */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-dark">Próximos Atendimentos</h3>
              <p className="text-sm text-slate-muted">Próximos agendamentos</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.next_appointments.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-border rounded-lg">
                <Clock className="w-10 h-10 text-slate-muted mx-auto mb-3" />
                <p className="text-slate-muted text-sm">Nenhum agendamento futuro.</p>
              </div>
            ) : (
              data.next_appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border border-slate-border rounded-lg hover:border-brand/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-dark text-sm">{appointment.patient?.name || '—'}</p>
                    <p className="text-xs text-slate-muted">
                      {dateToBr(appointment.appointment_date)} · {formatTime(appointment.start_time)} · {appointment.room?.name || '—'}
                    </p>
                  </div>
                  <Badge variant={appointment.is_evaluation ? 'warning' : 'info'}>
                    {appointment.is_evaluation ? 'Avaliação' : 'Atendimento'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Aniversariantes do mês */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-dark">Aniversariantes do Mês</h3>
              <p className="text-sm text-slate-muted">Pacientes que fazem aniversário este mês</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.birthdays_this_month.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-border rounded-lg">
                <UserX className="w-10 h-10 text-slate-muted mx-auto mb-3" />
                <p className="text-slate-muted text-sm">Nenhum aniversariante este mês.</p>
              </div>
            ) : (
              data.birthdays_this_month.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 border border-slate-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-dark text-sm">{patient.name}</p>
                    <p className="text-xs text-slate-muted">
                      {dateToBr(patient.birth_date)}
                    </p>
                  </div>
                  <Badge variant="success">Aniversário</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
