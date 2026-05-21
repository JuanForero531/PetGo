import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../src/context/AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }) => require('react').createElement('div', null, `Navigate:${to}`),
}));

const { useAuth } = require('../src/context/AuthContext');
const ProtectedRoute = require('../src/components/ProtectedRoute').default;

describe('ProtectedRoute branches', () => {
  afterEach(() => jest.clearAllMocks());

  test('shows loading UI when loading', () => {
    useAuth.mockReturnValue({ loading: true });
    render(React.createElement(ProtectedRoute, {}, React.createElement('div', null, 'OK')));
    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument();
  });

  test('redirects to login when no user', () => {
    useAuth.mockReturnValue({ loading: false, user: null, perfil: null });
    render(React.createElement(ProtectedRoute, {}, React.createElement('div', null, 'OK')));
    expect(screen.getByText('Navigate:/login')).toBeInTheDocument();
  });

  test('redirects when role not allowed', () => {
    useAuth.mockReturnValue({ loading: false, user: { uid: 'u' }, perfil: { rol: 'user' } });
    render(React.createElement(ProtectedRoute, { roles: ['admin'], unauthorizedTo: '/servicios' }, React.createElement('div', null, 'OK')));
    expect(screen.getByText('Navigate:/servicios')).toBeInTheDocument();
  });

  test('renders children when authorized', () => {
    useAuth.mockReturnValue({ loading: false, user: { uid: 'u' }, perfil: { rol: 'admin' } });
    render(React.createElement(ProtectedRoute, { roles: ['admin'] }, React.createElement('div', null, 'OK')));
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
