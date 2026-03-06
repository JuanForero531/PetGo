import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/registro" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Redirección por defecto a registro, puedes cambiar a /login si prefieres */}
        <Route path="*" element={<Navigate to="/registro" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
