import React from 'react';
import { render, screen } from '@testing-library/react';
import ServiceCard from '../src/components/ServiceCard';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('ServiceCard', () => {
  const servicio = {
    id: 's1',
    tipo: 'Baño y secado',
    nombreNegocio: 'Baño Premium',
    descripcion: 'Corte y secado',
    precio: 50000,
    direccion: 'Cra 10',
    proveedor: { esPremium: true }
  };

  test('renders basic info and price', () => {
    render(<ServiceCard servicio={servicio} puntuacion={{ promedio: 4.5, total: 2 }} />);
    expect(screen.getByText('Baño Premium')).toBeInTheDocument();
    // price uses locale formatting (e.g. $ 50.000)
    expect(screen.getByText(/\$\s*50[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/⭐\s*4.5/)).toBeInTheDocument();
  });
});
