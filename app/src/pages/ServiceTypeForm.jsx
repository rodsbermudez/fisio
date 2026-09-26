import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Tag } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getServiceType, createServiceType, updateServiceType } from '../services/serviceTypes';

export default function ServiceTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0ea5e9');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const fetchServiceType = async () => {
      try {
        const response = await getServiceType(id);
        const type = response.data.service_type;
        setName(type.name);
        setDescription(type.description || '');
        setColor(type.color);
        setIsActive(type.is_active);
      } catch (error) {
        console.error('Erro ao carregar tipo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceType();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Informe o nome do tipo de atendimento.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, description, color, is_active: isActive };
      if (isEditing) {
        await updateServiceType(id, payload);
      } else {
        await createServiceType(payload);
      }
      navigate('/tipos-atendimento');
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
      alert('Erro ao salvar tipo de atendimento.');
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
      title={isEditing ? 'Editar Tipo de Atendimento' : 'Novo Tipo de Atendimento'}
      subtitle={isEditing ? 'Atualize os dados do tipo' : 'Cadastre um tipo de atendimento'}
    >
      <form onSubmit={handleSubmit}>
        <div className="card p-6 space-y-5 max-w-2xl">
          <div>
            <label className="label-base">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Fisioterapia pélvica"
            />
          </div>

          <div>
            <label className="label-base">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full min-h-[80px] resize-y"
              placeholder="Ex: Atendimento focado na reabilitação do assoalho pélvico"
            />
          </div>

          <div>
            <label className="label-base">Cor de identificação</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
              />
              <span className="text-sm text-slate-muted">{color}</span>
            </div>
          </div>

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
            <span className="text-sm text-slate-body">Atendimento ativo</span>
          </button>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/tipos-atendimento')}
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
              {saving ? 'Salvando...' : 'Salvar tipo'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
