import React, { useEffect, useState } from 'react';
import '../styles/ServiceList.css';

const SERVICIOS_SIMULADOS = [
  {
    id: '1',
    nombreNegocio: 'Pet Spa Tunja',
    tipo: 'Baño y secado',
    descripcion: 'Baño relajante y secado profesional para tu mascota.',
    precio: 25000,
    direccion: 'Cra 10 #15-20, Tunja',
  },
  {
    id: '2',
    nombreNegocio: 'Corte y Estilo Canino',
    tipo: 'Corte de pelo',
    descripcion: 'Cortes modernos y clásicos para perros y gatos.',
    precio: 30000,
    direccion: 'Av. Norte #45-12, Tunja',
  },
  {
    id: '3',
    nombreNegocio: 'Uñas Felices',
    tipo: 'Corte de uñas',
    descripcion: 'Corte de uñas seguro y sin estrés.',
    precio: 12000,
    direccion: 'Cll 18 #8-33, Tunja',
  },
  {
    id: '4',
    nombreNegocio: 'Paseos Tunja Pet',
    tipo: 'Paseo de mascotas',
    descripcion: 'Paseos diarios y personalizados para tu mascota.',
    precio: 18000,
    direccion: 'Cra 7 #21-10, Tunja',
  },
  {
    id: '5',
    nombreNegocio: 'Cuidado Hogareño',
    tipo: 'Cuidado a domicilio',
    descripcion: 'Cuidamos a tu mascota en tu hogar con amor.',
    precio: 35000,
    direccion: 'Cll 25 #12-40, Tunja',
  },
];

const TIPOS = [
  'Todos',
  'Baño y secado',
  'Corte de pelo',
  'Corte de uñas',
  'Paseo de mascotas',
  'Cuidado a domicilio',
];

export default function ServiceList() {
  const [servicios, setServicios] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    // const servicios = await obtenerServicios(); // descomentar cuando Edgar conecte Firestore
    setTimeout(() => {
      setServicios(SERVICIOS_SIMULADOS);
      setCargando(false);
    }, 800);
  }, []);

  const serviciosFiltrados = filtro === 'Todos'
    ? servicios
    : servicios.filter(s => s.tipo === filtro);

  return (
    <div className="sl-root">
      <header className="sl-header">
        <h1 className="sl-title">Servicios para mascotas en Tunja</h1>
        <p className="sl-desc">Encuentra y agenda servicios para tu mascota con proveedores de confianza en Tunja, Boyacá.</p>
        <div className="sl-filtros">
          {TIPOS.map(tipo => (
            <button
              key={tipo}
              className={`sl-filtro${filtro === tipo ? ' sl-filtro--activo' : ''}`}
              onClick={() => setFiltro(tipo)}
              type="button"
            >
              {tipo}
            </button>
          ))}
        </div>
      </header>

      {cargando ? (
        <div className="sl-cargando">Cargando servicios...</div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="sl-vacio">No hay servicios disponibles.</div>
      ) : (
        <div className="sl-grid fade-up">
          {serviciosFiltrados.map(servicio => (
            <div className="sl-card" key={servicio.id}>
              <h2 className="sl-card__nombre">{servicio.nombreNegocio}</h2>
              <span className="sl-card__tipo">{servicio.tipo}</span>
              <p className="sl-card__desc">{servicio.descripcion}</p>
              <div className="sl-card__info">
                <span className="sl-card__precio">${servicio.precio.toLocaleString('es-CO')}</span>
                <span className="sl-card__direccion">{servicio.direccion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}