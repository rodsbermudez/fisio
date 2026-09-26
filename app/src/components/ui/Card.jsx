export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-border shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}
