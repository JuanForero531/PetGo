import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerUsuario, obtenerServiciosDelProveedor } from '../firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import '../styles/ProviderProfile.css';

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      setError('');

      try {
        // Cargar proveedor
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

        // Cargar servicios del proveedor
        const serviciosProveedor = await obtenerServiciosDelProveedor(id);
        setServicios(serviciosProveedor);
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
  }, [id]);

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
          <div className="pp-header__avatar">
            {proveedor?.fotoPerfil ? (
              <img src={proveedor.fotoPerfil} alt={`Foto de ${proveedor?.nombre || 'proveedor'}`} />
            ) : (
              <span>{(proveedor?.nombre?.charAt(0) || 'P').toUpperCase()}</span>
            )}
          </div>

          <div className="pp-header__info">
            <h1 className="pp-title">{proveedor?.nombre} {proveedor?.apellido}</h1>
            <p className="pp-business">{proveedor?.nombreNegocio}</p>
            <p className="pp-type">{proveedor?.tipoServicio}</p>
          </div>

          <div className="pp-header__contact">
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
            <div className="pp-contact-item">
              <span className="pp-label">Estado:</span>
              <span className={`pp-status ${proveedor?.activo ? 'pp-active' : 'pp-inactive'}`}>
                {proveedor?.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </section>

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
