export const FIELD_TYPES = [
  { value: 'input', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista suspensa' },
  { value: 'radio', label: 'Opção única' },
  { value: 'checkbox', label: 'Múltiplas opções' },
  { value: 'toggle', label: 'Ligado/Desligado' },
];

export function getFieldTypeLabel(type) {
  return FIELD_TYPES.find((t) => t.value === type)?.label || type;
}

export function renderFieldPreview(field, index) {
  const baseClass = 'w-full px-3 py-2 border border-slate-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white';

  switch (field.type) {
    case 'textarea':
      return <textarea className={`${baseClass} min-h-[80px] resize-y`} placeholder="Resposta..." readOnly />;
    case 'number':
      return <input type="number" className={baseClass} placeholder="0" readOnly />;
    case 'select':
      return (
        <select className={baseClass} disabled>
          <option value="">Selecione...</option>
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-slate-body">
              <input type="radio" name={`radio-${index}`} disabled className="text-brand" />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-slate-body">
              <input type="checkbox" disabled className="rounded text-brand" />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'toggle':
      return (
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-border">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-1" />
          </span>
          <span className="text-sm text-slate-muted">Não / Sim</span>
        </div>
      );
    default:
      return <input type="text" className={baseClass} placeholder="Resposta..." readOnly />;
  }
}

export function renderFormPreview(fields) {
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={index} className="p-4 border border-slate-border rounded-lg bg-slate-50/30">
          <label className="block text-sm font-medium text-slate-dark mb-1">
            {field.label}
            {field.required && <span className="text-danger ml-1">*</span>}
          </label>
          {field.helper_text && (
            <p className="text-xs text-slate-muted mb-2">{field.helper_text}</p>
          )}
          {renderFieldPreview(field, index)}
        </div>
      ))}
    </div>
  );
}
