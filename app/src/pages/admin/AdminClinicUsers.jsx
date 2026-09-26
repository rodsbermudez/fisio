import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Eye, UsersRound } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { listTenantUsers, getTenant, impersonateTenant } from '../../services/admin';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';

export default function AdminClinicUsers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();

  const [clinic, setClinic] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clinicResponse, usersResponse] = await Promise.all([
        getTenant(id),
        listTenantUsers(id, { search }),
      ]);
      setClinic(clinicResponse.data.tenant);
      setUsers(usersResponse.data.data);
    } catch (error) {
      console.error('Erro ao carregar usuários do cliente:', error);
    } finally {
      setLoading(false);
    }
  }, [id, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchData]);

  const handleImpersonate = async (user) => {
    if (user.role !== 'owner') return;

    setProcessingId(user.id);
    try {
      const response = await impersonateTenant(id);
      await startImpersonation(response.data.token, response.data.tenant);
      navigate('/');
    } catch (error) {
      console.error('Erro ao acessar cliente:', error);
      alert(error.response?.data?.message || 'Erro ao acessar cliente.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout
      title="Usuários do cliente"
      subtitle={clinic ? clinic.name : 'Carregando...'}
    >
      <div className="mb-6">
        <Link
          to="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-muted hover:text-slate-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para clientes
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <UsersRound className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhum usuário encontrado</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Esse cliente ainda não possui usuários.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">E-mail</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Função</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-dark">{user.name}</span>
                      {user.crm && <p className="text-xs text-slate-muted">{user.crm}</p>}
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
                      {user.role === 'owner' && user.is_active && clinic?.is_active && (
                        <button
                          onClick={() => handleImpersonate(user)}
                          disabled={processingId === user.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand hover:text-brand-hover bg-brand-light rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          Entrar como owner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
