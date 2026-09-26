import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Wallet } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listPlans, deletePlan } from '../services/plans';

const durations = {
  15: '15 min',
  30: '30 min',
  45: '45 min',
  60: '60 min',
};

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listPlans({ search });
      setPlans(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPlans();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchPlans]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este plano comercial?')) return;

    setDeletingId(id);
    try {
      await deletePlan(id);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      alert('Erro ao excluir plano.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Layout title="Planos Comerciais" subtitle="Cadastre planos de atendimentos para oferecer aos pacientes">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar plano..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <Link to="/planos/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo plano
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhum plano cadastrado</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Cadastre planos comerciais para vincular aos pacientes.'}
            </p>
            {!search && (
              <Link to="/planos/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Criar plano
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
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Cobrança
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Atendimentos
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Duração
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Preço
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Avaliação
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
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-dark">{plan.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-body">{plan.service_type?.name || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {plan.billing_type === 'monthly' ? 'Mensalidade' : 'Por atendimento'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {plan.billing_type === 'monthly' ? '—' : plan.number_of_appointments}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">{durations[plan.duration_minutes] || plan.duration_minutes}</td>
                    <td className="py-3 px-4 text-sm text-slate-body">{formatCurrency(plan.price)}</td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {plan.has_evaluation ? (
                        <span className="text-slate-body">{formatCurrency(plan.evaluation_price)}</span>
                      ) : (
                        <span className="text-slate-muted">Não possui</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {plan.is_active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="default">Inativo</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/planos/${plan.id}/editar`}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          disabled={deletingId === plan.id || plan.patient_plans_count > 0}
                          className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                          title={plan.patient_plans_count > 0 ? 'Plano possui pacientes vinculados' : 'Excluir'}
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
