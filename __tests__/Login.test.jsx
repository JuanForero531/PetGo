/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import Login from '../src/pages/Login';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

jest.mock('../src/firebase/auth', () => ({
  loginConCorreo: jest.fn(),
  loginConGoogle: jest.fn(),
}));

import { loginConCorreo, loginConGoogle } from '../src/firebase/auth';

const renderLogin = () =>
  render(<Login />);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Login - validaciones', () => {
  test('muestra error si correo está vacío', async () => {
    renderLogin();
    fireEvent.click(screen.getByText('Ingresar →'));
    expect(await screen.findByText('Por favor ingresa tu correo.')).toBeInTheDocument();
  });

  test('muestra error si contraseña está vacía', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByText('Ingresar →'));
    expect(await screen.findByText('Por favor ingresa tu contraseña.')).toBeInTheDocument();
  });

  test('muestra error si correo no es válido', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), { target: { value: 'correo-invalido' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Ingresar →'));
    expect(await screen.findByText('Por favor ingresa un correo válido.')).toBeInTheDocument();
  });
});

describe('Login - navegación por rol', () => {
  test('navega a /proveedor/nuevo si rol es proveedor', async () => {
    loginConCorreo.mockResolvedValue({ perfil: { rol: 'proveedor' } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Ingresar →'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/proveedor/nuevo'));
  });

  test('navega a /admin/dashboard si rol es admin', async () => {
    loginConCorreo.mockResolvedValue({ perfil: { rol: 'admin' } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Ingresar →'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'));
  });

  test('navega a /servicios si rol es usuario', async () => {
    loginConCorreo.mockResolvedValue({ perfil: { rol: 'usuario' } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Ingresar →'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/servicios'));
  });

  test('muestra error si loginConCorreo falla', async () => {
    loginConCorreo.mockRejectedValue({ message: 'Credenciales incorrectas' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Ingresar →'));
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
  });
});

describe('Login - Google', () => {
  test('navega a /servicios al iniciar con Google como usuario', async () => {
    loginConGoogle.mockResolvedValue({ perfil: { rol: 'usuario' } });
    renderLogin();
    fireEvent.click(screen.getByText('Continuar con Google'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/servicios'));
  });

  test('muestra error si Google falla', async () => {
    loginConGoogle.mockRejectedValue({ message: 'Error de Google' });
    renderLogin();
    fireEvent.click(screen.getByText('Continuar con Google'));
    expect(await screen.findByText('Error de Google')).toBeInTheDocument();
  });

  test('toggle de mostrar/ocultar contraseña', () => {
    renderLogin();
    const input = screen.getByPlaceholderText('Tu contraseña');
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Mostrar'));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByLabelText('Ocultar'));
    expect(input.type).toBe('password');
  });
});
