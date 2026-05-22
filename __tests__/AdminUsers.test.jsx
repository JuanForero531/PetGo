import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminUsers from '../src/pages/AdminUsers';

const mockNavigate = jest.fn();
const mockObtenerTodosLosUsuarios = jest.fn();
const mockObtenerServicios = jest.fn();
const mockDesactivarUsuario = jest.fn();
const mockActivarUsuario = jest.fn();
const mockActualizarRolUsuario = jest.fn();
const mockActualizarPremiumUsuario = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../src/firebase/firestore', () => ({
  obtenerTodosLosUsuarios: () => mockObtenerTodosLosUsuarios(),
  obtenerServicios: () => mockObtenerServicios(),
  desactivarUsuario: (...args) => mockDesactivarUsuario(...args),
  activarUsuario: (...args) => mockActivarUsuario(...args),
  actualizarRolUsuario: (...args) => mockActualizarRolUsuario(...args),
  actualizarPremiumUsuario: (...args) => mockActualizarPremiumUsuario(...args),
}));

beforeEach(() => {
  mockNavigate.mockReset();
  mockObtenerTodosLosUsuarios.mockReset();
  mockObtenerServicios.mockReset();
  mockDesactivarUsuario.mockReset();
  mockActivarUsuario.mockReset();
  mockActualizarRolUsuario.mockReset();
  mockActualizarPremiumUsuario.mockReset();
  window.confirm = jest.fn(() => true);
  window.history.pushState({}, '', '/admin/usuarios');
});

test('muestra usuarios y ejecuta acciones principales de administración', async () => {
  mockObtenerTodosLosUsuarios.mockResolvedValue([
    {
      id: 'u-1',
      nombre: 'Ana',
      apellido: 'Lopez',
      correo: 'ana@correo.com',
      rol: 'proveedor',
      activo: true,
      esPremium: false,
    },
    {
      id: 'u-2',
      nombre: 'Luis',
      apellido: 'Perez',
      correo: 'luis@correo.com',
      rol: 'usuario',
      activo: false,
      esPremium: false,
    },
  ]);
  mockObtenerServicios.mockResolvedValue([{ id: 'srv-1', proveedorId: 'u-1' }]);
  mockActualizarRolUsuario.mockResolvedValue(undefined);
  mockActualizarPremiumUsuario.mockResolvedValue(undefined);
  mockDesactivarUsuario.mockResolvedValue(undefined);
  mockActivarUsuario.mockResolvedValue(undefined);

  render(<AdminUsers />);

  expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();

  expect(await screen.findByText('Ana Lopez')).toBeInTheDocument();
  expect(screen.getByText('Luis Perez')).toBeInTheDocument();

  const providerRow = screen.getByText('Ana Lopez').closest('tr');
  const providerActions = within(providerRow);

  fireEvent.click(providerActions.getByRole('button', { name: 'Rol' }));
  expect(screen.getByText('Cambiar rol de usuario')).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Usuario regular'));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  await waitFor(() => {
    expect(mockActualizarRolUsuario).toHaveBeenCalledWith('u-1', 'usuario');
  });

  fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
  fireEvent.click(screen.getByRole('button', { name: '¿Estás seguro?' }));

  await waitFor(() => {
    expect(mockDesactivarUsuario).toHaveBeenCalledWith('u-1');
  });

  const inactiveRow = screen.getByText('Luis Perez').closest('tr');
  const inactiveActions = within(inactiveRow);
  fireEvent.click(inactiveActions.getByRole('button', { name: 'Activar' }));

  await waitFor(() => {
    expect(mockActivarUsuario).toHaveBeenCalledWith('u-2');
  });
});

test('muestra error al cargar usuarios', async () => {
  mockObtenerTodosLosUsuarios.mockRejectedValue(new Error('fallo'));
  mockObtenerServicios.mockResolvedValue([]);

  render(<AdminUsers />);

  expect(await screen.findByText('No se pudieron cargar los usuarios.')).toBeInTheDocument();
});