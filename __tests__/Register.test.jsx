import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../firebase/auth', () => ({
  registrarUsuario: jest.fn(),
  loginConGoogle: jest.fn(),
}));

import { registrarUsuario, loginConGoogle } from '../firebase/auth';

const renderRegister = () =>
  render(<MemoryRouter><Register /></MemoryRouter>);

const fillBasicForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
  fireEvent.change(screen.getByPlaceholderText('Ej: Forero'), { target: { value: 'Forero' } });
  fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'juan@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
  fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'Password1!' } });
  fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'Password1!' } });
  fireEvent.click(screen.getByLabelText(/términos y condiciones/i));
};

beforeEach(() => jest.clearAllMocks());

describe('Register - validaciones básicas', () => {
  test('muestra error si nombre está vacío', async () => {
    renderRegister();
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('El nombre es requerido.')).toBeInTheDocument();
  });

  test('muestra error si apellido está vacío', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('El apellido es requerido.')).toBeInTheDocument();
  });

  test('muestra error si correo no es válido', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Forero'), { target: { value: 'Forero' } });
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'correo-malo' } });
    fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('Por favor ingresa un correo válido.')).toBeInTheDocument();
  });

  test('muestra error si contraseña es corta', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Forero'), { target: { value: 'Forero' } });
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument();
  });

  test('muestra error si contraseñas no coinciden', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Forero'), { target: { value: 'Forero' } });
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'Diferente1!' } });
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
  });

  test('muestra error si no acepta términos', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Forero'), { target: { value: 'Forero' } });
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('Debes aceptar los términos y condiciones.')).toBeInTheDocument();
  });
});

describe('Register - registro exitoso', () => {
  test('navega a /login tras registro como usuario', async () => {
    registrarUsuario.mockResolvedValue({});
    renderRegister();
    fillBasicForm();
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  test('muestra error si registrarUsuario falla', async () => {
    registrarUsuario.mockRejectedValue({ message: 'El correo ya está en uso.' });
    renderRegister();
    fillBasicForm();
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('El correo ya está en uso.')).toBeInTheDocument();
  });
});

describe('Register - rol proveedor', () => {
  test('muestra campos extra al seleccionar proveedor', () => {
    renderRegister();
    fireEvent.click(screen.getByText('Soy proveedor'));
    expect(screen.getByPlaceholderText('Ej: PetCare Tunja')).toBeInTheDocument();
  });

  test('muestra error si falta nombre de negocio', async () => {
    renderRegister();
    fireEvent.click(screen.getByText('Soy proveedor'));
    fillBasicForm();
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    expect(await screen.findByText('El nombre del negocio es requerido para proveedores.')).toBeInTheDocument();
  });

  test('navega a /proveedor/nuevo tras registro como proveedor', async () => {
    registrarUsuario.mockResolvedValue({});
    renderRegister();
    fireEvent.click(screen.getByText('Soy proveedor'));
    fillBasicForm();
    fireEvent.change(screen.getByPlaceholderText('Ej: PetCare Tunja'), { target: { value: 'Mi Negocio' } });
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'Baño y secado' } });
    fireEvent.click(screen.getByText('Crear cuenta gratis'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/proveedor/nuevo'));
  });
});

describe('Register - Google', () => {
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