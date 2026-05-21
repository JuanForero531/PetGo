import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'svc1' }),
  useNavigate: () => jest.fn(),
  NavLink: ({ children }) => require('react').createElement('a', null, children),
}));

jest.mock('../src/context/AuthContext', () => ({ useAuth: jest.fn() }));
const { useAuth } = require('../src/context/AuthContext');

jest.mock('../src/firebase/firestore', () => ({
  crearResenaServicio: jest.fn(),
  crearSolicitudServicio: jest.fn(),
  marcarSolicitudComoCompletada: jest.fn(),
  obtenerResumenResenasDelServicio: jest.fn(),
  obtenerServicio: jest.fn(),
  obtenerSolicitudesPorCliente: jest.fn(),
  obtenerUsuario: jest.fn(),
}));

const firestore = require('../src/firebase/firestore');
jest.mock('../src/firebase/config', () => ({ auth: {}, db: {} }));
const ServiceDetail = require('../src/pages/ServiceDetail').default;

describe('ServiceDetail branches', () => {
  afterEach(() => jest.clearAllMocks());

  test('shows unavailable message when service missing', async () => {
    useAuth.mockReturnValue({ user: null, perfil: null });
    firestore.obtenerServicio.mockResolvedValueOnce(null);

    render(React.createElement(ServiceDetail));
    await waitFor(() => expect(screen.getByText(/El servicio no está disponible/i)).toBeInTheDocument());
  });

  test('shows login prompt when not logged in', async () => {
    useAuth.mockReturnValue({ user: null, perfil: null });
    firestore.obtenerServicio.mockResolvedValueOnce({ id: 'svc1', activo: true, nombreNegocio: 'N', tipo: 'T', descripcion: 'D', precio: 100, proveedorId: 'p1', proveedorSnapshot: { nombre: 'P', correo: 'p@p.com' } });
    firestore.obtenerResumenResenasDelServicio.mockResolvedValueOnce({ total: 0, promedio: 0, resenas: [] });
    firestore.obtenerSolicitudesPorCliente.mockResolvedValueOnce([]);

    render(React.createElement(ServiceDetail));
    await waitFor(() => expect(screen.getByText(/Inicia sesión para solicitar la contratación/i)).toBeInTheDocument());
  });

  test('can submit request when logged in', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' }, perfil: { nombre: 'User' } });
    firestore.obtenerServicio.mockResolvedValueOnce({ id: 'svc1', activo: true, nombreNegocio: 'N', tipo: 'T', descripcion: 'D', precio: 150, proveedorId: 'p2', proveedorSnapshot: { nombre: 'P' } });
    firestore.obtenerResumenResenasDelServicio.mockResolvedValueOnce({ total: 0, promedio: 0, resenas: [] });
    firestore.obtenerSolicitudesPorCliente.mockResolvedValueOnce([]);
    firestore.crearSolicitudServicio.mockResolvedValueOnce('req1');

    render(React.createElement(ServiceDetail));
    // wait for form to appear
    await waitFor(() => expect(screen.getByText(/Mensaje para el proveedor/i)).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/Cuéntale al proveedor/i);
    await userEvent.type(textarea, 'Necesito el servicio el lunes');
    const input = screen.getByPlaceholderText(/WhatsApp, llamada o correo/i);
    await userEvent.type(input, 'WhatsApp');

    const btn = screen.getByText('Confirmar contratación');
    await userEvent.click(btn);

    await waitFor(() => expect(firestore.crearSolicitudServicio).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Solicitud enviada/i)).toBeInTheDocument());
  });
});
