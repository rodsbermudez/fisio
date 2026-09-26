import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function GuestRoute({ children }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();
  const defaultFrom = isAdmin ? '/admin' : '/';
  const from = location.state?.from?.pathname || defaultFrom;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return children;
}
