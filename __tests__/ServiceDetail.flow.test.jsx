const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

jest.mock('../src/components/Navbar.jsx', () => () => null);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useParams: () => ({ id: 'svc1' }) }));

jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'c1' }, perfil: { nombre: 'C' } }) }));

jest.mock('../src/firebase/firestore', () => ({
  obtenerServicio: jest.fn().mockResolvedValue({ id: 'svc1', proveedorId: 'p1', nombreNegocio: 'Neg', tipo: 'Baño', nombre: 'N' }),
  obtenerSolicitudesPorCliente: jest.fn().mockResolvedValue([]),
  obtenerResumenResenasDelServicio: jest.fn().mockResolvedValue({ total: 0, promedio: 0, resenas: [] }),
  obtenerUsuario: jest.fn().mockResolvedValue({ id: 'p1', nombre: 'P' }),
  crearSolicitudServicio: jest.fn().mockResolvedValue('req1'),
  marcarSolicitudComoCompletada: jest.fn().mockResolvedValue(true),
}));

const ServiceDetail = require('../src/pages/ServiceDetail').default;

describe('ServiceDetail flows', () => {
  beforeEach(() => jest.clearAllMocks());

  test('user can create a solicitud and see success message', async () => {
    render(React.createElement(ServiceDetail));

    // wait for form to appear
    await waitFor(() => expect(screen.getByPlaceholderText('Cuéntale al proveedor qué necesitas, fecha tentativa y detalles del servicio.')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Cuéntale al proveedor qué necesitas, fecha tentativa y detalles del servicio.'), { target: { value: 'Necesito un baño el viernes' } });
    fireEvent.change(screen.getByPlaceholderText('WhatsApp, llamada o correo'), { target: { value: 'WhatsApp' } });

    fireEvent.click(screen.getByText('Confirmar contratación'));

    await waitFor(() => expect(screen.getByText(/Solicitud enviada/)).toBeInTheDocument());
  });

  test('user can mark accepted solicitud as completada', async () => {
    const firestore = require('../src/firebase/firestore');
    // initial fetch: return accepted solicitud
    firestore.obtenerSolicitudesPorCliente.mockResolvedValueOnce([{ id: 'req1', servicioId: 'svc1', estado: 'aceptada' }]);
    render(React.createElement(ServiceDetail));

    await waitFor(() => expect(screen.getByText('Marcar como completado')).toBeInTheDocument());

    // after marking, obtenerSolicitudesPorCliente will return completed
    firestore.marcarSolicitudComoCompletada.mockResolvedValueOnce(true);
    firestore.obtenerSolicitudesPorCliente.mockResolvedValueOnce([{ id: 'req1', servicioId: 'svc1', estado: 'completada' }]);

    fireEvent.click(screen.getByText('Marcar como completado'));

    await waitFor(() => expect(screen.getByText(/Contratación confirmada/)).toBeInTheDocument());
  });
});
