import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { createTemplate, getTemplate, updateTemplate } from '../services/templates';
import { FIELD_TYPES, renderFormPreview } from '../utils/templateFields';

const EMPTY_FIELD = {
  label: '',
  type: 'input',
  options: [],
  required: false,
  helper_text: '',
};

export default function TemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const fetchTemplate = async () => {
      try {
        const response = await getTemplate(id);
        const template = response.data.template;
        setTitle(template.title);
        setDescription(template.description || '');
        setIsActive(template.is_active);
        setFields(
          template.fields.map((field) => ({
            ...field,
            options: field.options || [],
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar modelo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, isEditing]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setFields(items);
    if (selectedIndex === result.source.index) {
      setSelectedIndex(result.destination.index);
    }
  };

  const addField = (type = 'input') => {
    const newField = { ...EMPTY_FIELD, type, label: getDefaultLabel(type) };
    setFields([...fields, newField]);
    setSelectedIndex(fields.length);
  };

  const getDefaultLabel = (type) => {
    const found = FIELD_TYPES.find((t) => t.value === type);
    return found ? found.label : 'Novo campo';
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const removeField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex > index) setSelectedIndex(selectedIndex - 1);
  };

  const addOption = (fieldIndex) => {
    const updated = [...fields];
    updated[fieldIndex].options = [...(updated[fieldIndex].options || []), 'Nova opção'];
    setFields(updated);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const updated = [...fields];
    updated[fieldIndex].options[optionIndex] = value;
    setFields(updated);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const updated = [...fields];
    updated[fieldIndex].options = updated[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Informe o título do modelo.');
      return;
    }

    if (fields.length === 0) {
      alert('Adicione pelo menos um campo.');
      return;
    }

    const invalidField = fields.find((f) => !f.label.trim());
    if (invalidField) {
      alert('Todos os campos precisam de um rótulo.');
      return;
    }

    setSaving(true);

    const payload = {
      title,
      description,
      is_active: isActive,
      fields: fields.map((field) => ({
        label: field.label,
        type: field.type,
        options: ['select', 'radio', 'checkbox'].includes(field.type) ? field.options : null,
        required: field.required,
        helper_text: field.helper_text,
      })),
    };

    try {
      if (isEditing) {
        await updateTemplate(id, payload);
      } else {
        await createTemplate(payload);
      }
      navigate('/modelos');
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      alert('Erro ao salvar modelo. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Carregando...">
        <div className="text-center py-12 text-slate-muted">Carregando modelo...</div>
      </Layout>
    );
  }

  const Toggle = ({ checked, onChange, label }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-slate-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      {label && <span className="text-sm text-slate-body">{label}</span>}
    </button>
  );

  return (
    <Layout
      title={isEditing ? 'Editar Modelo' : 'Novo Modelo'}
      subtitle={isEditing ? 'Altere a estrutura da ficha' : 'Monte uma ficha de avaliação'}
    >
      <form onSubmit={handleSubmit}>
        {/* Informações gerais - largura total */}
        <div className="card p-6 space-y-4 mb-6">
          <div>
            <label className="label-base">Título do modelo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Avaliação Inicial"
            />
          </div>

          <div>
            <label className="label-base">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full min-h-[80px] resize-y"
              placeholder="Ex: Ficha aplicada no primeiro atendimento"
            />
          </div>

          <Toggle
            checked={isActive}
            onChange={setIsActive}
            label="Modelo ativo"
          />
        </div>

        {/* Campos + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-dark">Campos ({fields.length})</h3>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-sm flex items-center gap-2 text-slate-muted hover:text-brand"
                >
                  {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {previewMode ? 'Editar' : 'Pré-visualizar'}
                </button>
              </div>

              {previewMode ? (
                <div className="p-4 border border-slate-border rounded-lg bg-white">
                  <h4 className="text-sm font-semibold text-slate-dark mb-4">Pré-visualização da ficha</h4>
                  {renderFormPreview(fields)}
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {fields.map((field, index) => (
                          <Draggable key={index} draggableId={`field-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`border rounded-lg p-4 transition-colors ${
                                  selectedIndex === index
                                    ? 'border-brand bg-brand-light/30'
                                    : 'border-slate-border bg-white hover:border-brand/50'
                                } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                onClick={() => setSelectedIndex(index)}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 text-slate-muted cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium text-slate-dark truncate">
                                        {field.label || 'Campo sem rótulo'}
                                      </p>
                                      <span className="text-xs text-slate-muted uppercase">
                                        {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                                      </span>
                                    </div>
                                    {field.helper_text && (
                                      <p className="text-xs text-slate-muted truncate">{field.helper_text}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeField(index);
                                    }}
                                    className="p-1.5 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              <div className="mt-4 pt-4 border-t border-slate-border">
                <p className="text-xs text-slate-muted mb-2">Adicionar campo</p>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => addField(type.value)}
                      className="px-3 py-1.5 text-sm border border-slate-border rounded-md text-slate-body hover:border-brand hover:text-brand hover:bg-brand-light transition-colors"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar editor */}
          {!previewMode && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="card p-5 sticky top-6">
                {selectedIndex === null || !fields[selectedIndex] ? (
                  <div className="text-center py-8 text-slate-muted">
                    <p className="text-sm">Selecione um campo para editar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-dark">Editar campo</h3>

                    <div>
                      <label className="label-base">Rótulo</label>
                      <input
                        type="text"
                        value={fields[selectedIndex].label}
                        onChange={(e) => updateField(selectedIndex, 'label', e.target.value)}
                        className="input-field w-full"
                        placeholder="Ex: Tem asma?"
                      />
                    </div>

                    <div>
                      <label className="label-base">Tipo de campo</label>
                      <select
                        value={fields[selectedIndex].type}
                        onChange={(e) => updateField(selectedIndex, 'type', e.target.value)}
                        className="input-field w-full"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {['select', 'radio', 'checkbox'].includes(fields[selectedIndex].type) && (
                      <div>
                        <label className="label-base">Opções</label>
                        <div className="space-y-2">
                          {(fields[selectedIndex].options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(selectedIndex, optionIndex, e.target.value)}
                                className="input-field flex-1 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(selectedIndex, optionIndex)}
                                className="p-1.5 text-slate-muted hover:text-danger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(selectedIndex)}
                            className="text-sm text-brand hover:underline"
                          >
                            + Adicionar opção
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="label-base">Texto de ajuda</label>
                      <input
                        type="text"
                        value={fields[selectedIndex].helper_text || ''}
                        onChange={(e) => updateField(selectedIndex, 'helper_text', e.target.value)}
                        className="input-field w-full"
                        placeholder="Ex: Informe sim ou não"
                      />
                    </div>

                    <Toggle
                      checked={fields[selectedIndex].required}
                      onChange={(value) => updateField(selectedIndex, 'required', value)}
                      label="Campo obrigatório"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/modelos')}
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
            {saving ? 'Salvando...' : 'Salvar modelo'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
