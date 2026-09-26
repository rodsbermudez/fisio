import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, UserRound, ArrowLeft } from 'lucide-react';
import { maskCpfCnpj, maskPhone, onlyDigits } from '../../utils/masks';
import AdminLayout from '../../components/layout/AdminLayout';
import { createTenant, getTenant, updateTenant } from '../../services/admin';

export default function AdminClinicForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'clinic',
    document: '',
    email: '',
    phone: '',
    address: '',
    primary_color: '#0284C7',
    is_active: true,
    owner_name: '',
    owner_email: '',
    owner_password: '',
    owner_phone: '',
    owner_crm: '',
  });

  useEffect(() => {
    if (!isEditing) return;

    getTenant(id)
      .then((response) => {
        const tenant = response.data.tenant;
        const owner = tenant.users?.find((u) => u.role === 'owner');
        setFormData({
          name: tenant.name || '',
          type: tenant.type || 'clinic',
          document: maskCpfCnpj(tenant.document || ''),
          email: tenant.email || '',
          phone: maskPhone(tenant.phone || ''),
          address: tenant.address || '',
          primary_color: tenant.primary_color || '#0284C7',
          is_active: tenant.is_active ?? true,
          owner_name: owner?.name || '',
          owner_email: owner?.email || '',
          owner_password: '',
          owner_phone: maskPhone(owner?.phone || ''),
          owner_crm: owner?.crm || '',
        });
      })
      .catch((error) => {
        console.error('Erro ao carregar cliente:', error);
        setError('Erro ao carregar dados do cliente.');
      })
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDocumentChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      document: maskCpfCnpj(e.target.value),
    }));
  };

  const handlePhoneChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      phone: maskPhone(e.target.value),
    }));
  };

  const handleOwnerPhoneChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      owner_phone: maskPhone(e.target.value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
        const payload = {
        name: formData.name,
        type: formData.type,
        document: onlyDigits(formData.document) || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        primary_color: formData.primary_color || null,
        is_active: formData.is_active,
      };

      if (isEditing) {
        await updateTenant(id, payload);
      } else {
        await createTenant({ ...formData, ...payload });
      }
              navigate('/admin/clientes');
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao salvar cliente.';
      setError(message);
      console.error('Erro ao salvar cliente:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Clientes" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isEditing ? 'Editar cliente' : 'Novo cliente'}
      subtitle={isEditing ? 'Atualize os dados do cliente' : 'Crie um cliente e seu usuário owner'}
    >
      <div className="max-w-3xl">
        <Link
          to="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-muted hover:text-slate-dark mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para clientes
        </Link>

        <form onSubmit={handleSubmit} className="card p-8 space-y-8">
          {error && (
            <div className="p-4 bg-danger-light border border-danger-light rounded-lg">
              <p className="text-sm text-danger-text">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-semibold text-slate-dark">Dados do cliente</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-dark mb-1.5">Nome *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">Tipo *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="clinic">Clínica</option>
                  <option value="individual">Profissional autônomo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">CPF/CNPJ</label>
                <input
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  className="input-field"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="input-field"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-dark mb-1.5">Endereço</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-dark mb-1.5">Cor primária</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="primary_color"
                    value={formData.primary_color || '#0284C7'}
                    onChange={handleChange}
                    className="h-10 w-16 p-1 border border-slate-border rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-slate-body font-mono">{formData.primary_color || '#0284C7'}</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-slate-body">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-slate-border text-brand focus:ring-brand"
              />
              Cliente ativo
            </label>
          </div>

          {!isEditing && (
            <div className="space-y-4 pt-6 border-t border-slate-border">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-semibold text-slate-dark">Responsável *</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">Nome *</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">E-mail *</label>
                  <input
                    type="email"
                    name="owner_email"
                    value={formData.owner_email}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">Senha *</label>
                  <input
                    type="password"
                    name="owner_password"
                    value={formData.owner_password}
                    onChange={handleChange}
                    className="input-field"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">Telefone</label>
                  <input
                    type="text"
                    name="owner_phone"
                    value={formData.owner_phone}
                    onChange={handleOwnerPhoneChange}
                    className="input-field"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">CRM/Registro</label>
                  <input
                    type="text"
                    name="owner_crm"
                    value={formData.owner_crm}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-border">
            <Link
              to="/admin/clientes"
              className="px-4 py-2 text-slate-body hover:text-slate-dark font-medium transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
