import { useNavigate } from 'react-router-dom';
import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ImpersonationBanner() {
  const { impersonatedTenant, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!impersonatedTenant) {
    return null;
  }

  const handleStop = async () => {
    await stopImpersonation();
    navigate('/admin');
  };

  return (
    <div className="bg-orange-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="w-4 h-4" />
        <span className="font-medium">
          Você está visualizando a clínica <strong>{impersonatedTenant.name}</strong> como owner.
        </span>
      </div>
      <button
        onClick={handleStop}
        className="flex items-center gap-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Voltar ao painel admin
      </button>
    </div>
  );
}
