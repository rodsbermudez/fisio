import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getPatient, createPatient, updatePatient } from '../services/patients';
import { maskPhone, maskCpf, maskCep, maskDate, dateToIso, dateToBr } from '../utils/masks';
import { BRAZILIAN_STATES } from '../utils/states';

export default function PatientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birth_date: '',
    profession: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    zip_code: '',
    city: '',
    state: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    is_active: true,
  });

  useEffect(() => {
    if (isEditing) {
      const fetchPatient = async () => {
        try {
          const response = await getPatient(id);
          const patient = response.data.patient;
          setFormData({
            name: patient.name || '',
            cpf: maskCpf(patient.cpf || ''),
            birth_date: dateToBr(patient.birth_date),
            profession: patient.profession || '',
            phone: maskPhone(patient.phone || ''),
            email: patient.email || '',
            street: patient.street || '',
            number: patient.number || '',
            neighborhood: patient.neighborhood || '',
            complement: patient.complement || '',
            zip_code: maskCep(patient.zip_code || ''),
            city: patient.city || '',
            state: patient.state || '',
            emergency_contact_name: patient.emergency_contact_name || '',
            emergency_contact_phone: maskPhone(patient.emergency_contact_phone || ''),
            is_active: patient.is_active,
          });
        } catch (err) {
          setError('Erro ao carregar paciente.');
        }
      };
      fetchPatient();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMaskChange = (name, maskFn) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [name]: maskFn(e.target.value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''),
      zip_code: formData.zip_code.replace(/\D/g, ''),
      phone: formData.phone.replace(/\D/g, ''),
      emergency_contact_phone: formData.emergency_contact_phone.replace(/\D/g, ''),
      birth_date: dateToIso(formData.birth_date),
    };

    try {
      if (isEditing) {
        await updatePatient(id, payload);
      } else {
        await createPatient(payload);
      }
      navigate('/pacientes');
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao salvar paciente.';
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
    <Layout
      title={isEditing ? 'Editar Paciente' : 'Novo Paciente'}
      subtitle={isEditing ? 'Atualize os dados cadastrais' : 'Cadastre um novo paciente'}
    >
      <div className="max-w-3xl">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-2 text-slate-muted hover:text-slate-body mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Pacientes
        </Link>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-4 bg-danger-light border border-danger-light rounded-lg">
              <p className="text-sm text-danger-text">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <h3 className="text-sm font-semibold text-slate-dark mb-4 uppercase tracking-wide">
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Nome completo *
                  </label>
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
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    CPF *
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleMaskChange('cpf', maskCpf)}
                    placeholder="000.000.000-00"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Data de nascimento
                  </label>
                  <input
                    type="text"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleMaskChange('birth_date', maskDate)}
                    placeholder="dd/mm/aaaa"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Profissão
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
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
                    onChange={handleMaskChange('phone', maskPhone)}
                    placeholder="(00) 00000-0000"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-border pt-6">
              <h3 className="text-sm font-semibold text-slate-dark mb-4 uppercase tracking-wide">
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Rua / Logradouro
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Número
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                    placeholder="Apto, bloco, etc."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleMaskChange('zip_code', maskCep)}
                    placeholder="00000-000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Estado (UF)
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state.uf} value={state.uf}>
                        {state.uf} — {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-border pt-6">
              <h3 className="text-sm font-semibold text-slate-dark mb-4 uppercase tracking-wide">
                Contato de Emergência
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Nome do contato
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-dark mb-1.5">
                    Telefone do contato
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleMaskChange('emergency_contact_phone', maskPhone)}
                    placeholder="(00) 00000-0000"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-border">
              {isEditing && (
                <label className="flex items-center gap-2 mr-auto text-slate-body cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-slate-border text-brand focus:ring-brand"
                  />
                  Paciente ativa
                </label>
              )}
              <Link
                to="/pacientes"
                className="px-4 py-2 border border-slate-border rounded-lg text-slate-body hover:bg-slate-surface transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
