import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  UserRound,
  CalendarDays,
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminDashboard } from '../../services/admin';
import { maskCpfCnpj } from '../../utils/masks';

function StatCard({ icon: Icon, label, value, colorClass = 'bg-brand-light text-brand' }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-muted">{label}</p>
          <p className="text-3xl font-bold text-slate-dark mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((response) => setData(response.data))
      .catch((error) => console.error('Erro ao carregar dashboard admin:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard" subtitle="Visão geral da plataforma">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Building2} label="Total de clientes" value={data?.tenants_count ?? 0} />
            <StatCard
              icon={TrendingUp}
              label="Clientes ativos"
              value={data?.active_tenants_count ?? 0}
              colorClass="bg-success-light text-success"
            />
            <StatCard
              icon={TrendingDown}
              label="Clientes suspensos"
              value={data?.inactive_tenants_count ?? 0}
              colorClass="bg-danger-light text-danger"
            />
            <StatCard icon={Users} label="Usuários" value={data?.users_count ?? 0} />
            <StatCard icon={UserRound} label="Pacientes" value={data?.patients_count ?? 0} />
            <StatCard icon={CalendarDays} label="Atendimentos" value={data?.appointments_count ?? 0} />
            <StatCard icon={Wallet} label="Planos ativos" value={data?.active_plans_count ?? 0} />
            <StatCard icon={Activity} label="Taxa de ativação" value={`${data?.tenants_count ? Math.round((data.active_tenants_count / data.tenants_count) * 100) : 0}%`} />
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-dark">Clientes recentes</h3>
              <Link to="/admin/clientes" className="text-sm text-brand hover:text-brand-hover font-medium">
                Ver todos
              </Link>
            </div>

            {data?.recent_tenants?.length === 0 ? (
              <p className="text-slate-muted">Nenhum cliente cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-border bg-slate-50/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Nome</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Tipo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Usuários</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">Pacientes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-border">
                    {data?.recent_tenants?.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-dark">{tenant.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-body capitalize">
                          {tenant.type === 'clinic' ? 'Clínica' : 'Autônomo'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.is_active ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                            {tenant.is_active ? 'Ativa' : 'Suspensa'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-body">{tenant.users_count}</td>
                        <td className="py-3 px-4 text-sm text-slate-body">{tenant.patients_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
