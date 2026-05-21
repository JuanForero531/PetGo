/* eslint-disable react/prop-types */
jest.mock('../src/firebase/auth', () => ({ cerrarSesion: jest.fn() }));

// mock context with internal mutable state accessible via __setAuthState
jest.mock('../src/context/AuthContext', () => {
  let state = { user: null, perfil: null, loading: false };
  return {
    __setAuthState: (s) => { state = s; },
    useAuth: () => state,
  };
});

const mockNavigate = jest.fn();
const MockNavigate = ({ to }) => require('react').createElement('div', { 'data-to': to });
jest.mock('react-router-dom', () => ({ NavLink: ({ children }) => children, useNavigate: () => mockNavigate, Navigate: MockNavigate }));

const { render, screen, fireEvent } = require('@testing-library/react');

describe('Navbar and ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../src/context/AuthContext').__setAuthState({ user: null, perfil: null, loading: false });
  });

  test('Navbar shows login/register when no user and brand navigates', () => {
    const Navbar = require('../src/components/Navbar.jsx').default;
    render(require('react').createElement(Navbar));
    expect(screen.getByText(/Iniciar sesión/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('PetGo'));
    expect(mockNavigate).toHaveBeenCalledWith('/servicios');
  });

  test('Navbar shows provider links and logout navigates', async () => {
    const cerrar = require('../src/firebase/auth').cerrarSesion;
    require('../src/context/AuthContext').__setAuthState({ user: { uid: 'u1' }, perfil: { rol: 'proveedor', esPremium: true } });

    const Navbar = require('../src/components/Navbar.jsx').default;
    cerrar.mockResolvedValueOnce();
    render(require('react').createElement(Navbar));

    expect(screen.getByText('Mi módulo premium')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cerrar sesión'));
    await Promise.resolve();
    expect(cerrar).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('ProtectedRoute shows loading and redirects appropriately', () => {
    // loading state
    require('../src/context/AuthContext').__setAuthState({ loading: true, user: null, perfil: null });
    const ProtectedRoute = require('../src/components/ProtectedRoute.jsx').default;
    render(require('react').createElement(ProtectedRoute, { children: require('react').createElement('div', null, 'OK') }));
    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument();

    // not logged in -> redirect to login
    require('../src/context/AuthContext').__setAuthState({ loading: false, user: null, perfil: null });
    const ProtectedRoute2 = require('../src/components/ProtectedRoute.jsx').default;
    const { container } = render( require('react').createElement(ProtectedRoute2, { children: require('react').createElement('div', null, 'OK') }) );
    expect(container.querySelector('[data-to="/login"]')).toBeTruthy();
  });
});
