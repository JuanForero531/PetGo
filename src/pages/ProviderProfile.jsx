import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  obtenerUsuario,
  obtenerServiciosDelProveedor,
  obtenerSolicitudesPorProveedor,
  responderSolicitudServicio,
} from '../firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import '../styles/ProviderProfile.css';

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [proveedor, setProveedor] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [gestionandoId, setGestionandoId] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      setError('');

      try {
        const esMiPerfil = user?.uid === id;

        const datosProveedor = await obtenerUsuario(id);
        if (!datosProveedor) {
          setError('El proveedor no existe.');
          return;
        }
        if (datosProveedor.rol !== 'proveedor') {
          setError('Este usuario no es un proveedor.');
          return;
        }
        setProveedor(datosProveedor);

        const [serviciosProveedor, solicitudesProveedor] = await Promise.all([
          obtenerServiciosDelProveedor(id),
          esMiPerfil ? obtenerSolicitudesPorProveedor(id) : Promise.resolve([]),
        ]);

        setServicios(serviciosProveedor);
        setSolicitudes(solicitudesProveedor);
      } catch (err) {
        console.error('Error al cargar perfil del proveedor:', err);
        setError('No fue posible cargar el perfil del proveedor.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarPerfil();
    }
  }, [id, user?.uid]);

  const esMiPerfil = user?.uid === id;

  const formatearFecha = (valor) => {
    if (!valor) return 'Sin fecha';
    const fecha = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleGestionarSolicitud = async (solicitudId, estado) => {
    setGestionandoId(solicitudId);
    setError('');

    try {
      await responderSolicitudServicio({ solicitudId, proveedorId: id, estado });
      const solicitudesActualizadas = await obtenerSolicitudesPorProveedor(id);
      setSolicitudes(solicitudesActualizadas);
    } catch (err) {
      console.error('Error al responder solicitud:', err);
      setError(err.message || 'No fue posible actualizar la solicitud.');
    } finally {
      setGestionandoId('');
    }
  };

  const tiposDisponibles = useMemo(() => {
    const tipos = [...new Set(servicios.map(s => s.tipo).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
    return ['Todos', ...tipos];
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

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="pp-root">
          <div className="pp-state">Cargando perfil...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <main className="pp-root">
          <div className="pp-state pp-state--error">{error}</div>
          <button className="pp-btn-back" onClick={() => navigate('/servicios')}>
            ← Volver al marketplace
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="pp-root">
        {/* Perfil del proveedor */}
        <section className="pp-header">
          <div className="pp-header__hero">
            <div className="pp-header__avatar">
              {proveedor?.fotoPerfil ? (
                <img src={proveedor.fotoPerfil} alt={`Foto de ${proveedor?.nombre || 'proveedor'}`} />
              ) : (
                <span>{(proveedor?.nombre?.charAt(0) || 'P').toUpperCase()}</span>
              )}
            </div>

            <div className="pp-header__info">
              <div className="pp-header__badges">
                {proveedor?.esPremium && <span className="pp-premium">Proveedor premium</span>}
                <span className={`pp-status ${proveedor?.activo ? 'pp-active' : 'pp-inactive'}`}>
                  {proveedor?.activo ? 'Activo' : 'Inactivo'}
                </span>
                <span className={`pp-status ${proveedor?.esPremium ? 'pp-premium-status' : 'pp-regular-status'}`}>
                  {proveedor?.esPremium ? 'Premium' : 'Regular'}
                </span>
              </div>

              <h1 className="pp-title">{proveedor?.nombre} {proveedor?.apellido}</h1>
              <p className="pp-business">{proveedor?.nombreNegocio}</p>
              <p className="pp-type">{proveedor?.tipoServicio}</p>

              <div className="pp-header__stats">
                <div className="pp-stat">
                  <span className="pp-stat__label">Servicios</span>
                  <strong className="pp-stat__value">{servicios.length}</strong>
                </div>
                <div className="pp-stat">
                  <span className="pp-stat__label">Categorías</span>
                  <strong className="pp-stat__value">{tiposDisponibles.length - 1}</strong>
                </div>
                <div className="pp-stat">
                  <span className="pp-stat__label">Visibilidad</span>
                  <strong className="pp-stat__value">{proveedor?.esPremium ? 'Alta' : 'Estándar'}</strong>
                </div>
              </div>
            </div>
          </div>

          <aside className="pp-header__contact">
            <div className="pp-contact-item">
              <span className="pp-label">Correo:</span>
              <a href={`mailto:${proveedor?.correo}`} className="pp-value pp-link">
                {proveedor?.correo}
              </a>
            </div>
            <div className="pp-contact-item">
              <span className="pp-label">Teléfono:</span>
              <a href={`tel:${proveedor?.telefono}`} className="pp-value pp-link">
                {proveedor?.telefono || 'No disponible'}
              </a>
            </div>
            <div className="pp-contact-item">
              <span className="pp-label">Ubicación:</span>
              <span className="pp-value">{proveedor?.direccion || 'No disponible'}</span>
            </div>
          </aside>
        </section>

        {esMiPerfil && perfil?.rol === 'proveedor' && (
          <section className="pp-requests">
            <header className="pp-requests__header">
              <div>
                <h2 className="pp-requests__title">Solicitudes de contratación</h2>
                <p className="pp-requests__subtitle">Acepta o rechaza las solicitudes que llegan a tus servicios.</p>
              </div>
              <span className="pp-requests__count">{solicitudes.length} solicitud{solicitudes.length === 1 ? '' : 'es'}</span>
            </header>

            {solicitudes.length === 0 ? (
              <div className="pp-empty">
                <p>Aún no tienes solicitudes registradas.</p>
              </div>
            ) : (
              <div className="pp-request-list">
                {solicitudes.map((solicitud) => (
                  <article key={solicitud.id} className="pp-request-card">
                    <div className="pp-request-card__top">
                      <div>
                        <h3>{solicitud.servicioSnapshot?.nombreNegocio || 'Servicio sin nombre'}</h3>
                        <p>{solicitud.servicioSnapshot?.tipo || 'Sin tipo'}</p>
                      </div>
                      <span className={`pp-request-status pp-request-status--${solicitud.estado}`}>
                        {solicitud.estado}
                      </span>
                    </div>

                    <div className="pp-request-card__grid">
                      <div>
                        <span className="pp-request-label">Cliente</span>
                        <strong>
                          {solicitud.clienteSnapshot?.nombre || 'Cliente'} {solicitud.clienteSnapshot?.apellido || ''}
                        </strong>
                      </div>
                      <div>
                        <span className="pp-request-label">Contacto</span>
                        <strong>{solicitud.clienteSnapshot?.telefono || solicitud.clienteSnapshot?.correo || 'No disponible'}</strong>
                      </div>
                      <div>
                        <span className="pp-request-label">Fecha</span>
                        <strong>{formatearFecha(solicitud.createdAt)}</strong>
                      </div>
                      <div>
                        <span className="pp-request-label">Preferencia</span>
                        <strong>{solicitud.canalContacto || 'No indicada'}</strong>
                      </div>
                    </div>

                    {solicitud.mensaje && <p className="pp-request-message">{solicitud.mensaje}</p>}

                    {solicitud.estado === 'pendiente' && (
                      <div className="pp-request-actions">
                        <button
                          type="button"
                          className="pp-request-btn pp-request-btn--accept"
                          onClick={() => handleGestionarSolicitud(solicitud.id, 'aceptada')}
                          disabled={gestionandoId === solicitud.id}
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          className="pp-request-btn pp-request-btn--reject"
                          onClick={() => handleGestionarSolicitud(solicitud.id, 'rechazada')}
                          disabled={gestionandoId === solicitud.id}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Servicios del proveedor */}
        <section className="pp-services">
          <header className="pp-services__header">
            <h2 className="pp-services__title">Servicios ofrecidos</h2>
            <p className="pp-services__count">{servicios.length} servicio{servicios.length !== 1 ? 's' : ''}</p>
          </header>

          {servicios.length === 0 ? (
            <div className="pp-empty">
              <p>Este proveedor no tiene servicios publicados.</p>
            </div>
          ) : (
            <>
              <div className="pp-filters">
                <input
                  type="text"
                  className="pp-search"
                  placeholder="Buscar servicios..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />

                <select
                  className="pp-select"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                >
                  {tiposDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              {serviciosFiltrados.length === 0 ? (
                <div className="pp-empty">
                  <p>No se encontraron servicios que coincidan con la búsqueda.</p>
                </div>
              ) : (
                <div className="pp-services-grid">
                  {serviciosFiltrados.map((servicio) => (
                    <ServiceCard key={servicio.id} servicio={servicio} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <button className="pp-btn-back" onClick={() => navigate('/servicios')}>
          ← Volver al marketplace
        </button>
      </main>
      <Footer />
    </div>
  );
}
