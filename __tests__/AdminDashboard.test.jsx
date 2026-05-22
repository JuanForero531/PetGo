import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../src/pages/AdminDashboard';

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();
const mockObtenerMetricasAdmin = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../src/firebase/firestore', () => ({
  obtenerMetricasAdmin: () => mockObtenerMetricasAdmin(),
}));

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  mockNavigate.mockReset();
  mockUseAuth.mockReset();
  mockObtenerMetricasAdmin.mockReset();
  mockUseAuth.mockReturnValue({ perfil: { nombre: 'Ana' } });
});

test('muestra métricas, busca secciones y resalta coincidencias', async () => {
  mockObtenerMetricasAdmin.mockResolvedValue({
    totalUsuarios: 10,
    usuariosActivos: 8,
    usuariosInactivos: 2,
    totalProveedores: 3,
    totalProveedoresPremium: 1,
    totalAdmins: 1,
    serviciosActivos: 5,
    serviciosInactivos: 0,
    tiposMasUsados: [{ tipo: 'Baño', cantidad: 4 }],
  });

  render(<AdminDashboard />);

  expect(screen.getByText('Cargando metricas...')).toBeInTheDocument();

  expect(await screen.findByText('Usuarios totales')).toBeInTheDocument();
  expect(screen.getByText('10')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Buscar seccion del panel...'), {
    target: { value: 'composicion' },
  });

  await waitFor(() => {
    expect(screen.getByDisplayValue('composicion')).toBeInTheDocument();
  });
  expect(screen.getByRole('heading', { name: /Composicion de usuarios/i })).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Buscar seccion del panel...'), {
    target: { value: 'sin coincidencia' },
  });

  await waitFor(() => {
    expect(screen.getByText('No hay coincidencias en el panel para esa busqueda.')).toBeInTheDocument();
  });
});

test('muestra error cuando falla la carga de métricas', async () => {
  mockObtenerMetricasAdmin.mockRejectedValue(new Error('fallo'));

  render(<AdminDashboard />);

  expect(await screen.findByText('No se pudieron cargar las métricas del panel.')).toBeInTheDocument();
});