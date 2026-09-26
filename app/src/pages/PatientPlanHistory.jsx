import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, CheckCircle2, AlertCircle, CreditCard, History, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getPatientPlanHistory, toggleExtensionPayment, toggleEvaluationPayment } from '../services/patientPlans';
import { dateToBr } from '../utils/masks';

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

export default function PatientPlanHistory() {
  const { patientId, patientPlanId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getPatientPlanHistory(patientPlanId);
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico do plano:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientPlanId]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleToggleExtension = async (extensionId) => {
    try {
      await toggleExtensionPayment(extensionId);
      fetchHistory();
    } catch (error) {
      console.error('Erro ao alterar pagamento da extensão:', error);
      alert('Erro ao alterar pagamento.');
    }
  };

  const handleToggleEvaluation = async (appointmentId) => {
    try {
      await toggleEvaluationPayment(appointmentId);
      fetchHistory();
    } catch (error) {
      console.error('Erro ao alterar pagamento da avaliação:', error);
      alert('Erro ao alterar pagamento.');
    }
  };

  const getAppointmentTypeLabel = (appointment) => {
    if (appointment.is_evaluation) return 'Avaliação';
    return 'Atendimento regular';
  };

  if (loading) {
    return (
      <Layout title="Histórico do Plano">
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Histórico do Plano">
        <div className="p-12 text-center">
          <p className="text-slate-muted">Não foi possível carregar o histórico do plano.</p>
        </div>
      </Layout>
    );
  }

  const plan = data.patient_plan;
  const completedCount = data.completed_appointments.length;
  const totalAppointments = plan.number_of_appointments;
  const givenCount = completedCount;
  const hasPending = data.total_pending > 0;
  const unitPrice = plan.number_of_appointments > 0 ? plan.price / plan.number_of_appointments : 0;

  return (
    <Layout
      title={`Histórico do plano: ${plan.name}`}
      subtitle={`Paciente: ${plan.patient?.name || '—'}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/pacientes/${patientId}`}
          className="flex items-center gap-2 text-sm text-slate-muted hover:text-brand"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para paciente
        </Link>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 px-6 pb-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-light rounded-lg">
                <Calendar className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-slate-muted uppercase tracking-wide">Aulas dadas / total</p>
                <p className="text-xl font-bold text-slate-dark">
                  {givenCount} / {totalAppointments}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${hasPending ? 'bg-danger-light' : 'bg-success-light'}`}>
                <Wallet className={`w-5 h-5 ${hasPending ? 'text-danger-text' : 'text-success-text'}`} />
              </div>
              <div>
                <p className="text-xs text-slate-muted uppercase tracking-wide">Valor em aberto</p>
                <p className={`text-xl font-bold ${hasPending ? 'text-danger-text' : 'text-success-text'}`}>
                  {formatCurrency(data.total_pending)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-light rounded-lg">
                <CreditCard className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-slate-muted uppercase tracking-wide">Valor do plano</p>
                <p className="text-xl font-bold text-slate-dark">{formatCurrency(plan.price)}</p>
                <p className="text-xs text-slate-muted">{formatCurrency(unitPrice)} / aula</p>
              </div>
            </div>
          </Card>
        </div>

        {hasPending && (
          <div className="flex items-center gap-3 p-4 bg-danger-light border border-danger/20 rounded-lg text-danger-text">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Existe um valor em aberto de <strong>{formatCurrency(data.total_pending)}</strong>. Revise as extensões e avaliações pendentes abaixo.
            </p>
          </div>
        )}

        {/* Histórico de extensões */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-dark flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-brand" />
            Histórico de extensões
          </h2>

          {plan.extensions.length === 0 ? (
            <p className="text-slate-muted text-sm">Nenhuma extensão registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-border bg-slate-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Tipo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Quantidade</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Valor da extensão</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Valor / aula</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border">
                  {plan.extensions.map((extension) => (
                    <tr key={extension.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-body">
                        {extension.type === 'initial' ? 'Plano inicial' : 'Extensão'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-body">{extension.quantity} aulas</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-dark">{formatCurrency(extension.price)}</td>
                      <td className="py-3 px-4 text-sm text-slate-body">
                        {formatCurrency(extension.quantity > 0 ? extension.price / extension.quantity : 0)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={extension.is_paid ? 'success' : 'warning'}>
                          {extension.is_paid ? 'Pago' : 'Em aberto'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleExtension(extension.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            extension.is_paid
                              ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              : 'bg-brand text-white border-brand hover:bg-brand-dark'
                          }`}
                        >
                          {extension.is_paid ? 'Marcar em aberto' : 'Marcar pago'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Avaliações */}
        {plan.has_evaluation && (
          <Card>
            <h2 className="text-lg font-semibold text-slate-dark flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-brand" />
              Avaliações
            </h2>

            {data.evaluations.length === 0 ? (
              <p className="text-slate-muted text-sm">Nenhuma avaliação agendada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-border bg-slate-50/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Horário</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Sala</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Valor</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-border">
                    {data.evaluations.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-body">
                          {appointment.appointment_date ? dateToBr(appointment.appointment_date) : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-body">{appointment.start_time || '—'}</td>
                        <td className="py-3 px-4 text-sm text-slate-body">{appointment.room?.name || '—'}</td>
                        <td className="py-3 px-4 text-sm text-slate-body">{formatCurrency(appointment.price)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusColors[appointment.status]}>
                              {statusLabels[appointment.status]}
                            </Badge>
                            <Badge variant={appointment.is_paid ? 'success' : 'warning'}>
                              {appointment.is_paid ? 'Pago' : 'Em aberto'}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleEvaluation(appointment.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              appointment.is_paid
                                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                : 'bg-brand text-white border-brand hover:bg-brand-dark'
                            }`}
                          >
                            {appointment.is_paid ? 'Marcar em aberto' : 'Marcar pago'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Atendimentos realizados */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-dark flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand" />
            Atendimentos realizados
          </h2>

          {data.completed_appointments.length === 0 ? (
            <p className="text-slate-muted text-sm">Nenhum atendimento realizado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-border bg-slate-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Data</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Horário</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Sala</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Tipo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border">
                  {data.completed_appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-body">
                        {appointment.appointment_date ? dateToBr(appointment.appointment_date) : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-body">{appointment.start_time || '—'}</td>
                      <td className="py-3 px-4 text-sm text-slate-body">{appointment.room?.name || '—'}</td>
                      <td className="py-3 px-4 text-sm text-slate-body">{getAppointmentTypeLabel(appointment)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[appointment.status]}>
                          {statusLabels[appointment.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
