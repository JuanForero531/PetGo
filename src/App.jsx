
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import RecoverPassword from './pages/RecoverPassword';
import ServiceList from './pages/ServiceList';
import ServiceForm from './pages/ServiceForm';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/servicios" element={<ServiceList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar" element={<RecoverPassword />} />

          <Route
            path="/proveedor/nuevo"
            element={(
              <ProtectedRoute roles={['proveedor']}>
                <ServiceForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/proveedor/editar/:id"
            element={(
              <ProtectedRoute roles={['proveedor']}>
                <ServiceForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/usuarios"
            element={(
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
