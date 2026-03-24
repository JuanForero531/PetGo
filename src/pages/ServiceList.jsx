import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ServiceList.css';
import { obtenerServicios } from '../firebase/firestore';
import { cerrarSesion } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function ServiceList() {
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarServicios = async () => {
      setCargando(true);
      setError('');
      try {
        const serviciosDb = await obtenerServicios();
        setServicios(serviciosDb);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setError('No se pudieron cargar los servicios en este momento.');
        setServicios([]);
      } finally {
        setCargando(false);
      }
    };

    cargarServicios();
  }, []);

  const handleLogout = async () => {
    try {
      await cerrarSesion();
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesion:', err);
      setError('No se pudo cerrar sesion.');
    }
  };

  const tiposDisponibles = useMemo(() => {
    const tiposUnicos = [...new Set(servicios.map(servicio => servicio.tipo).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
    return ['Todos', ...tiposUnicos];
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return servicios.filter((servicio) => {
      const coincideTipo = filtro === 'Todos' || servicio.tipo === filtro;
      if (!coincideTipo) return false;

      if (!termino) return true;

      const campoBusqueda = [
        servicio.nombreNegocio,
        servicio.tipo,
        servicio.descripcion,
        servicio.direccion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return campoBusqueda.includes(termino);
    });
  }, [servicios, filtro, busqueda]);

  return (
    <div className="sl-root">
      <header className="sl-header">
        <div className="sl-actions">
          {perfil?.rol === 'proveedor' && (
            <button className="sl-action-btn" type="button" onClick={() => navigate('/proveedor/nuevo')}>
              Mi modulo proveedor
            </button>
          )}
          {perfil?.rol === 'admin' && (
            <button className="sl-action-btn" type="button" onClick={() => navigate('/admin/dashboard')}>
              Panel admin
            </button>
          )}
          {user && (
            <button className="sl-action-btn sl-action-btn--ghost" type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          )}
        </div>
        <h1 className="sl-title">Servicios para mascotas en Tunja</h1>
        <p className="sl-desc">Encuentra y agenda servicios para tu mascota con proveedores de confianza en Tunja, Boyacá.</p>

        <div className="sl-controls">
          <label className="sl-field" htmlFor="buscar-servicio">
            <span className="sl-field__label">Buscar</span>
            <input
              id="buscar-servicio"
              className="sl-input"
              type="search"
              placeholder="Negocio, servicio o zona"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>

          <label className="sl-field" htmlFor="filtrar-tipo">
            <span className="sl-field__label">Tipo de servicio</span>
            <select
              id="filtrar-tipo"
              className="sl-select"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>

          <div className="sl-meta" aria-live="polite">
            <span className="sl-meta__count">{serviciosFiltrados.length}</span>
            <span className="sl-meta__text">resultados de {servicios.length}</span>
          </div>
        </div>
      </header>

      {cargando ? (
        <div className="sl-cargando">Cargando servicios...</div>
      ) : error ? (
        <div className="sl-vacio">{error}</div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="sl-vacio">No hay servicios disponibles.</div>
      ) : (
        <div className="sl-grid fade-up">
          {serviciosFiltrados.map(servicio => (
            <div className="sl-card" key={servicio.id}>
              <div className="sl-card__top">
                <span className="sl-card__badge">{servicio.tipo}</span>
              </div>
              <h2 className="sl-card__nombre">{servicio.nombreNegocio}</h2>
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