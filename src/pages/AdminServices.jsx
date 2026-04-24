import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  obtenerServiciosConProveedor,
  editarServicio,
  eliminarServicio,
  activarServicio,
} from '../firebase/firestore';
import '../styles/AdminServices.css';

const TIPOS = [
  'Baño y secado',
  'Corte de pelo',
  'Corte de uñas',
  'Paseo de mascotas',
  'Cuidado a domicilio',
  'Vacunación',
  'Peinado para mascotas',
  'Atención veterinaria',
];

const initialFormEdit = {
  nombreNegocio: '',
  tipo: '',
  descripcion: '',
  precio: '',
  direccion: '',
};

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function AdminServices() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formEdit, setFormEdit] = useState(initialFormEdit);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [successModal, setSuccessModal] = useState('');
  const [accionPendiente, setAccionPendiente] = useState(false);

  // Validación de permisos
  useEffect(() => {
    if (perfil && perfil.rol !== 'admin') {
      navigate('/servicios');
    }
  }, [perfil, navigate]);

  // Cargar servicios
  useEffect(() => {
    const cargarServicios = async () => {
      setLoading(true);
      setError('');
      try {
        const serviciosConProveedor = await obtenerServiciosConProveedor();
        setServicios(serviciosConProveedor);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setError('No se pudieron cargar los servicios.');
      } finally {
        setLoading(false);
      }
    };

    cargarServicios();
  }, []);

  const tiposDisponibles = useMemo(() => {
    const tipos = [...new Set(servicios.map(s => s.tipo).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
    return ['Todos', ...tipos];
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return servicios.filter((servicio) => {
      // Filtro por tipo
      if (filtroTipo !== 'Todos' && servicio.tipo !== filtroTipo) {
        return false;
      }

      // Filtro por estado
      if (filtroEstado === 'activos' && !servicio.activo) {
        return false;
      }
      if (filtroEstado === 'inactivos' && servicio.activo) {
        return false;
      }

      // Búsqueda
      if (!termino) return true;

      const campoBusqueda = [
        servicio.nombreNegocio,
        servicio.tipo,
        servicio.descripcion,
        servicio.direccion,
        servicio.proveedor?.nombre,
        servicio.proveedor?.correo,
      ]
        .filter(Boolean)
        .map(normalizarTexto)
        .join(' ');

      return campoBusqueda.includes(termino);
    });
  }, [servicios, filtroTipo, filtroEstado, busqueda]);

  const abrirModalEditar = (servicio) => {
    setServicioSeleccionado(servicio);
    setFormEdit({
      nombreNegocio: servicio.nombreNegocio || '',
      tipo: servicio.tipo || '',
      descripcion: servicio.descripcion || '',
      precio: String(servicio.precio ?? ''),
      direccion: servicio.direccion || '',
    });
    setErrorModal('');
    setSuccessModal('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setServicioSeleccionado(null);
    setFormEdit(initialFormEdit);
    setErrorModal('');
    setSuccessModal('');
  };

  const handleChangeEdit = (e) => {
    const { name, value } = e.target;
    setFormEdit((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setSuccessModal('');

    if (!formEdit.nombreNegocio || !formEdit.tipo || !formEdit.descripcion || !formEdit.precio || !formEdit.direccion) {
      setErrorModal('Completa todos los campos antes de guardar.');
      return;
    }

    if (Number(formEdit.precio) <= 0) {
      setErrorModal('El precio debe ser mayor a cero.');
      return;
    }

    setGuardando(true);
    try {
      await editarServicio(servicioSeleccionado.id, {
        nombreNegocio: formEdit.nombreNegocio,
        tipo: formEdit.tipo,
        descripcion: formEdit.descripcion,
        precio: Number(formEdit.precio),
        direccion: formEdit.direccion,
      });

      setServicios((prevServicios) =>
        prevServicios.map((s) =>
          s.id === servicioSeleccionado.id
            ? {
                ...s,
                nombreNegocio: formEdit.nombreNegocio,
                tipo: formEdit.tipo,
                descripcion: formEdit.descripcion,
                precio: Number(formEdit.precio),
                direccion: formEdit.direccion,
              }
            : s,
        ),
      );

      setSuccessModal('Servicio actualizado correctamente.');
      setTimeout(() => {
        cerrarModal();
      }, 1500);
    } catch (err) {
      console.error('Error al guardar:', err);
      setErrorModal('No se pudo guardar el cambio: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarServicio = async (servicioId) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este servicio?')) {
      setAccionPendiente(true);
      try {
        await eliminarServicio(servicioId);
        setServicios((prevServicios) =>
          prevServicios.map((s) =>
            s.id === servicioId ? { ...s, activo: false } : s,
          ),
        );
      } catch (err) {
        console.error('Error al eliminar servicio:', err);
        setError('No se pudo desactivar el servicio.');
      } finally {
        setAccionPendiente(false);
      }
    }
  };

  const handleActivarServicio = async (servicioId) => {
    setAccionPendiente(true);
    try {
      await activarServicio(servicioId);
      setServicios((prevServicios) =>
        prevServicios.map((s) =>
          s.id === servicioId ? { ...s, activo: true } : s,
        ),
      );
    } catch (err) {
      console.error('Error al activar servicio:', err);
      setError('No se pudo activar el servicio.');
    } finally {
      setAccionPendiente(false);
    }
  };

  return (
    <div className="as-page">
      <aside className="as-sidebar">
        <div className="as-brand">
          <div className="as-brand__icon">🐾</div>
          <div>
            <p className="as-brand__name">PetGo</p>
            <p className="as-brand__sub">Panel administrativo</p>
          </div>
        </div>

        <nav className="as-menu" aria-label="Menu admin">
          <button type="button" className="as-menu__item" onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </button>
          <button type="button" className="as-menu__item" onClick={() => navigate('/admin/usuarios')}>
            Gestión de usuarios
          </button>
          <button type="button" className="as-menu__item as-menu__item--active">
            Gestión de servicios
          </button>
          <button type="button" className="as-menu__item" onClick={() => navigate('/servicios')}>
            Ver marketplace
          </button>
        </nav>
      </aside>

      <main className="as-main">
        <div className="as-shell">
          <header className="as-header">
            <div>
              <h1 className="as-title">Gestión de Servicios</h1>
              <p className="as-subtitle">Administra todos los servicios ofrecidos en la plataforma</p>
            </div>
            <div className="as-pills">
              <span className="as-pill">Rol: Admin</span>
              <span className="as-pill">PetGo Tunja</span>
            </div>
          </header>

          {error && <div className="as-error">{error}</div>}

          <section className="as-filters">
            <input
              type="text"
              className="as-search"
              placeholder="Buscar servicios, proveedores..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="as-select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <select
              className="as-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </section>

          {loading ? (
            <div className="as-empty">Cargando servicios...</div>
          ) : serviciosFiltrados.length === 0 ? (
            <div className="as-empty">No se encontraron servicios que coincidan con los filtros.</div>
          ) : (
            <section className="as-services-grid">
              {serviciosFiltrados.map((servicio) => (
                <div key={servicio.id} className={`as-service-card ${!servicio.activo ? 'as-inactive' : ''}`}>
                  <div className="as-card-header">
                    <span className="as-card-badge">{servicio.tipo}</span>
                    <span className={`as-status ${servicio.activo ? 'as-active' : 'as-inactive-status'}`}>
                      {servicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="as-card-body">
                    <h3 className="as-card-title">{servicio.nombreNegocio}</h3>
                    <p className="as-card-desc">{servicio.descripcion}</p>

                    <div className="as-card-info">
                      <div className="as-info-row">
                        <span className="as-label">Proveedor:</span>
                        <span className="as-value">{servicio.proveedor?.nombre || 'Desconocido'}</span>
                      </div>
                      <div className="as-info-row">
                        <span className="as-label">Correo:</span>
                        <span className="as-value">{servicio.proveedor?.correo || 'N/A'}</span>
                      </div>
                      <div className="as-info-row">
                        <span className="as-label">Precio:</span>
                        <span className="as-value">${Number(servicio.precio || 0).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="as-info-row">
                        <span className="as-label">Ubicación:</span>
                        <span className="as-value">{servicio.direccion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="as-card-actions">
                    <button
                      className="as-btn as-btn-edit"
                      onClick={() => abrirModalEditar(servicio)}
                      disabled={accionPendiente}
                    >
                      Editar
                    </button>
                    {servicio.activo ? (
                      <button
                        className="as-btn as-btn-delete"
                        onClick={() => handleEliminarServicio(servicio.id)}
                        disabled={accionPendiente}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="as-btn as-btn-activate"
                        onClick={() => handleActivarServicio(servicio.id)}
                        disabled={accionPendiente}
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>

      {/* Modal de edición */}
      {modalAbierto && (
        <div className="as-modal-overlay" onClick={cerrarModal}>
          <div className="as-modal" onClick={(e) => e.stopPropagation()}>
            <header className="as-modal-header">
              <h2>Editar Servicio</h2>
              <button className="as-modal-close" onClick={cerrarModal}>
                ✕
              </button>
            </header>

            {errorModal && <div className="as-modal-error">{errorModal}</div>}
            {successModal && <div className="as-modal-success">{successModal}</div>}

            <form className="as-modal-form" onSubmit={handleGuardarEdicion}>
              <div className="as-form-group">
                <label className="as-form-label">Nombre del negocio</label>
                <input
                  type="text"
                  name="nombreNegocio"
                  className="as-form-input"
                  value={formEdit.nombreNegocio}
                  onChange={handleChangeEdit}
                />
              </div>

              <div className="as-form-group">
                <label className="as-form-label">Tipo de servicio</label>
                <select
                  name="tipo"
                  className="as-form-input"
                  value={formEdit.tipo}
                  onChange={handleChangeEdit}
                >
                  <option value="">Selecciona un tipo</option>
                  {TIPOS.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="as-form-group">
                <label className="as-form-label">Descripción</label>
                <textarea
                  name="descripcion"
                  className="as-form-input as-form-textarea"
                  value={formEdit.descripcion}
                  onChange={handleChangeEdit}
                />
              </div>

              <div className="as-form-group">
                <label className="as-form-label">Precio</label>
                <input
                  type="number"
                  name="precio"
                  className="as-form-input"
                  value={formEdit.precio}
                  onChange={handleChangeEdit}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="as-form-group">
                <label className="as-form-label">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  className="as-form-input"
                  value={formEdit.direccion}
                  onChange={handleChangeEdit}
                />
              </div>

              <div className="as-modal-actions">
                <button type="button" className="as-btn-cancel" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="as-btn-save" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
