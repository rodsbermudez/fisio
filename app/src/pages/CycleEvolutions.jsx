import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Clock, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getTreatmentCycle } from '../services/treatmentCycles';
import { listAppointments } from '../services/appointments';
import { dateToBr } from '../utils/masks';

export default function CycleEvolutions() {
  const { id } = useParams();
  const [cycle, setCycle] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cycleResponse, appointmentsResponse] = await Promise.all([
          getTreatmentCycle(id),
          listAppointments({ treatment_cycle_id: id }),
        ]);
        setCycle(cycleResponse.data.treatment_cycle);

        const completedWithNotes = appointmentsResponse.data.data
          .filter((a) => a.status === 'completed' && a.evolution_notes)
          .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        setAppointments(completedWithNotes);
      } catch (error) {
        console.error('Erro ao carregar evoluções:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Evoluções do ciclo" subtitle="Carregando...">
        <div className="text-center py-12 text-slate-muted">Carregando evoluções...</div>
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
      title="Evoluções do ciclo"
      subtitle={`Paciente: ${cycle.patient.name} · Ciclo: ${cycle.title}`}
    >
      <div className="mb-6">
        <Link
          to={`/ciclos/${id}`}
          className="text-sm text-brand hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o ciclo
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-muted mx-auto mb-3" />
          <p className="text-slate-muted">Nenhuma evolução registrada neste ciclo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card p-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-muted mb-4 pb-4 border-b border-slate-border">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {dateToBr(appointment.appointment_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {appointment.start_time?.substring(0, 5)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {appointment.professional?.name || 'Sem profissional'}
                </span>
              </div>
              <div className="text-slate-body leading-relaxed whitespace-pre-wrap">
                {appointment.evolution_notes}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
