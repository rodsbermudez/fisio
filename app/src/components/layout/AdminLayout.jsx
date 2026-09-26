import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';

const adminMenuItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
];

export default function AdminLayout({ children, title, subtitle }) {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-surface">
      <aside className="w-64 min-h-screen bg-slate-dark text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Fisio</h1>
            <p className="text-xs text-slate-muted">Admin</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1">
            {adminMenuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-brand text-white'
                        : 'text-slate-muted hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
