import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, DoorOpen, Wallet, ClipboardList, CheckCircle2, Circle, X } from 'lucide-react';

const STORAGE_KEY = 'fisio_onboarding_dismissed';

export default function OnboardingChecklist({ onboarding }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const steps = useMemo(() => [
    {
      key: 'has_service_types',
      label: 'Cadastrar tipos de atendimento',
      to: '/tipos-atendimento',
      icon: Tag,
    },
    {
      key: 'has_rooms',
      label: 'Cadastrar salas',
      to: '/salas',
      icon: DoorOpen,
    },
    {
      key: 'has_plans',
      label: 'Cadastrar planos',
      to: '/planos',
      icon: Wallet,
    },
    {
      key: 'has_templates',
      label: 'Criar modelo de ficha de avaliação',
      to: '/modelos',
      icon: ClipboardList,
      optional: true,
    },
  ], []);

  const allStepsDone = useMemo(() => {
    if (!onboarding) return false;
    return steps.every((step) => onboarding[step.key]);
  }, [onboarding, steps]);

  useEffect(() => {
    if (allStepsDone && !dismissed) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
      setDismissed(true);
    }
  }, [allStepsDone, dismissed]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (dismissed || !onboarding) {
    return null;
  }

  const completedCount = steps.filter((step) => onboarding[step.key]).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="card p-6 mb-8 relative">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 text-slate-muted hover:text-slate-dark hover:bg-slate-surface rounded-lg transition-colors"
        title="Dispensar checklist"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-dark">
          Bem-vindo! Complete esses passos para começar
        </h2>
        <p className="text-sm text-slate-muted mt-1">
          Siga a ordem sugerida para configurar sua clínica antes de cadastrar pacientes.
        </p>
      </div>

      <div className="w-full bg-slate-surface rounded-full h-2 mb-6">
        <div
          className="bg-brand h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const done = onboarding[step.key];
          const Icon = step.icon;
          return (
            <Link
              key={step.key}
              to={step.to}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                done
                  ? 'bg-success-light border-success-light'
                  : 'bg-white border-slate-border hover:border-brand hover:bg-brand-light'
              }`}
            >
              <div className={`mt-0.5 ${done ? 'text-success' : 'text-slate-muted'}`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${done ? 'text-success-text' : 'text-slate-dark'}`}>
                  {step.label}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Icon className={`w-3.5 h-3.5 ${done ? 'text-success' : 'text-slate-muted'}`} />
                  <span className={`text-xs ${done ? 'text-success' : 'text-slate-muted'}`}>
                    {done ? 'Concluído' : 'Pendente'}
                  </span>
                </div>
                {step.optional && (
                  <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wide font-medium text-slate-muted bg-slate-surface px-2 py-0.5 rounded">
                    Opcional
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
