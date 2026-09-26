import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    tenantType: 'individual',
    tenantName: '',
    tenantDocument: '',
    phone: '',
    crm: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
      const errors = err.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        setError(firstError || message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-dark">Criar conta</h1>
          <p className="text-slate-muted mt-2">
            Comece a usar a FisioFlow para gerenciar sua clínica
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-4 bg-danger-light border border-danger-light rounded-lg">
              <p className="text-sm text-danger-text">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pr-10"
                    required
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

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">
                  Confirmar senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="passwordConfirmation"
                  value={formData.passwordConfirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-border pt-5">
              <h3 className="text-sm font-semibold text-slate-dark mb-4">
                Dados da {formData.tenantType === 'clinic' ? 'clínica' : 'clínica / consultório'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-dark mb-2">
                    Tipo de conta
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tenantType"
                        value="individual"
                        checked={formData.tenantType === 'individual'}
                        onChange={handleChange}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-slate-body">Profissional autônomo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tenantType"
                        value="clinic"
                        checked={formData.tenantType === 'clinic'}
                        onChange={handleChange}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-slate-body">Clínica / consultório</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Nome {formData.tenantType === 'clinic' ? 'da clínica' : 'do consultório'}
                  </label>
                  <input
                    type="text"
                    name="tenantName"
                    value={formData.tenantName}
                    onChange={handleChange}
                    placeholder={formData.tenantType === 'clinic' ? 'Ex: Clínica Fisio Vida' : 'Ex: Consultório Dra. Ana Silva'}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    {formData.tenantType === 'clinic' ? 'CNPJ' : 'CPF/CNPJ'}
                  </label>
                  <input
                    type="text"
                    name="tenantDocument"
                    value={formData.tenantDocument}
                    onChange={handleChange}
                    placeholder={formData.tenantType === 'clinic' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Registro profissional (CREFITO)
                  </label>
                  <input
                    type="text"
                    name="crm"
                    value={formData.crm}
                    onChange={handleChange}
                    placeholder="Ex: CREFITO/SP 12345"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-muted">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-brand hover:text-brand-hover font-medium">
              Fazer login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-muted mt-6">
          © 2026 FisioFlow - Plataforma para Fisioterapeutas
        </p>
      </div>
    </div>
  );
}
