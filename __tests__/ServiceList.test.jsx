import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ServiceList from '../src/pages/ServiceList';

const mockObtenerServiciosConProveedor = jest.fn();
const mockObtenerResumenResenasDelServicio = jest.fn();

jest.mock('../src/firebase/firestore', () => ({
  obtenerServiciosConProveedor: () => mockObtenerServiciosConProveedor(),
  obtenerResumenResenasDelServicio: (...args) => mockObtenerResumenResenasDelServicio(...args),
}));

jest.mock('../src/components/Navbar', () => () => <div data-testid="navbar" />);
jest.mock('../src/components/Footer', () => () => <div data-testid="footer" />);
jest.mock('../src/components/ServiceCard', () => ({ servicio, puntuacion }) => (
  <div data-testid="service-card">
    {servicio.nombreNegocio} - {servicio.tipo} - {puntuacion?.promedio ?? 0}
  </div>
));

beforeEach(() => {
  mockObtenerServiciosConProveedor.mockReset();
  mockObtenerResumenResenasDelServicio.mockReset();
});

test('carga servicios, filtra por tipo y busca por texto', async () => {
  mockObtenerServiciosConProveedor.mockResolvedValue([
    {
      id: 'srv-1',
      nombreNegocio: 'Caninos Tunja',
      tipo: 'Baño',
      descripcion: 'Baño premium',
      direccion: 'Centro',
      precio: 50000,
      activo: true,
      proveedor: { esPremium: true },
    },
    {
      id: 'srv-2',
      nombreNegocio: 'Paseos Felices',
      tipo: 'Paseo',
      descripcion: 'Paseo diario',
      direccion: 'Norte',
      precio: 30000,
      activo: true,
      proveedor: { esPremium: false },
    },
    {
      id: 'srv-3',
      nombreNegocio: 'Oculto',
      tipo: 'Guarderia',
      descripcion: 'No debe mostrarse',
      direccion: 'Sur',
      precio: 20000,
      activo: false,
      proveedor: { esPremium: false },
    },
  ]);

  mockObtenerResumenResenasDelServicio.mockImplementation(async (id) => ({
    promedio: id === 'srv-1' ? 4.8 : 4.2,
    total: id === 'srv-1' ? 12 : 3,
  }));

  render(<ServiceList />);

  expect(screen.getByText('Cargando servicios...')).toBeInTheDocument();

  expect(await screen.findAllByText('Caninos Tunja - Baño - 4.8')).toHaveLength(2);
  expect(screen.getAllByText('Paseos Felices - Paseo - 4.2')).toHaveLength(2);
  expect(screen.queryByText('Oculto - Guarderia - 0')).not.toBeInTheDocument();

  expect(screen.getAllByTestId('service-card')).toHaveLength(4);

  fireEvent.change(screen.getByPlaceholderText('Negocio, servicio o zona'), {
    target: { value: 'sin coincidencia' },
  });

  await waitFor(() => {
    expect(screen.queryAllByTestId('service-card')).toHaveLength(0);
  });

  expect(screen.getByText('No hay servicios disponibles.')).toBeInTheDocument();
});

test('muestra error cuando no se pueden cargar los servicios', async () => {
  mockObtenerServiciosConProveedor.mockRejectedValue(new Error('fallo'));

  render(<ServiceList />);

  expect(await screen.findByText('No se pudieron cargar los servicios en este momento.')).toBeInTheDocument();
});