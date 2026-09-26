import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Tag } from 'lucide-react';
import Layout from '../components/layout/Layout';
import DateInput from '../components/DateInput';
import { createTreatmentCycle } from '../services/treatmentCycles';
import { listServiceTypes } from '../services/serviceTypes';

export default function TreatmentCycleForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [serviceTypeIds, setServiceTypeIds] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await listServiceTypes({ is_active: 1 });
        setServiceTypes(response.data.data);
      } catch (error) {
        console.error('Erro ao carregar tipos de atendimento:', error);
      } finally {
        setLoadingServiceTypes(false);
      }
    };

    fetchServiceTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Informe o título do ciclo.');
      return;
    }

    if (serviceTypeIds.length === 0) {
      alert('Selecione pelo menos um tipo de atendimento.');
      return;
    }

    setSaving(true);
    try {
      await createTreatmentCycle({
        patient_id: patientId,
        title,
        notes,
        start_date: startDate || null,
        service_type_ids: serviceTypeIds,
      });
      navigate(`/pacientes/${patientId}`);
    } catch (error) {
      console.error('Erro ao criar ciclo:', error);
      alert('Erro ao criar ciclo de tratamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Novo Ciclo de Tratamento" subtitle="Inicie um novo acompanhamento">
      <form onSubmit={handleSubmit}>
        <div className="card p-6 space-y-5 max-w-2xl">
          <div>
            <label className="label-base">Título do ciclo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Fisioterapia pós-parto"
            />
          </div>

          <DateInput
            label="Data de início"
            value={startDate}
            onChange={setStartDate}
          />

          <div>
            <label className="label-base">Tipos de atendimento</label>
            {loadingServiceTypes ? (
              <p className="text-sm text-slate-muted">Carregando...</p>
            ) : serviceTypes.length === 0 ? (
              <p className="text-sm text-slate-muted">
                Nenhum tipo de atendimento ativo cadastrado.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {serviceTypes.map((type) => {
                  const selected = serviceTypeIds.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setServiceTypeIds(serviceTypeIds.filter((id) => id !== type.id));
                        } else {
                          setServiceTypeIds([...serviceTypeIds, type.id]);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selected
                          ? 'border-slate-dark bg-slate-dark text-white'
                          : 'border-slate-border text-slate-body hover:border-slate-dark'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="label-base">Anotações iniciais</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field w-full min-h-[120px] resize-y"
              placeholder="Ex: Queixa principal, objetivos do tratamento..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/pacientes/${patientId}`)}
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
              {saving ? 'Salvando...' : 'Criar ciclo'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
