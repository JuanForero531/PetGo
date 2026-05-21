import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('react-router-dom', () => ({
  NavLink: ({ children }) => require('react').createElement('a', null, children),
  useNavigate: () => jest.fn(),
}));

jest.mock('../src/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../src/firebase/auth', () => ({ cerrarSesion: jest.fn() }));

const { useAuth } = require('../src/context/AuthContext');
const { cerrarSesion } = require('../src/firebase/auth');
const Navbar = require('../src/components/Navbar').default;

describe('Navbar branches', () => {
  afterEach(() => jest.clearAllMocks());

  test('shows login/register when no user', () => {
    useAuth.mockReturnValue({ user: null, perfil: null });
    render(React.createElement(Navbar));
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getByText('Registro')).toBeInTheDocument();
  });

  test('shows provider buttons and logout when proveedor premium', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' }, perfil: { rol: 'proveedor', esPremium: true } });
    cerrarSesion.mockResolvedValueOnce();
    render(React.createElement(Navbar));

    expect(screen.getByText('Mi módulo premium')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    const logout = screen.getByText('Cerrar sesión');
    expect(logout).toBeInTheDocument();

    // simulate logout success
    await userEvent.click(logout);
    await waitFor(() => expect(cerrarSesion).toHaveBeenCalled());
  });

  test('logout failure shows error message', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u2' }, perfil: { rol: 'usuario' } });
    cerrarSesion.mockRejectedValueOnce(new Error('boom'));
    render(React.createElement(Navbar));

    const logout = screen.getByText('Cerrar sesión');
    await userEvent.click(logout);
    await waitFor(() => expect(screen.getByText('No se pudo cerrar sesión.')).toBeInTheDocument());
  });
});
