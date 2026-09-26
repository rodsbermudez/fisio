import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Users,
  Eye,
  Power,
  PowerOff,
  Building2,
  Trash2,
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { listTenants, updateTenant, deleteTenant, impersonateTenant } from '../../services/admin';
import { maskCpfCnpj } from '../../utils/masks';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminClinics() {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listTenants({ search });
      setClinics(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClinics();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchClinics]);

  const handleToggleStatus = async (clinic) => {
    setProcessingId(clinic.id);
    try {
      await updateTenant(clinic.id, { is_active: !clinic.is_active });
      fetchClinics();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.message || 'Erro ao alterar status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (clinic) => {
    if (!confirm(`Deseja remover o cliente "${clinic.name}"?`)) return;

    setProcessingId(clinic.id);
    try {
      await deleteTenant(clinic.id);
      fetchClinics();
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      alert(error.response?.data?.message || 'Erro ao remover cliente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleImpersonate = async (clinic) => {
    setProcessingId(clinic.id);
    try {
      const response = await impersonateTenant(clinic.id);
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
    <AdminLayout title="Clientes" subtitle="Gerencie os clientes da plataforma">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <Link to="/admin/clientes/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo cliente
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando...</div>
        ) : clinics.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhum cliente cadastrado</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Cadastre o primeiro cliente da plataforma.'}
            </p>
            {!search && (
              <Link to="/admin/clientes/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Criar cliente
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Tipo</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Responsável</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Usuários</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Pacientes</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {clinics.map((clinic) => {
                  const owner = clinic.users?.find((u) => u.role === 'owner');
                  return (
                    <tr key={clinic.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-dark">{clinic.name}</span>
                        {clinic.document && (
                          <p className="text-xs text-slate-muted">{maskCpfCnpj(clinic.document)}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-body capitalize">
                        {clinic.type === 'clinic' ? 'Clínica' : 'Autônomo'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-body">
                        {owner?.name || '-'}
                        {owner?.email && (
                          <p className="text-xs text-slate-muted">{owner.email}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clinic.is_active ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                          {clinic.is_active ? 'Ativa' : 'Suspensa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-body">{clinic.users_count}</td>
                      <td className="py-3 px-4 text-sm text-slate-body">{clinic.patients_count}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleImpersonate(clinic)}
                            disabled={processingId === clinic.id || !clinic.is_active}
                            className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors disabled:opacity-50"
                            title="Entrar como cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/clientes/${clinic.id}/usuarios`}
                            className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                            title="Ver usuários"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/clientes/${clinic.id}/editar`}
                            className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(clinic)}
                            disabled={processingId === clinic.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              clinic.is_active
                                ? 'text-slate-muted hover:text-danger hover:bg-danger-light'
                                : 'text-slate-muted hover:text-success hover:bg-success-light'
                            }`}
                            title={clinic.is_active ? 'Suspender' : 'Reativar'}
                          >
                            {clinic.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(clinic)}
                            disabled={processingId === clinic.id}
                            className="p-2 text-slate-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors disabled:opacity-50"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
