import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles = [], children }) {
  const { user, perfil, loading } = useAuth();

  if (loading) {
    return <div />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(perfil?.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
