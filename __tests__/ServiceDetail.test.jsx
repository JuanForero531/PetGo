import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Navbar to avoid importing firebase/auth and config during tests
jest.mock('../src/components/Navbar.jsx', () => () => <div />);

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: 'svc1' }),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null, perfil: null }),
}));

jest.mock('../src/firebase/firestore', () => ({
  obtenerServicio: jest.fn().mockResolvedValue({ id: 'svc1', activo: true, tipo: 'Baño', nombreNegocio: 'Neg', descripcion: 'Desc', precio: 10000, direccion: 'Dir', proveedorId: 'p1', proveedorSnapshot: { nombre: 'P', apellido: 'A', correo: 'p@p.com', telefono: '123' } }),
  obtenerSolicitudesPorCliente: jest.fn().mockResolvedValue([]),
  obtenerResumenResenasDelServicio: jest.fn().mockResolvedValue({ total: 0, promedio: 0, resenas: [] }),
  obtenerUsuario: jest.fn().mockResolvedValue({ id: 'p1', nombre: 'P', apellido: 'A', correo: 'p@p.com', telefono: '123' }),
  crearSolicitudServicio: jest.fn().mockResolvedValue('req1'),
  marcarSolicitudComoCompletada: jest.fn(),
  crearResenaServicio: jest.fn(),
}));

// Import after mocks
const ServiceDetail = require('../src/pages/ServiceDetail').default;

describe('ServiceDetail page', () => {
  test('shows login CTA when no user', async () => {
    render(<ServiceDetail />);
    await waitFor(() => expect(screen.getByText('Solicita el servicio y contacta al proveedor')).toBeInTheDocument());
    expect(screen.getByText('Inicia sesión para solicitar la contratación.')).toBeInTheDocument();
  });
});
