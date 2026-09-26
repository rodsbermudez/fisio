import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Eye, AlertCircle, Calendar, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listPatients, deletePatient } from '../services/patients';
import { maskPhone } from '../utils/masks';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPatients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await listPatients({ search, page });
      setPatients(response.data.data);
      setPagination(response.data);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPatients(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchPatients]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta paciente?')) return;

    setDeletingId(id);
    try {
      await deletePatient(id);
      await fetchPatients(pagination?.current_page || 1);
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      alert('Erro ao excluir paciente.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCpf = (cpf) => {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <Layout title="Pacientes" subtitle="Gerencie o cadastro das suas pacientes">
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-slate-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-full"
          />
        </div>

        <Link to="/pacientes/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Paciente
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhuma paciente cadastrada</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Cadastre suas pacientes para acompanhar os atendimentos.'}
            </p>
            {!search && (
              <Link to="/pacientes/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Cadastrar primeira paciente
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-surface text-slate-muted text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">CPF</th>
                  <th className="px-6 py-3 font-medium">Telefone</th>
                  <th className="px-6 py-3 font-medium">Idade</th>
                  <th className="px-6 py-3 font-medium">Aulas disponíveis</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/pacientes/${patient.id}`} className="font-medium text-slate-dark hover:text-brand">
                        {patient.name}
                      </Link>
                      {patient.pending_amount > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-danger-text">
                          <AlertCircle className="w-3 h-3" />
                          Em aberto: {formatCurrency(patient.pending_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-body">{formatCpf(patient.cpf)}</td>
                    <td className="px-6 py-4 text-slate-body">{patient.phone ? maskPhone(patient.phone) : '—'}</td>
                    <td className="px-6 py-4 text-slate-body">
                      {patient.birth_date
                        ? `${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} anos`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${(patient.total_remaining_appointments || 0) <= 1 ? 'text-danger-text' : 'text-slate-muted'}`} />
                        <span className={`text-sm font-medium ${(patient.total_remaining_appointments || 0) <= 1 ? 'text-danger-text' : 'text-slate-body'}`}>
                          {patient.total_remaining_appointments || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {patient.is_active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="default">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/pacientes/${patient.id}`}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Ver perfil"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/pacientes/${patient.id}/editar`}
                          className="p-2 text-slate-muted hover:text-warning hover:bg-warning-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          disabled={deletingId === patient.id}
                          className="p-2 text-slate-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors disabled:opacity-50"
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

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-border">
            <p className="text-sm text-slate-muted">
              Mostrando {pagination.from}–{pagination.to} de {pagination.total} pacientes
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPatients(pagination.current_page - 1)}
                disabled={!pagination.prev_page_url}
                className="px-3 py-1.5 text-sm border border-slate-border rounded-lg text-slate-body hover:bg-slate-surface disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchPatients(pagination.current_page + 1)}
                disabled={!pagination.next_page_url}
                className="px-3 py-1.5 text-sm border border-slate-border rounded-lg text-slate-body hover:bg-slate-surface disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
