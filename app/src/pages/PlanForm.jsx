import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getPlan, createPlan, updatePlan } from '../services/plans';
import { listServiceTypes } from '../services/serviceTypes';
import { formatCurrencyInput, parseCurrency } from '../utils/masks';

const durations = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '60 minutos' },
];

const billingTypes = [
  { value: 'appointments', label: 'Por quantidade de atendimentos' },
  { value: 'monthly', label: 'Por mensalidade' },
];

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [billingType, setBillingType] = useState('appointments');
  const [numberOfAppointments, setNumberOfAppointments] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState('');
  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [evaluationPrice, setEvaluationPrice] = useState('');
  const [evaluationDurationMinutes, setEvaluationDurationMinutes] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await listServiceTypes({ is_active: true, per_page: 1000 });
        setServiceTypes(response.data.data);
      } catch (error) {
        console.error('Erro ao carregar tipos de atendimento:', error);
      }
    };

    fetchServiceTypes();
  }, []);

  useEffect(() => {
    if (!isEditing) return;

    const fetchPlan = async () => {
      try {
        const response = await getPlan(id);
        const plan = response.data.plan;
        setName(plan.name);
        setServiceTypeId(plan.service_type_id);
        setBillingType(plan.billing_type || 'appointments');
        setNumberOfAppointments(plan.number_of_appointments || 1);
        setDurationMinutes(plan.duration_minutes);
        setPrice(plan.price ? formatCurrencyInput(String(plan.price).replace('.', '')) : '');
        setHasEvaluation(plan.has_evaluation ?? false);
        setEvaluationPrice(plan.evaluation_price ? formatCurrencyInput(String(plan.evaluation_price).replace('.', '')) : '');
        setEvaluationDurationMinutes(plan.evaluation_duration_minutes ?? 60);
        setIsActive(plan.is_active);
      } catch (error) {
        console.error('Erro ao carregar plano:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Informe o nome do plano.');
      return;
    }

    if (!serviceTypeId) {
      alert('Selecione o tipo de atendimento.');
      return;
    }

    if (billingType === 'appointments' && !Number(numberOfAppointments)) {
      alert('Informe a quantidade de atendimentos.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        service_type_id: Number(serviceTypeId),
        billing_type: billingType,
        duration_minutes: Number(durationMinutes),
        price: parseCurrency(price),
        has_evaluation: hasEvaluation,
        evaluation_price: hasEvaluation ? parseCurrency(evaluationPrice) : null,
        evaluation_duration_minutes: hasEvaluation ? Number(evaluationDurationMinutes) : null,
        is_active: isActive,
      };

      if (billingType === 'appointments') {
        payload.number_of_appointments = Number(numberOfAppointments);
      }

      if (isEditing) {
        await updatePlan(id, payload);
      } else {
        await createPlan(payload);
      }
      navigate('/planos');
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Carregando...">
        <div className="text-center py-12 text-slate-muted">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? 'Editar Plano' : 'Novo Plano'}
      subtitle={isEditing ? 'Atualize os dados do plano comercial' : 'Cadastre um plano de atendimentos'}
    >
      <form onSubmit={handleSubmit}>
        <div className="card p-6 space-y-5 max-w-2xl">
          <div>
            <label className="label-base">Nome do plano</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Pilates 2x por semana"
            />
          </div>

          <div>
            <label className="label-base">Tipo de atendimento</label>
            <select
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Selecione...</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Tipo de cobrança</label>
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value)}
              className="input-field w-full"
            >
              {billingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-muted mt-1">
              {billingType === 'monthly'
                ? 'O sistema criará atendimentos para todos os dias/horários selecionados durante 1 mês.'
                : 'O plano terá uma quantidade fixa de atendimentos.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {billingType === 'appointments' && (
              <div>
                <label className="label-base">Quantidade de atendimentos</label>
                <input
                  type="number"
                  min={1}
                  value={numberOfAppointments}
                  onChange={(e) => setNumberOfAppointments(e.target.value)}
                  className="input-field w-full"
                />
              </div>
            )}

            <div>
              <label className="label-base">Duração de cada atendimento</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-field w-full"
              >
                {durations.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Preço do plano</label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
              className="input-field w-full"
              placeholder="0,00"
            />
          </div>

          <button
            type="button"
            onClick={() => setHasEvaluation(!hasEvaluation)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasEvaluation ? 'bg-brand' : 'bg-slate-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  hasEvaluation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            <span className="text-sm text-slate-body">Plano possui avaliação inicial</span>
          </button>

          {hasEvaluation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50 border border-slate-border rounded-lg">
              <div>
                <label className="label-base">Valor da avaliação</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={evaluationPrice}
                  onChange={(e) => setEvaluationPrice(formatCurrencyInput(e.target.value))}
                  className="input-field w-full"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="label-base">Duração da avaliação</label>
                <select
                  value={evaluationDurationMinutes}
                  onChange={(e) => setEvaluationDurationMinutes(e.target.value)}
                  className="input-field w-full"
                >
                  {durations.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-brand' : 'bg-slate-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            <span className="text-sm text-slate-body">Plano ativo</span>
          </button>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/planos')}
              className="px-5 py-2.5 border border-slate-border rounded-lg text-slate-body hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar plano'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
