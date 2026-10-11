import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, FileText } from 'lucide-react';

export default function EvolutionNotesModal({
  isOpen,
  title,
  initialNotes,
  info,
  onSave,
  onClose,
  saving,
}) {
  const [notes, setNotes] = useState(initialNotes || '');

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-semibold text-slate-dark">
              {title || 'Evolução do atendimento'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-muted hover:text-slate-dark hover:bg-slate-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {info && <p className="text-sm text-slate-muted">{info}</p>}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field w-full min-h-[200px] resize-y"
            placeholder="Descreva o atendimento realizado, observações clínicas, evolução do paciente..."
          />
          <p className="text-xs text-slate-muted">
            Você pode deixar este campo em branco se preferir.
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-border bg-slate-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-slate-border text-slate-body hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(notes)}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

EvolutionNotesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  initialNotes: PropTypes.string,
  info: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

EvolutionNotesModal.defaultProps = {
  title: 'Evolução do atendimento',
  initialNotes: '',
  info: '',
  saving: false,
};
