import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecoverPassword from '../src/pages/RecoverPassword';

const mockRecuperarContrasena = jest.fn();

jest.mock('../src/firebase/auth', () => ({
  recuperarContrasena: (...args) => mockRecuperarContrasena(...args),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

beforeEach(() => {
  mockRecuperarContrasena.mockReset();
});

function renderPage() {
  return render(<RecoverPassword />);
}

test('envía el correo de recuperación y permite reiniciar el formulario', async () => {
  mockRecuperarContrasena.mockResolvedValue(undefined);

  renderPage();

  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'cliente@correo.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));

  await waitFor(() => {
    expect(mockRecuperarContrasena).toHaveBeenCalledWith('cliente@correo.com');
  });

  expect(await screen.findByText('¡Correo enviado!')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Usar otro correo' }));

  expect(await screen.findByText('Restablecer contraseña')).toBeInTheDocument();
  expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
});

test('muestra error cuando no existe una cuenta con ese correo', async () => {
  mockRecuperarContrasena.mockRejectedValue(new Error('sin cuenta'));

  renderPage();

  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'desconocido@correo.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No encontramos una cuenta con ese correo. Verifica e intenta de nuevo.',
  );
});