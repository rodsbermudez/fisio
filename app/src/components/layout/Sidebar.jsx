import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  LogOut,
  ClipboardList,
  Tag,
  DoorOpen,
  Wallet,
  CalendarDays,
  UserCog,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const baseMenuItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda', icon: CalendarDays, label: 'Agenda' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/modelos', icon: ClipboardList, label: 'Ficha de Avaliação' },
  { to: '/tipos-atendimento', icon: Tag, label: 'Tipos de Atendimento' },
  { to: '/salas', icon: DoorOpen, label: 'Salas' },
  { to: '/planos', icon: Wallet, label: 'Planos' },
  { to: '/docs', icon: BookOpen, label: 'Documentação' },
];

export default function Sidebar() {
  const { user, logout, isImpersonating } = useAuth();
  const isOwner = user?.role === 'owner';
  const isIndividual = user?.tenant?.type === 'individual';

  const menuItems = isOwner
    ? [
        ...baseMenuItems.slice(0, 3),
        ...(isIndividual
          ? [{ to: `/funcionarios/${user.id}/editar`, icon: UserCog, label: 'Meus dados' }]
          : [{ to: '/funcionarios', icon: UserCog, label: 'Funcionários' }]),
        ...baseMenuItems.slice(3),
      ]
    : baseMenuItems;

  return (
    <aside className="w-64 min-h-screen bg-slate-dark text-white flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Fisio</h1>
          <p className="text-xs text-slate-muted">Gestão Clínica</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
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
          {isImpersonating ? (
            <>
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar ao admin</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
