import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, EyeOff } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getUser, createUser, updateUser } from '../services/users';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const isIndividual = user?.tenant?.type === 'individual';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [crm, setCrm] = useState('');
  const [role, setRole] = useState('therapist');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const fetchUser = async () => {
      try {
        const response = await getUser(id);
        const user = response.data.user;
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || '');
        setCrm(user.crm || '');
        setRole(user.role);
        setIsActive(user.is_active ?? true);
      } catch (error) {
        console.error('Erro ao carregar funcionário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      alert('Informe nome e e-mail.');
      return;
    }

    if (!isEditing && password.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        email,
        phone: phone || null,
        crm: crm || null,
        role,
        is_active: isActive,
      };

      if (!isEditing || password) {
        payload.password = password;
      }

      if (isEditing) {
        await updateUser(id, payload);
      } else {
        await createUser(payload);
      }
      navigate('/funcionarios');
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      alert(error.response?.data?.message || 'Erro ao salvar funcionário.');
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

  if (!isEditing && isIndividual) {
    return (
      <Layout title="Novo funcionário" subtitle="Ação não permitida">
        <div className="card p-8 text-center max-w-2xl">
          <p className="text-slate-body mb-4">
            Profissionais autônomos não podem cadastrar funcionários.
          </p>
          <button
            type="button"
            onClick={() => navigate('/funcionarios')}
            className="btn-primary"
          >
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
      subtitle={isEditing ? 'Atualize os dados do profissional' : 'Cadastre um profissional da clínica'}
    >
      <form onSubmit={handleSubmit}>
        <div className="card p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label-base">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Ex: Dra. Ana Silva"
                required
              />
            </div>

            <div>
              <label className="label-base">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="email@clinica.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-base">
              {isEditing ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pr-10"
                placeholder="••••••••"
                required={!isEditing}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-slate-body"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label-base">Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field w-full"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="label-base">Registro profissional (CREFITO)</label>
              <input
                type="text"
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                className="input-field w-full"
                placeholder="Ex: CREFITO/SP 12345"
              />
            </div>
          </div>

          <div>
            <label className="label-base">Função</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field w-full"
            >
              <option value="therapist">Terapeuta</option>
              <option value="owner">Owner</option>
            </select>
            <p className="text-xs text-slate-muted mt-1">
              Owners podem gerenciar funcionários, salas, planos e ver todos os atendimentos.
              Terapeutas veem apenas seus próprios atendimentos.
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
            <span className="text-sm text-slate-body">Funcionário ativo</span>
          </button>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/funcionarios')}
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
              {saving ? 'Salvando...' : 'Salvar funcionário'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
