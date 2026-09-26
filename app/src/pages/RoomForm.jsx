import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getRoom, createRoom, updateRoom } from '../services/rooms';

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#0ea5e9');
  const [capacity, setCapacity] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const fetchRoom = async () => {
      try {
        const response = await getRoom(id);
        const room = response.data.room;
        setName(room.name);
        setColor(room.color);
        setCapacity(room.capacity ?? 1);
        setIsActive(room.is_active);
      } catch (error) {
        console.error('Erro ao carregar sala:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Informe o nome da sala.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, color, capacity: Number(capacity), is_active: isActive };
      if (isEditing) {
        await updateRoom(id, payload);
      } else {
        await createRoom(payload);
      }
      navigate('/salas');
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      alert('Erro ao salvar sala.');
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
      title={isEditing ? 'Editar Sala' : 'Nova Sala'}
      subtitle={isEditing ? 'Atualize os dados da sala' : 'Cadastre uma sala de atendimento'}
    >
      <form onSubmit={handleSubmit}>
        <div className="card p-6 space-y-5 max-w-2xl">
          <div>
            <label className="label-base">Nome da sala</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Sala 1"
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

          <div>
            <label className="label-base">Capacidade por horário</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 1"
            />
            <p className="text-xs text-slate-muted mt-1">
              Quantidade de atendimentos simultâneos permitidos nesta sala no mesmo horário.
            </p>
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
            <span className="text-sm text-slate-body">Sala ativa</span>
          </button>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/salas')}
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
              {saving ? 'Salvando...' : 'Salvar sala'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
