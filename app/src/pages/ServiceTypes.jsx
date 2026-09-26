import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listServiceTypes, deleteServiceType } from '../services/serviceTypes';

export default function ServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchServiceTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listServiceTypes({ search });
      setServiceTypes(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar tipos de atendimento:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchServiceTypes();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchServiceTypes]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de atendimento?')) return;

    setDeletingId(id);
    try {
      await deleteServiceType(id);
      fetchServiceTypes();
    } catch (error) {
      console.error('Erro ao excluir tipo de atendimento:', error);
      alert('Erro ao excluir tipo de atendimento.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Tipos de Atendimento" subtitle="Cadastre os tipos de atendimento oferecidos">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <Link to="/tipos-atendimento/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo tipo
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando...</div>
        ) : serviceTypes.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhum tipo cadastrado</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Cadastre os tipos de atendimento da clínica.'}
            </p>
            {!search && (
              <Link to="/tipos-atendimento/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Criar tipo
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
                    Descrição
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
                {serviceTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="font-medium text-slate-dark">{type.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      <span className="truncate max-w-xs block">{type.description || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {type.is_active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="default">Inativo</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/tipos-atendimento/${type.id}/editar`}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(type.id)}
                          disabled={deletingId === type.id}
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
