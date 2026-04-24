import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles = [], children, unauthorizedTo = '/servicios' }) {
  const { user, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: '#2f2115',
          fontFamily: 'DM Sans, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div>
          <strong style={{ display: 'block', marginBottom: '8px' }}>Cargando sesión...</strong>
          <span>Validando acceso al panel.</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && (!perfil || !roles.includes(perfil.rol))) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return children;
}
