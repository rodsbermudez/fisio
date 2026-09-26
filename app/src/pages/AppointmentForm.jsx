import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Clock, MapPin, FileText, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import DateInput from '../components/DateInput';
import { useAuth } from '../contexts/AuthContext';
import { getTreatmentCycle } from '../services/treatmentCycles';
import { listRooms } from '../services/rooms';
import { listProfessionals } from '../services/users';
import { getAppointment, createAppointment, updateAppointment } from '../services/appointments';

const DURATIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'completed', label: 'Realizado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'missed', label: 'Faltou' },
];

export default function AppointmentForm() {
  const { id, cicloId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromSchedule = searchParams.get('from') === 'schedule';
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [cycle, setCycle] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [roomId, setRoomId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [isEvaluation, setIsEvaluation] = useState(false);
  const [evolutionNotes, setEvolutionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsResponse, professionalsResponse] = await Promise.all([
          listRooms({ is_active: 1 }),
          isOwner ? listProfessionals() : Promise.resolve({ data: [] }),
        ]);
        setRooms(roomsResponse.data.data);
        setProfessionals(professionalsResponse.data || []);

        let cycleId = cicloId;
        if (isEditing) {
          const appointmentResponse = await getAppointment(id);
          const currentAppointment = appointmentResponse.data.appointment;
          cycleId = currentAppointment.treatment_cycle_id;
          setAppointmentDate(currentAppointment.appointment_date);
          setStartTime(currentAppointment.start_time?.substring(0, 5) || '');
          setDuration(currentAppointment.duration_minutes);
          setRoomId(currentAppointment.room_id);
          setProfessionalId(currentAppointment.professional_id ? String(currentAppointment.professional_id) : '');
          setStatus(currentAppointment.status);
          setIsEvaluation(currentAppointment.is_evaluation ?? false);
          setEvolutionNotes(currentAppointment.evolution_notes || '');
          setAppointment(currentAppointment);
        } else {
          setProfessionalId(user?.id ? String(user.id) : '');
        }

        const cycleResponse = await getTreatmentCycle(cycleId);
        setCycle(cycleResponse.data.treatment_cycle);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, cicloId, isEditing, isOwner, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentDate || !startTime || !roomId) {
      alert('Preencha data, horário e sala do atendimento.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        treatment_cycle_id: cycle.id,
        patient_plan_id: appointment?.patient_plan_id || cycle?.patient_plan_id || null,
        patient_id: cycle.patient_id,
        room_id: roomId,
        professional_id: isOwner && professionalId ? professionalId : user?.id,
        appointment_date: appointmentDate,
        start_time: startTime,
        duration_minutes: duration,
        status,
        is_evaluation: isEvaluation,
        evolution_notes: evolutionNotes,
      };

      if (isEditing) {
        await updateAppointment(id, payload);
      } else {
        await createAppointment(payload);
      }
      if (fromSchedule) {
        navigate('/agenda');
      } else {
        navigate(`/ciclos/${cycle.id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      alert('Erro ao salvar atendimento.');
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

  if (!cycle) {
    return (
      <Layout title="Ciclo não encontrado">
        <div className="text-center py-12 text-slate-muted">Ciclo não encontrado.</div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
      subtitle={`Paciente: ${cycle.patient.name} · Ciclo: ${cycle.title}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-slate-dark">Agendamento</h3>

            {cycle?.patient_plan && (
              <div className="text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-border text-slate-body">
                {isEvaluation ? (
                  <>Avaliação será cobrada no valor de{' '}
                    <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cycle.patient_plan.evaluation_price || 0)}</strong>.
                  </>
                ) : cycle.patient_plan.billing_type === 'appointments' ? (
                  <>Créditos de aulas a agendar:{' '}
                    <strong className={(cycle.patient_plan.schedulable_appointments || 0) > 0 ? 'text-brand' : 'text-danger-text'}>
                      {cycle.patient_plan.schedulable_appointments ?? 0}
                    </strong>
                    {isEditing && <span className="text-slate-muted"> (este atendimento já está agendado)</span>}
                  </>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DateInput
                label="Data do atendimento"
                value={appointmentDate}
                onChange={setAppointmentDate}
              />

              <div>
                <label className="label-base">Horário de início</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                  <input
                    type="time"
                    step="900"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field w-full pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label-base">Duração</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="input-field w-full"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-base">Sala</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="input-field w-full pl-10"
                  >
                    <option value="">Selecione uma sala...</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-base">Profissional</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                    <select
                      value={professionalId}
                      onChange={(e) => setProfessionalId(e.target.value)}
                      className="input-field w-full pl-10"
                    >
                      <option value="">Selecione um profissional...</option>
                      {professionals.map((prof) => (
                        <option key={prof.id} value={prof.id}>{prof.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label-base">Status</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      status === option.value
                        ? 'border-brand bg-brand-light text-brand font-medium'
                        : 'border-slate-border text-slate-body hover:border-brand/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {cycle?.patient_plan?.has_evaluation && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <input
                  id="isEvaluation"
                  type="checkbox"
                  checked={isEvaluation}
                  onChange={(e) => {
                    setIsEvaluation(e.target.checked);
                    if (e.target.checked && cycle?.patient_plan?.evaluation_duration_minutes) {
                      setDuration(cycle.patient_plan.evaluation_duration_minutes);
                    }
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="isEvaluation" className="text-sm text-purple-800">
                  Este atendimento é uma avaliação
                </label>
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              <h3 className="font-semibold text-slate-dark">Evolução do atendimento</h3>
            </div>
            <textarea
              value={evolutionNotes}
              onChange={(e) => setEvolutionNotes(e.target.value)}
              className="input-field w-full min-h-[250px] resize-y"
              placeholder="Descreva o atendimento realizado, observações clínicas, evolução do paciente..."
            />
          </div>

          <div className="flex items-center gap-3 pb-6">
            <button
              type="button"
              onClick={() => {
                if (fromSchedule) {
                  navigate('/agenda');
                } else {
                  navigate(`/ciclos/${cycle.id}`);
                }
              }}
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
              {saving ? 'Salvando...' : 'Salvar atendimento'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
