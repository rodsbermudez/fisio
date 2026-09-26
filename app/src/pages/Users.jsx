import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, UsersRound } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listUsers, deleteUser } from '../services/users';
import { useAuth } from '../contexts/AuthContext';

export default function Users() {
  const { user } = useAuth();
  const isIndividual = user?.tenant?.type === 'individual';

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listUsers({ search });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchUsers]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) return;

    setDeletingId(id);
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      alert(error.response?.data?.message || 'Erro ao remover funcionário.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Funcionários" subtitle={isIndividual ? 'Visualize seus dados' : 'Gerencie os profissionais da clínica'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar funcionário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
            disabled={isIndividual}
          />
        </div>

        {!isIndividual && (
          <Link to="/funcionarios/novo" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo funcionário
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <UsersRound className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhum funcionário cadastrado</h3>
            <p className="text-slate-muted mt-1">
              {search
                ? 'Tente ajustar a busca.'
                : isIndividual
                  ? 'Profissionais autônomos não cadastram funcionários.'
                  : 'Cadastre os profissionais que atendem na clínica.'}
            </p>
            {!search && !isIndividual && (
              <Link to="/funcionarios/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Criar funcionário
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
                    E-mail
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Função
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-dark">{user.name}</span>
                      {user.crm && (
                        <p className="text-xs text-slate-muted">{user.crm}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {user.role === 'owner' ? 'Owner' : 'Terapeuta'}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="default">Inativo</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/funcionarios/${user.id}/editar`}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Remover"
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
