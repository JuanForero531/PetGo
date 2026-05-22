import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProviderProfile from '../src/pages/ProviderProfile';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseAuth = jest.fn();
const mockObtenerUsuario = jest.fn();
const mockObtenerServiciosDelProveedor = jest.fn();
const mockObtenerSolicitudesPorProveedor = jest.fn();
const mockResponderSolicitudServicio = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../src/firebase/firestore', () => ({
  obtenerUsuario: (...args) => mockObtenerUsuario(...args),
  obtenerServiciosDelProveedor: (...args) => mockObtenerServiciosDelProveedor(...args),
  obtenerSolicitudesPorProveedor: (...args) => mockObtenerSolicitudesPorProveedor(...args),
  responderSolicitudServicio: (...args) => mockResponderSolicitudServicio(...args),
}));

jest.mock('../src/components/Navbar', () => () => <div data-testid="navbar" />);
jest.mock('../src/components/Footer', () => () => <div data-testid="footer" />);
jest.mock('../src/components/ServiceCard', () => ({ servicio }) => (
  <div data-testid="service-card">{servicio.nombreNegocio}</div>
));

beforeEach(() => {
  mockNavigate.mockReset();
  mockUseParams.mockReset();
  mockUseAuth.mockReset();
  mockObtenerUsuario.mockReset();
  mockObtenerServiciosDelProveedor.mockReset();
  mockObtenerSolicitudesPorProveedor.mockReset();
  mockResponderSolicitudServicio.mockReset();
  mockUseParams.mockReturnValue({ id: 'prov-1' });
});

test('muestra el perfil del proveedor y gestiona solicitudes propias', async () => {
  mockUseAuth.mockReturnValue({ user: { uid: 'prov-1' }, perfil: { rol: 'proveedor' } });
  mockObtenerUsuario.mockResolvedValue({
    id: 'prov-1',
    rol: 'proveedor',
    nombre: 'Laura',
    apellido: 'Perez',
    nombreNegocio: 'Patitas',
    tipoServicio: 'Paseo',
    correo: 'laura@correo.com',
    telefono: '3001234567',
    direccion: 'Tunja',
    activo: true,
    esPremium: true,
  });
  mockObtenerServiciosDelProveedor.mockResolvedValue([
    { id: 'srv-1', nombreNegocio: 'Patitas', tipo: 'Paseo' },
    { id: 'srv-2', nombreNegocio: 'Peludos', tipo: 'Baño' },
  ]);
  mockObtenerSolicitudesPorProveedor.mockResolvedValue([
    {
      id: 'sol-1',
      estado: 'pendiente',
      servicioSnapshot: { nombreNegocio: 'Patitas', tipo: 'Paseo' },
      clienteSnapshot: { nombre: 'Juan', apellido: 'Lopez', telefono: '3111111' },
      canalContacto: 'WhatsApp',
      mensaje: 'Quiero agendar para mañana',
      createdAt: '2024-01-01',
    },
  ]);
  mockResponderSolicitudServicio.mockResolvedValue(undefined);

  render(<ProviderProfile />);

  expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();

  expect(await screen.findByText('Laura Perez')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Solicitudes de contratación' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Patitas' })).toBeInTheDocument();
  expect(screen.getAllByTestId('service-card')).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

  await waitFor(() => {
    expect(mockResponderSolicitudServicio).toHaveBeenCalledWith({
      solicitudId: 'sol-1',
      proveedorId: 'prov-1',
      estado: 'aceptada',
    });
  });
});

test('muestra error cuando el proveedor no existe', async () => {
  mockUseAuth.mockReturnValue({ user: { uid: 'prov-1' }, perfil: { rol: 'proveedor' } });
  mockObtenerUsuario.mockResolvedValue(null);

  render(<ProviderProfile />);

  expect(await screen.findByText('El proveedor no existe.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '← Volver al marketplace' }));
  expect(mockNavigate).toHaveBeenCalledWith('/servicios');
});