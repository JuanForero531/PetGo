
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import RecoverPassword from './pages/RecoverPassword';
import ServiceList from './pages/ServiceList';
import ServiceDetail from './pages/ServiceDetail';
import ServiceForm from './pages/ServiceForm';
import ProviderProfile from './pages/ProviderProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminServices from './pages/AdminServices';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/servicios" element={<ServiceList />} />
          <Route path="/servicios/:id" element={<ServiceDetail />} />
          <Route path="/proveedor/:id" element={<ProviderProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar" element={<RecoverPassword />} />

          <Route
            path="/proveedor/nuevo"
            element={(
              <ProtectedRoute roles={['proveedor']} unauthorizedTo="/servicios">
                <ServiceForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/proveedor/editar/:id"
            element={(
              <ProtectedRoute roles={['proveedor']} unauthorizedTo="/servicios">
                <ServiceForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute roles={['admin']} unauthorizedTo="/servicios">
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/usuarios"
            element={(
              <ProtectedRoute roles={['admin']} unauthorizedTo="/servicios">
                <AdminUsers />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/servicios"
            element={(
              <ProtectedRoute roles={['admin']} unauthorizedTo="/servicios">
                <AdminServices />
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
