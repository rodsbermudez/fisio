import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, DoorOpen } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listRooms, deleteRoom } from '../services/rooms';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listRooms({ search });
      setRooms(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRooms();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchRooms]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;

    setDeletingId(id);
    try {
      await deleteRoom(id);
      fetchRooms();
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
      alert('Erro ao excluir sala.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Salas de Atendimento" subtitle="Cadastre as salas onde os atendimentos acontecem">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar sala..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <Link to="/salas/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova sala
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center">
            <DoorOpen className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhuma sala cadastrada</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Cadastre as salas de atendimento.'}
            </p>
            {!search && (
              <Link to="/salas/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Criar sala
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Capacidade
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Atendimentos
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: room.color }}
                        />
                        <span className="font-medium text-slate-dark">{room.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {room.capacity || 1} por horário
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {room.appointments_count || 0}
                    </td>
                    <td className="py-3 px-4">
                      {room.is_active ? (
                        <Badge variant="success">Ativa</Badge>
                      ) : (
                        <Badge variant="default">Inativa</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/salas/${room.id}/editar`}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(room.id)}
                          disabled={deletingId === room.id}
                          className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
