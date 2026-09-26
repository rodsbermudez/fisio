export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-surface text-slate-body border-slate-border',
    success: 'bg-success-light text-success-text border-success-light',
    warning: 'bg-warning-light text-warning-text border-warning-light',
    danger: 'bg-danger-light text-danger-text border-danger-light',
    info: 'bg-brand-light text-brand border-brand-light',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
}
