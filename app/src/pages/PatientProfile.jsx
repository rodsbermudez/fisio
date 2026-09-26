import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Pencil, User, Phone, Mail, MapPin, AlertCircle, HeartPulse, Stethoscope, ClipboardPlus, FolderOpen, Wallet, Calendar, Plus, X, CheckCircle2, RefreshCw, History, Ban, RotateCcw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DateInput from '../components/DateInput';
import { useAuth } from '../contexts/AuthContext';
import { getPatient, updatePatient } from '../services/patients';
import { listTreatmentCycles } from '../services/treatmentCycles';
import { listServiceTypes } from '../services/serviceTypes';
import { listRooms } from '../services/rooms';
import { listPlans } from '../services/plans';
import { listProfessionals } from '../services/users';
import { listPatientPlans, createPatientPlan, deletePatientPlan, extendPatientPlan, updatePatientPlan, finishPatientPlan, reopenPatientPlan } from '../services/patientPlans';
import { maskPhone, maskCpf, maskCep, dateToBr, maskDate, dateToIso, formatCurrencyInput, parseCurrency } from '../utils/masks';
import { BRAZILIAN_STATES } from '../utils/states';

export default function PatientProfile() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [plans, setPlans] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [commercialPlans, setCommercialPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchPlans = async () => {
    if (!id) return;
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const response = await listPatientPlans({ patient_id: Number(id) });
      setPlans(response?.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlansError('Não foi possível carregar os planos ativos.');
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchCycles = async () => {
    if (!id) return;
    setLoadingCycles(true);
    try {
      const response = await listTreatmentCycles({ patient_id: id });
      setCycles(response?.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar ciclos:', error);
      setCycles([]);
    } finally {
      setLoadingCycles(false);
    }
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setLoadingCycles(true);
    setLoadingPlans(true);

    try {
      const [patientRes, cyclesRes, plansRes, typesRes, roomsRes, commercialRes, professionalsRes] = await Promise.all([
        getPatient(id),
        listTreatmentCycles({ patient_id: id }),
        listPatientPlans({ patient_id: Number(id) }),
        listServiceTypes({ is_active: true, per_page: 1000 }),
        listRooms({ is_active: true, per_page: 1000 }),
        listPlans({ is_active: true, per_page: 1000 }),
        listProfessionals(),
      ]);

      setPatient(patientRes?.data?.patient || null);
      setCycles(cyclesRes?.data?.data || []);
      setPlans(plansRes?.data?.data || []);
      setServiceTypes(typesRes?.data?.data || []);
      setRooms(roomsRes?.data?.data || []);
      setCommercialPlans(commercialRes?.data?.data || []);
      setProfessionals(professionalsRes?.data || []);
      setPlansError(null);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setLoading(false);
      setLoadingCycles(false);
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, location.key]);

  const handleToggleActive = async () => {
    if (!patient) return;
    setToggling(true);
    try {
      const response = await updatePatient(patient.id, { is_active: !patient.is_active });
      setPatient(response.data.patient);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    } finally {
      setToggling(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  const getStateName = (uf) => {
    const state = BRAZILIAN_STATES.find((s) => s.uf === uf);
    return state ? state.name : '';
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const calculatePending = (plan) => {
    let pending = 0;
    if (plan.extensions) {
      pending += plan.extensions
        .filter((ext) => !ext.is_paid)
        .reduce((sum, ext) => sum + (Number(ext.price) || 0), 0);
    }
    if (plan.appointments) {
      pending += plan.appointments
        .filter((app) => app.is_evaluation && !app.is_paid)
        .reduce((sum, app) => sum + (Number(app.price) || 0), 0);
    }
    return pending;
  };

  const totalPendingForPatient = plans.reduce((sum, plan) => sum + calculatePending(plan), 0);
  const totalRemainingAppointments = plans
    .filter((plan) => plan.status !== 'cancelled')
    .reduce((sum, plan) => sum + (plan.remaining_appointments || 0), 0);

  const handleDeletePlan = async (planId) => {
    if (!confirm('EXCLUIR plano (cadastro errado)?\n\nO ciclo de tratamento, as avaliações e TODOS os atendimentos vinculados a este plano serão removidos permanentemente. Se quiser apenas encerrar o contrato mantendo os atendimentos já agendados, use a opção "Encerrar".')) return;
    try {
      await deletePatientPlan(planId);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao remover plano:', error);
      alert('Erro ao remover plano.');
    }
  };

  const handleExtendPlan = async (planId) => {
    if (!confirm('Deseja renovar este plano com a mesma quantidade de atendimentos?')) return;
    try {
      await extendPatientPlan(planId);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao estender plano:', error);
      alert(error?.response?.data?.message || 'Erro ao estender plano.');
    }
  };

  const handleFinishPlan = async (planId) => {
    if (!confirm('Encerrar este plano?\n\nOs atendimentos já agendados (inclusive os créditos pagos ainda não realizados) serão MANTIDOS. Não será possível adicionar novos atendimentos nem renovar o plano.')) return;
    try {
      await finishPatientPlan(planId);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao encerrar plano:', error);
      alert(error?.response?.data?.message || 'Erro ao encerrar plano.');
    }
  };

  const handleReopenPlan = async (planId) => {
    if (!confirm('Reativar este plano? Ele voltará a permitir novos atendimentos e renovação.')) return;
    try {
      await reopenPatientPlan(planId);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao reativar plano:', error);
      alert(error?.response?.data?.message || 'Erro ao reativar plano.');
    }
  };

  const formatAddress = () => {
    if (!patient) return '—';
    const parts = [
      patient.street,
      patient.number,
      patient.complement,
      patient.neighborhood,
      patient.city,
    ].filter(Boolean);

    if (parts.length === 0) return '—';

    let address = `${patient.street || ''}${patient.number ? `, ${patient.number}` : ''}`;
    if (patient.complement) address += ` - ${patient.complement}`;
    if (patient.neighborhood) address += ` - ${patient.neighborhood}`;
    if (patient.city || patient.state) {
      address += `, ${[patient.city, patient.state].filter(Boolean).join('/')}`;
    }
    return address;
  };

  if (loading) {
    return (
      <Layout title="Perfil da Paciente">
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Perfil da Paciente">
        <div className="p-12 text-center">
          <p className="text-slate-muted">Paciente não encontrada.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Perfil da Paciente" subtitle="Visão unificada do cadastro">
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-6">
          <Link to="/pacientes" className="inline-flex items-center gap-2 text-slate-muted hover:text-slate-body">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pacientes
          </Link>
          <Link to={`/pacientes/${patient.id}/editar`} className="btn-primary flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" />
            Editar
          </Link>
        </div>

        {totalPendingForPatient > 0 && (
          <div className="mb-6 p-4 bg-danger-light border border-danger/20 rounded-lg flex items-center gap-3 text-danger-text">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Este paciente possui um valor em aberto de{' '}
              <strong>{formatCurrency(totalPendingForPatient)}</strong>. Revise os planos ativos abaixo.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Coluna principal - dados do paciente */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between pb-6 border-b border-slate-border">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
                    <User className="w-8 h-8 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-dark">{patient.name}</h3>
                    <p className="text-slate-muted text-sm mt-1">
                      {calculateAge(patient.birth_date)} · {patient.profession || 'Profissão não informada'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleActive}
                  disabled={toggling}
                  className="flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title={patient.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                >
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      patient.is_active ? 'bg-brand' : 'bg-slate-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        patient.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                  <span className="text-sm font-medium text-slate-dark">
                    {patient.is_active ? 'Paciente Ativo' : 'Paciente Inativo'}
                  </span>
                </button>
              </div>

              <div className="pt-6">
                <h4 className="text-sm font-semibold text-slate-dark uppercase tracking-wide mb-4">
                  Informações Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-muted" />
                    <div>
                      <p className="text-xs text-slate-muted">Telefone</p>
                      <p className="text-sm text-slate-body">{patient.phone ? maskPhone(patient.phone) : '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-muted" />
                    <div>
                      <p className="text-xs text-slate-muted">E-mail</p>
                      <p className="text-sm text-slate-body">{patient.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-muted" />
                    <div>
                      <p className="text-xs text-slate-muted">CPF</p>
                      <p className="text-sm text-slate-body">{maskCpf(patient.cpf)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HeartPulse className="w-4 h-4 text-slate-muted" />
                    <div>
                      <p className="text-xs text-slate-muted">Data de nascimento</p>
                      <p className="text-sm text-slate-body">{dateToBr(patient.birth_date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-border">
                <h4 className="text-sm font-semibold text-slate-dark uppercase tracking-wide mb-4">
                  Endereço
                </h4>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-muted mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-body">{formatAddress()}</p>
                    {patient.zip_code && (
                      <p className="text-xs text-slate-muted mt-1">CEP: {maskCep(patient.zip_code)}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-border">
                <h4 className="text-sm font-semibold text-slate-dark uppercase tracking-wide mb-4">
                  Contato de Emergência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-slate-muted" />
                    <div>
                      <p className="text-xs text-slate-muted">Nome do contato</p>
                      <p className="text-sm text-slate-body">{patient.emergency_contact_name || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-muted" />
                    <div>
                      <p className="text-xs text-slate-muted">Telefone do contato</p>
                      <p className="text-sm text-slate-body">
                        {patient.emergency_contact_phone ? maskPhone(patient.emergency_contact_phone) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-dark flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-brand" />
                  Planos Ativos
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchPlans}
                    disabled={loadingPlans}
                    className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors disabled:opacity-50"
                    title="Recarregar planos"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPlans ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => { setEditingPlan(null); setShowPlanModal(true); }}
                    className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    Atribuir plano
                  </button>
                </div>
              </div>

              {loadingPlans ? (
                <p className="text-slate-muted text-sm">Carregando planos...</p>
              ) : plansError ? (
                <div className="text-center py-6 border border-dashed border-danger/30 rounded-lg">
                  <p className="text-danger text-sm">{plansError}</p>
                  <button
                    onClick={fetchPlans}
                    className="mt-2 text-sm text-brand hover:underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-border rounded-lg">
                  <Calendar className="w-8 h-8 text-slate-muted mx-auto mb-2" />
                  <p className="text-slate-muted text-sm">Nenhum plano atribuído a este paciente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-border bg-slate-50/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Nome</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Tipo / Cobrança</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Início</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Saldo</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Valor</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-border">
                      {plans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-dark">{plan.name}</div>
                            {calculatePending(plan) > 0 && (
                              <div className="text-xs text-danger-text font-medium mt-0.5">
                                Em aberto: {formatCurrency(calculatePending(plan))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-body">
                            <div>{plan.service_type?.name || '—'}</div>
                            <div className="text-xs text-slate-muted">
                              {plan.billing_type === 'monthly' ? 'Mensalidade' : 'Por atendimento'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-body">{plan.start_date ? dateToBr(plan.start_date) : '—'}</td>
                          <td className="py-3 px-4 text-sm text-slate-body">
                            {plan.given_appointments_count ?? 0} / {plan.number_of_appointments}
                            {plan.billing_type === 'appointments' && (
                              <div className={`text-xs mt-0.5 ${(plan.schedulable_appointments || 0) > 0 ? 'text-brand font-medium' : 'text-slate-muted'}`}>
                                {plan.schedulable_appointments || 0} a agendar
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-body">
                            {formatCurrency(plan.price)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={plan.status === 'active' ? 'success' : plan.status === 'finished' ? 'default' : 'danger'}>
                              {plan.status === 'active' ? 'Ativo' : plan.status === 'finished' ? 'Finalizado' : 'Cancelado'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/pacientes/${id}/planos/${plan.id}`}
                                className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                                title="Histórico do plano"
                              >
                                <History className="w-4 h-4" />
                              </Link>
                              {plan.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => { setEditingPlan(plan); setShowRulesModal(true); }}
                                    className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                                    title="Editar regras"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleExtendPlan(plan.id)}
                                    className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                                    title="Renovar plano"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleFinishPlan(plan.id)}
                                    className="p-2 text-slate-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                                    title="Encerrar plano (mantém atendimentos agendados)"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {plan.status !== 'active' && (
                                <button
                                  onClick={() => handleReopenPlan(plan.id)}
                                  className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                                  title="Reativar plano"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                title="Excluir cadastro do plano (remove tudo)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Coluna direita - ciclos */}
          <div className="space-y-6">
            <Card className={`${totalRemainingAppointments <= 1 ? 'border-danger/40 bg-danger-light/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${totalRemainingAppointments <= 1 ? 'bg-danger-light' : 'bg-brand-light'}`}>
                    <Calendar className={`w-5 h-5 ${totalRemainingAppointments <= 1 ? 'text-danger-text' : 'text-brand'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-muted">Atendimentos disponíveis</p>
                    <p className={`text-2xl font-bold ${totalRemainingAppointments <= 1 ? 'text-danger-text' : 'text-slate-dark'}`}>
                      {totalRemainingAppointments}
                    </p>
                  </div>
                </div>
                {totalRemainingAppointments <= 1 && (
                  <div className="text-right">
                    <Badge variant="danger">Atenção</Badge>
                    <p className="text-xs text-danger-text mt-1">Paciente com poucas aulas restantes</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-dark">Ciclos de Tratamento</h3>
                <Link
                  to={`/pacientes/${patient.id}/ciclos/novo`}
                  className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
                >
                  <ClipboardPlus className="w-3 h-3" />
                  Novo
                </Link>
              </div>

              {loadingCycles ? (
                <p className="text-slate-muted text-sm">Carregando ciclos...</p>
              ) : cycles.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-border rounded-lg">
                  <FolderOpen className="w-8 h-8 text-slate-muted mx-auto mb-2" />
                  <p className="text-slate-muted text-sm">Nenhum ciclo iniciado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                    {cycles.map((cycle) => (
                      <Link
                        key={cycle.id}
                        to={`/ciclos/${cycle.id}`}
                        className="flex flex-col p-3 border border-slate-border rounded-lg hover:border-brand hover:bg-brand-light/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-slate-dark">{cycle.title}</p>
                          <Badge variant={cycle.status === 'in_progress' ? 'success' : 'default'}>
                            {cycle.status === 'in_progress' ? 'Em andamento' : 'Finalizado'}
                          </Badge>
                        </div>
                        {cycle.service_types && cycle.service_types.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {cycle.service_types.map((type) => (
                              <span
                                key={type.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                                style={{
                                  backgroundColor: `${type.color}15`,
                                  borderColor: `${type.color}40`,
                                  color: type.color,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: type.color }}
                                />
                                {type.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-muted mt-2">
                          {cycle.start_date ? dateToBr(cycle.start_date) : 'Data não definida'}
                          {' · '}
                          {cycle.evaluations?.length || 0} avaliação(ões)
                        </p>
                      </Link>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </div>

      </div>

      {showPlanModal && (
        <AssignPlanModal
          patientId={patient.id}
          commercialPlans={commercialPlans}
          serviceTypes={serviceTypes}
          rooms={rooms}
          professionals={professionals}
          currentUserId={user?.id}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null); }}
          onSaved={loadData}
          planToEdit={editingPlan}
        />
      )}

      {showRulesModal && editingPlan && (
        <EditRulesModal
          plan={editingPlan}
          serviceTypes={serviceTypes}
          rooms={rooms}
          professionals={professionals}
          currentUserId={user?.id}
          onClose={() => { setShowRulesModal(false); setEditingPlan(null); }}
          onSaved={loadData}
        />
      )}
    </Layout>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-slate-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      <span className="text-sm text-slate-body">{label}</span>
    </button>
  );
}

function AssignPlanModal({ patientId, commercialPlans, serviceTypes, rooms, professionals = [], currentUserId, onClose, onSaved }) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [name, setName] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [billingType, setBillingType] = useState('appointments');
  const [roomId, setRoomId] = useState('');
  const [professionalId, setProfessionalId] = useState(currentUserId ? String(currentUserId) : '');
  const [numberOfAppointments, setNumberOfAppointments] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [evaluationPrice, setEvaluationPrice] = useState('');
  const [evaluationDurationMinutes, setEvaluationDurationMinutes] = useState(60);
  const [evaluationDate, setEvaluationDate] = useState('');
  const [evaluationTime, setEvaluationTime] = useState('');
  const [evaluationRoomId, setEvaluationRoomId] = useState('');
  const [scheduleRules, setScheduleRules] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  });
  const [saving, setSaving] = useState(false);

  const days = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlanId(planId);
    const plan = commercialPlans.find((p) => String(p.id) === planId);
    if (plan) {
      setName(plan.name);
      setServiceTypeId(plan.service_type_id);
      setBillingType(plan.billing_type || 'appointments');
      setNumberOfAppointments(plan.number_of_appointments || 1);
      setDurationMinutes(plan.duration_minutes);
      setPrice(plan.price ? formatCurrencyInput(String(plan.price).replace('.', '')) : '');
      setHasEvaluation(plan.has_evaluation ?? false);
      setEvaluationPrice(plan.evaluation_price ? formatCurrencyInput(String(plan.evaluation_price).replace('.', '')) : '');
      setEvaluationDurationMinutes(plan.evaluation_duration_minutes ?? 60);
    } else {
      setBillingType('appointments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !serviceTypeId || !roomId) {
      alert('Preencha nome, tipo de atendimento e sala.');
      return;
    }

    if (!professionalId) {
      alert('Selecione o profissional que vai atender.');
      return;
    }

    const activeRules = Object.fromEntries(Object.entries(scheduleRules).filter(([, v]) => v));
    if (Object.keys(activeRules).length === 0) {
      alert('Informe pelo menos um dia/horário.');
      return;
    }

    if (hasEvaluation && (!evaluationDate || !evaluationTime || !evaluationRoomId)) {
      alert('Preencha a data, o horário e a sala da avaliação inicial.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        plan_id: selectedPlanId || null,
        name,
        service_type_id: Number(serviceTypeId),
        room_id: Number(roomId),
        billing_type: billingType,
        duration_minutes: Number(durationMinutes),
        price: parseCurrency(price),
        is_paid: isPaid,
        start_date: startDate?.split('T')[0],
        professional_id: Number(professionalId),
        schedule_rules: activeRules,
      };

      if (billingType === 'appointments') {
        payload.number_of_appointments = Number(numberOfAppointments);
      }

      if (hasEvaluation) {
        payload.has_evaluation = true;
        payload.evaluation_price = parseCurrency(evaluationPrice);
        payload.evaluation_duration_minutes = Number(evaluationDurationMinutes);
        payload.evaluation_date = evaluationDate?.split('T')[0];
        payload.evaluation_time = evaluationTime?.slice(0, 5);
        payload.evaluation_room_id = Number(evaluationRoomId);
      } else {
        payload.has_evaluation = false;
      }

      await createPatientPlan(payload);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
      alert(error?.response?.data?.message || 'Erro ao atribuir plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-dark">Atribuir Plano ao Paciente</h3>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-dark"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label-base">Plano comercial (opcional)</label>
            <select value={selectedPlanId} onChange={(e) => handlePlanSelect(e.target.value)} className="input-field w-full">
              <option value="">Personalizado</option>
              {commercialPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Nome do plano atribuído</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-base">Tipo de atendimento</label>
              <select value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)} className="input-field w-full">
                <option value="">Selecione...</option>
                {serviceTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
            <div>
              <label className="label-base">Sala padrão</label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-field w-full">
                <option value="">Selecione...</option>
                {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Profissional responsável</label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Selecione...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-muted mt-1">
              Os atendimentos gerados serão atribuídos a este profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-base">Tipo de cobrança</label>
              <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className="input-field w-full">
                <option value="appointments">Por quantidade</option>
                <option value="monthly">Por mensalidade</option>
              </select>
            </div>
            <div>
              <label className="label-base">Duração</label>
              <select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="input-field w-full">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {billingType === 'appointments' && (
              <div>
                <label className="label-base">Atendimentos</label>
                <input type="number" min={1} value={numberOfAppointments} onChange={(e) => setNumberOfAppointments(e.target.value)} className="input-field w-full" />
              </div>
            )}
            <div>
              <label className="label-base">Preço</label>
              <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(formatCurrencyInput(e.target.value))} className="input-field w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DateInput
              label="Data de início do plano"
              value={startDate}
              onChange={setStartDate}
            />
          </div>

          <Toggle checked={isPaid} onChange={setIsPaid} label="Plano pago" />

          <Toggle checked={hasEvaluation} onChange={setHasEvaluation} label="Paciente fará avaliação inicial" />

          {hasEvaluation && (
            <div className="p-4 bg-slate-50 border border-slate-border rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-base">Valor da avaliação</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={evaluationPrice}
                    onChange={(e) => setEvaluationPrice(formatCurrencyInput(e.target.value))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="label-base">Duração da avaliação</label>
                  <select
                    value={evaluationDurationMinutes}
                    onChange={(e) => setEvaluationDurationMinutes(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <DateInput
                  label="Data da avaliação"
                  value={evaluationDate}
                  onChange={setEvaluationDate}
                />
                <div>
                  <label className="label-base">Horário</label>
                  <input
                    type="time"
                    step="900"
                    value={evaluationTime}
                    onChange={(e) => setEvaluationTime(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="label-base">Sala da avaliação</label>
                  <select
                    value={evaluationRoomId}
                    onChange={(e) => setEvaluationRoomId(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Selecione...</option>
                    {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label-base">Dias e horários</label>
            <p className="text-xs text-slate-muted mb-2">Informe os horários nos dias desejados para gerar os atendimentos automaticamente.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {days.map((day) => (
                <div key={day.key} className="flex items-center gap-3">
                  <span className="text-sm text-slate-body w-24">{day.label}</span>
                  <input
                    type="time"
                    step="900"
                    value={scheduleRules[day.key]}
                    onChange={(e) => setScheduleRules({ ...scheduleRules, [day.key]: e.target.value })}
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-border rounded-lg text-slate-body hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Atribuir e gerar atendimentos'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRulesModal({ plan, serviceTypes, rooms, professionals = [], currentUserId, onClose, onSaved }) {
  const [name, setName] = useState(plan.name);
  const [serviceTypeId, setServiceTypeId] = useState(plan.service_type_id);
  const [roomId, setRoomId] = useState(plan.room_id);
  const [professionalId, setProfessionalId] = useState(
    plan.professional_id ? String(plan.professional_id) : (currentUserId ? String(currentUserId) : '')
  );
  const [billingType, setBillingType] = useState(plan.billing_type || 'appointments');
  const [numberOfAppointments, setNumberOfAppointments] = useState(plan.number_of_appointments);
  const [durationMinutes, setDurationMinutes] = useState(plan.duration_minutes);
  const [price, setPrice] = useState(plan.price ? formatCurrencyInput(String(plan.price).replace('.', '')) : '');
  const [isPaid, setIsPaid] = useState(plan.is_paid);
  const [startDate, setStartDate] = useState(plan.start_date ?? new Date().toISOString().split('T')[0]);
  const [hasEvaluation, setHasEvaluation] = useState(plan.has_evaluation ?? false);
  const [evaluationPrice, setEvaluationPrice] = useState(plan.evaluation_price ? formatCurrencyInput(String(plan.evaluation_price).replace('.', '')) : '');
  const [evaluationDurationMinutes, setEvaluationDurationMinutes] = useState(plan.evaluation_duration_minutes ?? 60);
  const [evaluationDate, setEvaluationDate] = useState(plan.evaluation_date ?? '');
  const [evaluationTime, setEvaluationTime] = useState(plan.evaluation_time ?? '');
  const [evaluationRoomId, setEvaluationRoomId] = useState(plan.evaluation_room_id ?? '');
  const [scheduleRules, setScheduleRules] = useState({
    sunday: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '',
    ...plan.schedule_rules,
  });
  const [reschedule, setReschedule] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const activeRules = Object.fromEntries(Object.entries(scheduleRules).filter(([, v]) => v));
    if (Object.keys(activeRules).length === 0) {
      alert('Informe pelo menos um dia/horário.');
      return;
    }

    if (hasEvaluation && (!evaluationDate || !evaluationTime || !evaluationRoomId)) {
      alert('Preencha a data, o horário e a sala da avaliação inicial.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        service_type_id: Number(serviceTypeId),
        room_id: Number(roomId),
        professional_id: professionalId ? Number(professionalId) : null,
        billing_type: billingType,
        duration_minutes: Number(durationMinutes),
        price: parseCurrency(price),
        is_paid: isPaid,
        start_date: startDate?.split('T')[0],
        has_evaluation: hasEvaluation,
        schedule_rules: activeRules,
        reschedule_future_appointments: reschedule,
      };

      if (billingType === 'appointments') {
        payload.number_of_appointments = Number(numberOfAppointments);
      }

      if (hasEvaluation) {
        payload.evaluation_price = parseCurrency(evaluationPrice);
        payload.evaluation_duration_minutes = Number(evaluationDurationMinutes);
        payload.evaluation_date = evaluationDate?.split('T')[0];
        payload.evaluation_time = evaluationTime?.slice(0, 5);
        payload.evaluation_room_id = Number(evaluationRoomId);
      }

      await updatePatientPlan(plan.id, payload);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      alert(error?.response?.data?.message || 'Erro ao atualizar plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-dark">Editar Plano Atribuído</h3>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-dark"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label-base">Nome do plano atribuído</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-base">Tipo de atendimento</label>
              <select value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)} className="input-field w-full">
                {serviceTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
            <div>
              <label className="label-base">Sala padrão</label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-field w-full">
                {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Profissional responsável</label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Selecione...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-muted mt-1">
              Ao marcar "reagendar atendimentos futuros", os atendimentos serão recriados para este profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-base">Tipo de cobrança</label>
              <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className="input-field w-full">
                <option value="appointments">Por quantidade</option>
                <option value="monthly">Por mensalidade</option>
              </select>
            </div>
            <div>
              <label className="label-base">Duração</label>
              <select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="input-field w-full">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {billingType === 'appointments' && (
              <div>
                <label className="label-base">Atendimentos</label>
                <input type="number" min={1} value={numberOfAppointments} onChange={(e) => setNumberOfAppointments(e.target.value)} className="input-field w-full" />
              </div>
            )}
            <div>
              <label className="label-base">Preço</label>
              <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(formatCurrencyInput(e.target.value))} className="input-field w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DateInput
              label="Data de início do plano"
              value={startDate}
              onChange={setStartDate}
            />
          </div>

          <Toggle checked={isPaid} onChange={setIsPaid} label="Plano pago" />

          <Toggle checked={hasEvaluation} onChange={setHasEvaluation} label="Paciente fará avaliação inicial" />

          {hasEvaluation && (
            <div className="p-4 bg-slate-50 border border-slate-border rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-base">Valor da avaliação</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={evaluationPrice}
                    onChange={(e) => setEvaluationPrice(formatCurrencyInput(e.target.value))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="label-base">Duração da avaliação</label>
                  <select
                    value={evaluationDurationMinutes}
                    onChange={(e) => setEvaluationDurationMinutes(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <DateInput
                  label="Data da avaliação"
                  value={evaluationDate}
                  onChange={setEvaluationDate}
                />
                <div>
                  <label className="label-base">Horário</label>
                  <input
                    type="time"
                    step="900"
                    value={evaluationTime}
                    onChange={(e) => setEvaluationTime(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="label-base">Sala da avaliação</label>
                  <select
                    value={evaluationRoomId}
                    onChange={(e) => setEvaluationRoomId(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Selecione...</option>
                    {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label-base">Dias e horários</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {days.map((day) => (
                <div key={day.key} className="flex items-center gap-3">
                  <span className="text-sm text-slate-body w-24">{day.label}</span>
                  <input
                    type="time"
                    step="900"
                    value={scheduleRules[day.key]}
                    onChange={(e) => setScheduleRules({ ...scheduleRules, [day.key]: e.target.value })}
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input id="reschedule" type="checkbox" checked={reschedule} onChange={(e) => setReschedule(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="reschedule" className="text-sm text-amber-800">
              Reagendar atendimentos futuros agendados com base nas novas regras
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-border rounded-lg text-slate-body hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

