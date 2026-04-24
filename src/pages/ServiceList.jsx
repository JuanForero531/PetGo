import React, { useEffect, useMemo, useState } from 'react';
import '../styles/ServiceList.css';
import { obtenerServicios } from '../firebase/firestore';
import ServiceCard from '../components/ServiceCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ServiceList() {
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

  const serviciosDestacados = useMemo(() => {
    return [...serviciosFiltrados]
      .sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0))
      .slice(0, 8);
  }, [serviciosFiltrados]);

  const tiposTop = useMemo(() => tiposDisponibles.filter((tipo) => tipo !== 'Todos').slice(0, 6), [tiposDisponibles]);

  return (
    <div className="sl-page">
      <Navbar />
      <div className="sl-root">
        <header className="sl-header">
          <section className="sl-hero">
            <article className="sl-hero__main">
              <p className="sl-hero__eyebrow">Marketplace PetGo</p>
              <h1 className="sl-title">Servicios para mascotas en Tunja</h1>
              <p className="sl-desc">Encuentra y agenda servicios con proveedores verificados en Tunja, Boyacá.</p>
              <div className="sl-hero__chips">
                <span className="sl-chip">Atención en casa</span>
                <span className="sl-chip">Pago acordado con proveedor</span>
                <span className="sl-chip">Perfiles verificados</span>
              </div>
            </article>
            <aside className="sl-hero__aside">
              <div className="sl-promo sl-promo--gold">
                <p className="sl-promo__title">Top de servicios</p>
                <strong>{servicios.length}</strong>
                <span>proveedores activos en la plataforma</span>
              </div>
              <div className="sl-promo sl-promo--brown">
                <p className="sl-promo__title">Categorías</p>
                <strong>{tiposDisponibles.length - 1}</strong>
                <span>tipos para elegir</span>
              </div>
            </aside>
          </section>

          <section className="sl-utility">
            <article>
              <h3>Reserva fácil</h3>
              <p>Encuentra y contacta al proveedor en minutos.</p>
            </article>
            <article>
              <h3>Calidad local</h3>
              <p>Servicios pensados para mascotas en Tunja.</p>
            </article>
            <article>
              <h3>Todo en un sitio</h3>
              <p>Baño, corte, paseos y cuidado especializado.</p>
            </article>
          </section>

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

          <div className="sl-tipos">
            {tiposTop.map((tipo) => (
              <button key={tipo} type="button" className={`sl-tipo-btn ${filtro === tipo ? 'sl-tipo-btn--active' : ''}`} onClick={() => setFiltro(tipo)}>
                {tipo}
              </button>
            ))}
            {tiposTop.length > 0 && (
              <button type="button" className={`sl-tipo-btn ${filtro === 'Todos' ? 'sl-tipo-btn--active' : ''}`} onClick={() => setFiltro('Todos')}>
                Ver todos
              </button>
            )}
          </div>
        </header>

        {cargando ? (
          <div className="sl-cargando">Cargando servicios...</div>
        ) : error ? (
          <div className="sl-vacio">{error}</div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="sl-vacio">No hay servicios disponibles.</div>
        ) : (
          <>
            <section className="sl-section">
              <div className="sl-section__head">
                <h2>Servicios destacados</h2>
                <span>Selección por precio y relevancia</span>
              </div>
              <div className="sl-scroller">
                {serviciosDestacados.map((servicio) => (
                  <div className="sl-scroller__item" key={`destacado-${servicio.id}`}>
                    <ServiceCard servicio={servicio} />
                  </div>
                ))}
              </div>
            </section>

            <section className="sl-section">
              <div className="sl-section__head">
                <h2>Explora todos los servicios</h2>
                <span>{serviciosFiltrados.length} disponibles ahora</span>
              </div>
              <div className="sl-grid fade-up">
                {serviciosFiltrados.map((servicio) => (
                  <ServiceCard key={servicio.id} servicio={servicio} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}