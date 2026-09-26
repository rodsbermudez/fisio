import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, FileText } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getTreatmentCycle } from '../services/treatmentCycles';
import { getEvaluation, createEvaluation, updateEvaluation } from '../services/evaluations';
import { listTemplates } from '../services/templates';

const FIELD_TYPES_RENDER = {
  input: (field, value, onChange) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-field w-full"
      placeholder="Resposta..."
    />
  ),
  textarea: (field, value, onChange) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-field w-full min-h-[100px] resize-y"
      placeholder="Resposta..."
    />
  ),
  number: (field, value, onChange) => (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-field w-full"
      placeholder="0"
    />
  ),
  select: (field, value, onChange) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-field w-full"
    >
      <option value="">Selecione...</option>
      {(field.options || []).map((opt, i) => (
        <option key={i} value={opt}>{opt}</option>
      ))}
    </select>
  ),
  radio: (field, value, onChange) => (
    <div className="space-y-2">
      {(field.options || []).map((opt, i) => (
        <label key={i} className="flex items-center gap-2 text-sm text-slate-body">
          <input
            type="radio"
            name={field.label}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="text-brand"
          />
          {opt}
        </label>
      ))}
    </div>
  ),
  checkbox: (field, value, onChange) => (
    <div className="space-y-2">
      {(field.options || []).map((opt, i) => (
        <label key={i} className="flex items-center gap-2 text-sm text-slate-body">
          <input
            type="checkbox"
            checked={(value || []).includes(opt)}
            onChange={(e) => {
              const current = value || [];
              if (e.target.checked) {
                onChange([...current, opt]);
              } else {
                onChange(current.filter((v) => v !== opt));
              }
            }}
            className="rounded text-brand"
          />
          {opt}
        </label>
      ))}
    </div>
  ),
  toggle: (field, value, onChange) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-3"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-brand' : 'bg-slate-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      <span className="text-sm text-slate-body">{value ? 'Sim' : 'Não'}</span>
    </button>
  ),
};

export default function EvaluationForm() {
  const { id, cicloId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [cycle, setCycle] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cycleResponse = await getTreatmentCycle(cicloId || (await getEvaluation(id)).data.evaluation.treatment_cycle_id);
        setCycle(cycleResponse.data.treatment_cycle);

        const templatesResponse = await listTemplates({ is_active: 1 });
        setTemplates(templatesResponse.data.data);

        if (isEditing) {
          const evaluationResponse = await getEvaluation(id);
          const evaluation = evaluationResponse.data.evaluation;
          setResponses(evaluation.responses || {});
          setSelectedTemplateId(evaluation.template_version.template_id);
          setSelectedTemplate(evaluation.template_version.snapshot);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, cicloId, isEditing]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === Number(templateId));
    if (template) {
      setSelectedTemplate({
        title: template.title,
        description: template.description,
        fields: template.fields,
      });
    } else {
      setSelectedTemplate(null);
    }
    setResponses({});
  };

  const updateResponse = (label, value) => {
    setResponses({ ...responses, [label]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      alert('Selecione um modelo de ficha.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateEvaluation(id, { responses });
        navigate(`/ciclos/${cycle.id}`);
      } else {
        const response = await createEvaluation({
          treatment_cycle_id: cycle.id,
          template_id: selectedTemplateId,
          responses,
        });
        navigate(`/ciclos/${cycle.id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação.');
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
      title={isEditing ? 'Editar Avaliação' : 'Nova Avaliação'}
      subtitle={cycle ? `Ciclo: ${cycle.title}` : ''}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {!isEditing && (
            <div className="card p-6">
              <label className="label-base">Modelo de ficha</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="input-field w-full"
                disabled={isEditing}
              >
                <option value="">Selecione um modelo...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.title}</option>
                ))}
              </select>
            </div>
          )}

          {selectedTemplate && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <FileText className="w-5 h-5 text-brand" />
                <div>
                  <h3 className="font-semibold text-slate-dark">{selectedTemplate.title}</h3>
                  {selectedTemplate.description && (
                    <p className="text-sm text-slate-muted">{selectedTemplate.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {selectedTemplate.fields.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-slate-dark mb-1">
                      {field.label}
                      {field.required && <span className="text-danger ml-1">*</span>}
                    </label>
                    {field.helper_text && (
                      <p className="text-xs text-slate-muted mb-2">{field.helper_text}</p>
                    )}
                    {FIELD_TYPES_RENDER[field.type](field, responses[field.label], (value) =>
                      updateResponse(field.label, value)
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate(`/ciclos/${cycle?.id}`)}
              className="px-5 py-2.5 border border-slate-border rounded-lg text-slate-body hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selectedTemplate}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar avaliação'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
