/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import Register from '../src/pages/Register';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

jest.mock('../src/firebase/auth', () => ({
  registrarUsuario: jest.fn(),
  loginConGoogle: jest.fn(),
}));

import { registrarUsuario, loginConGoogle } from '../src/firebase/auth';

const renderRegister = () => render(<Register />);

const selectProviderRole = () => {
  fireEvent.click(screen.getByText('Soy proveedor'));
};

const fillUserForm = ({ acceptTerms = true } = {}) => {
  fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
  fireEvent.change(screen.getByPlaceholderText('Ej: Forero'), { target: { value: 'Forero' } });
  fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'juan@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
  fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'Password1!' } });
  fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'Password1!' } });
  if (acceptTerms) {
    fireEvent.click(screen.getByRole('checkbox'));
  }
};

const fillProviderForm = () => {
  fillUserForm();
  fireEvent.change(screen.getByPlaceholderText('Ej: PetCare Tunja'), { target: { value: 'Mi Negocio' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Baño y secado' } });
  fireEvent.change(screen.getByPlaceholderText('Ej: Cra 10 #23-45, Centro'), { target: { value: 'Cra 10 #23-45, Centro' } });
};

beforeEach(() => jest.clearAllMocks());

describe('Register', () => {
  test('muestra campos extra al seleccionar proveedor', () => {
    renderRegister();
    selectProviderRole();
    expect(screen.getByPlaceholderText('Ej: PetCare Tunja')).toBeInTheDocument();
  });

  test('navega a /login tras registro como usuario', async () => {
    registrarUsuario.mockResolvedValue({});
    renderRegister();
    fillUserForm();
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  test('navega a /proveedor/nuevo tras registro como proveedor', async () => {
    registrarUsuario.mockResolvedValue({});
    renderRegister();
    selectProviderRole();
    fillProviderForm();
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/proveedor/nuevo'));
  });

  test('navega a /servicios al registrarse con Google como usuario', async () => {
    loginConGoogle.mockResolvedValue({ perfil: { rol: 'usuario' } });
    renderRegister();
    fireEvent.click(screen.getByText('Continuar con Google'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/servicios'));
  });

  test('muestra error si Google falla', async () => {
    loginConGoogle.mockRejectedValue({ message: 'Fallo Google' });
    renderRegister();
    fireEvent.click(screen.getByText('Continuar con Google'));
    expect(await screen.findByText('Fallo Google')).toBeInTheDocument();
  });
});
