export default function StatCard({ title, value, trend, trendUp, icon: Icon, color = 'brand' }) {
  const colorClasses = {
    brand: 'bg-brand-light text-brand',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    danger: 'bg-danger-light text-danger',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-border shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-muted">{title}</p>
          <p className="text-2xl font-bold text-slate-dark mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-success' : 'text-danger'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
