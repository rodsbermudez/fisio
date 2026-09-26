import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-border flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-dark">{title}</h2>
        {subtitle && <p className="text-sm text-slate-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-muted hover:text-slate-body hover:bg-slate-surface rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-border">
          <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center">
            <User className="w-5 h-5 text-brand" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-dark">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-slate-muted capitalize">{user?.role || 'Fisioterapeuta'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-slate-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
