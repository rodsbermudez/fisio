import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, CheckCircle, Edit3, Trash2, RotateCcw, Calendar, Clock, MapPin, Wallet, History, CheckCircle2, MoreHorizontal, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import EvolutionNotesModal from '../components/appointments/EvolutionNotesModal';
import { getTreatmentCycle, updateTreatmentCycle, deleteTreatmentCycle } from '../services/treatmentCycles';
import { listEvaluations, deleteEvaluation, finalizeEvaluation, unfinalizeEvaluation } from '../services/evaluations';
import { listAppointments, deleteAppointment, updateAppointment } from '../services/appointments';
import { extendPatientPlan, getPatientPlan } from '../services/patientPlans';
import { dateToBr } from '../utils/masks';

export default function TreatmentCycleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientPlan, setPatientPlan] = useState(null);
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('scheduled');
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState(null);
  const [extending, setExtending] = useState(false);
  const [evolutionModal, setEvolutionModal] = useState({
    open: false,
    appointment: null,
    notes: '',
    mode: 'complete',
  });

  const fetchData = async () => {
    try {
      const [cycleResponse, evaluationsResponse, appointmentsResponse] = await Promise.all([
        getTreatmentCycle(id),
        listEvaluations({ treatment_cycle_id: id }),
        listAppointments({ treatment_cycle_id: id }),
      ]);
      const loadedCycle = cycleResponse.data.treatment_cycle;
      setCycle(loadedCycle);
      setEvaluations(evaluationsResponse.data.data);
      setAppointments(appointmentsResponse.data.data);

      if (loadedCycle.patient_plan_id) {
        try {
          const planResponse = await getPatientPlan(loadedCycle.patient_plan_id);
          setPatientPlan(planResponse.data.patient_plan);
        } catch (error) {
          console.error('Erro ao carregar plano do ciclo:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ciclo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteCycle = async () => {
    if (!confirm('Tem certeza que deseja excluir este ciclo?')) return;
    try {
      await deleteTreatmentCycle(id);
      navigate(`/pacientes/${cycle.patient_id}`);
    } catch (error) {
      console.error('Erro ao excluir ciclo:', error);
      alert('Erro ao excluir ciclo.');
    }
  };

  const handleToggleStatus = async () => {
    if (!cycle) return;
    setTogglingStatus(true);
    try {
      const newStatus = cycle.status === 'in_progress' ? 'finished' : 'in_progress';
      const response = await updateTreatmentCycle(cycle.id, { status: newStatus });
      setCycle(response.data.treatment_cycle);
    } catch (error) {
      console.error('Erro ao alterar status do ciclo:', error);
      alert('Erro ao alterar status do ciclo.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    try {
      await deleteEvaluation(evaluationId);
      setEvaluations(evaluations.filter((e) => e.id !== evaluationId));
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      alert('Erro ao excluir avaliação.');
    }
  };

  const handleToggleFinalized = async (evaluation) => {
    try {
      if (evaluation.finalized_at) {
        await unfinalizeEvaluation(evaluation.id);
      } else {
        await finalizeEvaluation(evaluation.id);
      }
      const response = await listEvaluations({ treatment_cycle_id: id });
      setEvaluations(response.data.data);
    } catch (error) {
      console.error('Erro ao alterar status da avaliação:', error);
      alert('Erro ao alterar status da avaliação.');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Tem certeza que deseja excluir este atendimento?')) return;
    try {
      await deleteAppointment(appointmentId);
      const response = await listAppointments({ treatment_cycle_id: id });
      setAppointments(response.data.data);
      if (patientPlan) {
        const planResponse = await getPatientPlan(patientPlan.id);
        setPatientPlan(planResponse.data.patient_plan);
      }
    } catch (error) {
      console.error('Erro ao excluir atendimento:', error);
      alert('Erro ao excluir atendimento.');
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    if (newStatus === 'completed') {
      setEvolutionModal({
        open: true,
        appointment,
        notes: appointment.evolution_notes || '',
        mode: 'complete',
      });
      return;
    }

    setUpdatingAppointment(appointment.id);
    try {
      await updateAppointment(appointment.id, { status: newStatus });
      const response = await listAppointments({ treatment_cycle_id: id });
      setAppointments(response.data.data);
      if (patientPlan) {
        const planResponse = await getPatientPlan(patientPlan.id);
        setPatientPlan(planResponse.data.patient_plan);
      }
    } catch (error) {
      console.error('Erro ao atualizar status do atendimento:', error);
      alert(error?.response?.data?.message || 'Erro ao atualizar status.');
    } finally {
      setUpdatingAppointment(null);
    }
  };

  const handleCloseEvolutionModal = () => {
    setEvolutionModal({ open: false, appointment: null, notes: '', mode: 'complete' });
  };

  const handleSaveEvolution = async (notes) => {
    if (!evolutionModal.appointment) return;
    setUpdatingAppointment(evolutionModal.appointment.id);
    try {
      const payload =
        evolutionModal.mode === 'complete'
          ? { status: 'completed', evolution_notes: notes }
          : { evolution_notes: notes };
      await updateAppointment(evolutionModal.appointment.id, payload);
      const response = await listAppointments({ treatment_cycle_id: id });
      setAppointments(response.data.data);
      if (patientPlan) {
        const planResponse = await getPatientPlan(patientPlan.id);
        setPatientPlan(planResponse.data.patient_plan);
      }
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
      alert(error?.response?.data?.message || 'Erro ao salvar evolução.');
    } finally {
      setUpdatingAppointment(null);
      handleCloseEvolutionModal();
    }
  };

  const handleEditEvolution = (appointment) => {
    setEvolutionModal({
      open: true,
      appointment,
      notes: appointment.evolution_notes || '',
      mode: 'edit',
    });
  };

  const handleExtendPlan = async () => {
    if (!patientPlan) return;
    if (!confirm(`Deseja renovar o plano "${patientPlan.name}" com mais ${patientPlan.number_of_appointments} atendimentos?`)) return;
    setExtending(true);
    try {
      await extendPatientPlan(patientPlan.id);
      await fetchData();
    } catch (error) {
      console.error('Erro ao estender plano:', error);
      alert(error?.response?.data?.message || 'Erro ao estender plano.');
    } finally {
      setExtending(false);
    }
  };

  const getAppointmentStatusLabel = (status) => {
    const labels = {
      scheduled: 'Agendado',
      completed: 'Realizado',
      cancelled: 'Cancelado',
      missed: 'Faltou',
    };
    return labels[status] || status;
  };

  const getAppointmentStatusVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'warning';
      case 'cancelled':
      case 'missed':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const givenAppointmentsCount = appointments.filter((a) => ['completed', 'missed'].includes(a.status) && !a.is_evaluation).length;
  const totalEvaluations = appointments.filter((a) => a.is_evaluation).length;
  const completedEvaluations = appointments.filter((a) => a.is_evaluation && a.status === 'completed').length;
  const lastScheduledAppointmentDate = patientPlan
    ? appointments
        .filter((a) => !a.is_evaluation && a.status === 'scheduled')
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
        .pop()?.appointment_date
    : null;

  if (loading) {
    return (
      <Layout title="Carregando...">
        <div className="text-center py-12 text-slate-muted">Carregando ciclo...</div>
      </Layout>
    );
  }

  if (!cycle) {
    return (
      <Layout title="Ciclo não encontrado">
        <div className="text-center py-12 text-slate-muted">Ciclo não encontrado.</div>
      </Layout>
    );
  }

  const scheduledAppointments = appointments
    .filter((a) => a.status === 'scheduled')
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return a.appointment_date.localeCompare(b.appointment_date);
      }
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  const completedAppointments = appointments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return b.appointment_date.localeCompare(a.appointment_date);
      }
      return (b.start_time || '').localeCompare(a.start_time || '');
    });
  const cancelledOrMissedAppointments = appointments
    .filter((a) => ['cancelled', 'missed'].includes(a.status))
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return b.appointment_date.localeCompare(a.appointment_date);
      }
      return (b.start_time || '').localeCompare(a.start_time || '');
    });

  const displayedAppointments =
    activeAppointmentTab === 'scheduled'
      ? scheduledAppointments
      : activeAppointmentTab === 'completed'
        ? completedAppointments
        : cancelledOrMissedAppointments;

  return (
    <Layout
      title={`Ciclo de atendimento: ${cycle.title}`}
      subtitle={`Paciente: ${cycle.patient.name}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/pacientes/${cycle.patient_id}`}
          className="flex items-center gap-2 text-sm text-slate-muted hover:text-brand"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para paciente
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda - informações do ciclo e plano */}
        <div className="space-y-6">
          {/* Card do ciclo */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-slate-dark">{cycle.title}</h2>
                  <Badge variant={cycle.status === 'in_progress' ? 'success' : 'default'}>
                    {cycle.status === 'in_progress' ? 'Em andamento' : 'Finalizado'}
                  </Badge>
                </div>
                {cycle.service_types && cycle.service_types.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cycle.service_types.map((type) => (
                      <span
                        key={type.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${type.color}15`,
                          borderColor: `${type.color}40`,
                          color: type.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </span>
                    ))}
                  </div>
                )}
                {cycle.start_date && (
                  <p className="text-sm text-slate-muted">Início: {dateToBr(cycle.start_date)}</p>
                )}
              </div>
            </div>
            {cycle.notes && (
              <p className="text-sm text-slate-body whitespace-pre-line border-t border-slate-border pt-3">{cycle.notes}</p>
            )}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-border">
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  cycle.status === 'in_progress'
                    ? 'border border-slate-border text-slate-body hover:bg-slate-50'
                    : 'border border-brand text-brand hover:bg-brand-light'
                }`}
              >
                {cycle.status === 'in_progress' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Encerrar ciclo
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Reabrir ciclo
                  </>
                )}
              </button>
              <button
                onClick={handleDeleteCycle}
                className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                title="Excluir ciclo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card do plano */}
          {patientPlan && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-dark flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-brand" />
                  Plano contratado
                </h3>
                <Link
                  to={`/pacientes/${cycle.patient_id}/planos/${patientPlan.id}`}
                  className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                  title="Ver histórico do plano"
                >
                  <History className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Nome</span>
                  <span className="font-medium text-slate-dark">{patientPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-muted">Status</span>
                  <Badge variant={patientPlan.status === 'active' ? 'success' : patientPlan.status === 'finished' ? 'default' : 'danger'}>
                    {patientPlan.status === 'active' ? 'Ativo' : patientPlan.status === 'finished' ? 'Finalizado' : 'Cancelado'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Cobrança</span>
                  <span className="font-medium text-slate-dark">
                    {patientPlan.billing_type === 'monthly' ? 'Mensalidade' : 'Por atendimento'}
                  </span>
                </div>
                {patientPlan.billing_type === 'monthly' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-muted">Período</span>
                    <span className="font-medium text-slate-dark">
                      {dateToBr(patientPlan.start_date)} até {dateToBr(lastScheduledAppointmentDate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Aulas dadas / total</span>
                  <span className="font-medium text-slate-dark">
                    {givenAppointmentsCount} / {patientPlan.number_of_appointments}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Saldo de aulas</span>
                  <span className="font-medium text-slate-dark">{patientPlan.remaining_appointments}</span>
                </div>
                {patientPlan.billing_type === 'appointments' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-muted">Créditos a agendar</span>
                    <span className={`font-medium ${(patientPlan.schedulable_appointments || 0) > 0 ? 'text-brand' : 'text-slate-dark'}`}>
                      {patientPlan.schedulable_appointments || 0}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Avaliações</span>
                  <span className="font-medium text-slate-dark">
                    {completedEvaluations} / {totalEvaluations}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Valor do plano</span>
                  <span className="font-medium text-slate-dark">{formatCurrency(patientPlan.price)}</span>
                </div>
                {patientPlan.has_evaluation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-muted">Valor da avaliação</span>
                    <span className="font-medium text-slate-dark">{formatCurrency(patientPlan.evaluation_price)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-border">
                {patientPlan.status === 'active' && (
                  <button
                    onClick={handleExtendPlan}
                    disabled={extending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Estender
                  </button>
                )}
                <Link
                  to={`/pacientes/${cycle.patient_id}/planos/${patientPlan.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-border text-slate-body rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  {patientPlan.status === 'active' ? 'Editar' : 'Ver histórico'}
                </Link>
              </div>
            </div>
          )}

          {/* Avaliações documentais */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-dark">Avaliações</h3>
              <Link
                to={`/ciclos/${id}/avaliacoes/novo`}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Nova avaliação
              </Link>
            </div>

            {evaluations.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-slate-muted mx-auto mb-2" />
                <p className="text-slate-muted text-sm">Nenhuma avaliação neste ciclo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-3 border border-slate-border rounded-lg hover:border-brand/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-dark text-sm">
                        {evaluation.template_version?.snapshot?.title || 'Avaliação'}
                      </p>
                      <p className="text-xs text-slate-muted mt-0.5">
                        {dateToBr(evaluation.created_at)}
                        {evaluation.finalized_at && ` · Finalizada`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFinalized(evaluation)}
                        className={`p-2 rounded-lg transition-colors ${
                          evaluation.finalized_at
                            ? 'text-success hover:bg-success/10'
                            : 'text-slate-muted hover:text-brand hover:bg-brand-light'
                        }`}
                        title={evaluation.finalized_at ? 'Reabrir para edição' : 'Finalizar avaliação'}
                      >
                        {evaluation.finalized_at ? <RotateCcw className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <Link
                        to={`/avaliacoes/${evaluation.id}`}
                        className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                        title="Editar/visualizar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                        className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Excluir avaliação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita - atendimentos */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-slate-dark">Atendimentos</h3>
              <Link
                to={`/ciclos/${id}/atendimentos/novo`}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Novo atendimento
              </Link>
            </div>

            <div className="flex border-b border-slate-border mb-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveAppointmentTab('scheduled')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeAppointmentTab === 'scheduled'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-muted hover:text-slate-body'
                }`}
              >
                Agendados ({scheduledAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveAppointmentTab('completed')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeAppointmentTab === 'completed'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-muted hover:text-slate-body'
                }`}
              >
                Concluídos ({completedAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveAppointmentTab('cancelled')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeAppointmentTab === 'cancelled'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-muted hover:text-slate-body'
                }`}
              >
                Cancelados / Faltas ({cancelledOrMissedAppointments.length})
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-muted mx-auto mb-3" />
                <p className="text-slate-muted text-sm">Nenhum atendimento neste ciclo.</p>
                <Link
                  to={`/ciclos/${id}/atendimentos/novo`}
                  className="text-brand text-sm hover:underline mt-2 inline-block"
                >
                  Criar primeiro atendimento
                </Link>
              </div>
            ) : displayedAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-muted mx-auto mb-3" />
                <p className="text-slate-muted text-sm">
                  {activeAppointmentTab === 'scheduled'
                    ? 'Nenhuma consulta agendada.'
                    : activeAppointmentTab === 'completed'
                      ? 'Nenhum atendimento concluído.'
                      : 'Nenhum atendimento cancelado ou falta.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between p-4 border border-slate-border rounded-lg hover:border-brand/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-slate-dark">
                          {dateToBr(appointment.appointment_date)}
                        </p>
                        <Badge variant={getAppointmentStatusVariant(appointment.status)}>
                          {getAppointmentStatusLabel(appointment.status)}
                        </Badge>
                        {appointment.is_evaluation && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                            Avaliação
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-muted flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appointment.start_time?.substring(0, 5)} ({appointment.duration_minutes} min)
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {appointment.room?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {appointment.professional?.name || 'Sem profissional'}
                        </span>
                      </p>
                      {appointment.evolution_notes && (
                        <p className="text-sm text-slate-body mt-2 line-clamp-2">{appointment.evolution_notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment, e.target.value)}
                        disabled={updatingAppointment === appointment.id}
                        className="text-sm border border-slate-border rounded-lg px-2 py-1.5 bg-white text-slate-body focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                      >
                        <option value="scheduled">Agendado</option>
                        <option value="completed">Realizado</option>
                        <option value="missed">Faltou</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                      {appointment.status === 'completed' && (
                        <button
                          onClick={() => handleEditEvolution(appointment)}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Editar evolução"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        to={`/atendimentos/${appointment.id}`}
                        className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                        title="Editar/visualizar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Excluir atendimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <EvolutionNotesModal
        isOpen={evolutionModal.open}
        title={evolutionModal.mode === 'complete' ? 'Registrar evolução' : 'Editar evolução'}
        initialNotes={evolutionModal.notes}
        info={
          evolutionModal.appointment
            ? `Atendimento de ${dateToBr(evolutionModal.appointment.appointment_date)} às ${evolutionModal.appointment.start_time?.substring(0, 5)}`
            : ''
        }
        onSave={handleSaveEvolution}
        onClose={handleCloseEvolutionModal}
        saving={Boolean(updatingAppointment)}
      />
    </Layout>
  );
}
