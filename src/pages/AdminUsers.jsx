import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  obtenerTodosLosUsuarios,
  obtenerServicios,
  desactivarUsuario,
  activarUsuario,
  actualizarRolUsuario,
} from '../firebase/firestore';
import '../styles/AdminUsers.css';

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [usuarioEnAccion, setUsuarioEnAccion] = useState(null);
  const [accionPendiente, setAccionPendiente] = useState(false);
  const [modalActivo, setModalActivo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');

  // Cargar usuarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      setLoading(true);
      setError('');
      try {
        const [usuariosData, serviciosData] = await Promise.all([
          obtenerTodosLosUsuarios(),
          obtenerServicios(),
        ]);
        setUsuarios(usuariosData);
        setServicios(serviciosData);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los usuarios.');
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  // Filtrar y buscar usuarios
  const usuariosFiltrados = useMemo(() => {
    let resultado = usuarios;

    // Aplicar búsqueda
    if (busqueda) {
      resultado = resultado.filter(
        (usuario) =>
          normalizarTexto(usuario.nombre).includes(normalizarTexto(busqueda)) ||
          normalizarTexto(usuario.apellido).includes(normalizarTexto(busqueda)) ||
          normalizarTexto(usuario.correo).includes(normalizarTexto(busqueda))
      );
    }

    // Aplicar filtro de rol
    if (filtroRol !== 'todos') {
      resultado = resultado.filter((usuario) => usuario.rol === filtroRol);
    }

    // Aplicar filtro de estado
    if (filtroEstado === 'activos') {
      resultado = resultado.filter((usuario) => usuario.activo !== false);
    } else if (filtroEstado === 'inactivos') {
      resultado = resultado.filter((usuario) => usuario.activo === false);
    }

    return resultado;
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const serviciosPorProveedor = useMemo(() => {
    return servicios.reduce((acumulado, servicio) => {
      const proveedorId = servicio.proveedorId;
      if (!proveedorId) return acumulado;
      acumulado[proveedorId] = (acumulado[proveedorId] || 0) + 1;
      return acumulado;
    }, {});
  }, [servicios]);

  // Desactivar usuario
  const handleDesactivar = async (uid) => {
    setAccionPendiente(true);
    try {
      await desactivarUsuario(uid);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, activo: false } : u))
      );
      setUsuarioEnAccion(null);
      setError('');
    } catch (err) {
      console.error('Error al desactivar usuario:', err);
      setError(err.message || 'No se pudo desactivar el usuario.');
      // Limpiar error después de 5 segundos
      setTimeout(() => setError(''), 5000);
    } finally {
      setAccionPendiente(false);
    }
  };

  // Activar usuario
  const handleActivar = async (uid) => {
    setAccionPendiente(true);
    try {
      await activarUsuario(uid);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, activo: true } : u))
      );
      setUsuarioEnAccion(null);
      setError('');
    } catch (err) {
      console.error('Error al activar usuario:', err);
      setError(err.message || 'No se pudo activar el usuario.');
      // Limpiar error después de 5 segundos
      setTimeout(() => setError(''), 5000);
    } finally {
      setAccionPendiente(false);
    }
  };

  // Abrir modal para cambiar rol
  const handleAbrirModalRol = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNuevoRol(usuario.rol);
    setModalActivo(true);
    setError('');
  };

  // Guardar nuevo rol
  const handleGuardarRol = async () => {
    if (nuevoRol === usuarioSeleccionado.rol) {
      setModalActivo(false);
      return;
    }

    setAccionPendiente(true);
    try {
      await actualizarRolUsuario(usuarioSeleccionado.id, nuevoRol);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioSeleccionado.id ? { ...u, rol: nuevoRol } : u
        )
      );
      setModalActivo(false);
      setUsuarioSeleccionado(null);
      setNuevoRol('');
      setError('');
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      setError(err.message || 'No se pudo actualizar el rol del usuario.');
      // Limpiar error después de 5 segundos
      setTimeout(() => setError(''), 5000);
    } finally {
      setAccionPendiente(false);
    }
  };

  const estadisticas = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo !== false).length,
      inactivos: usuarios.filter((u) => u.activo === false).length,
      admins: usuarios.filter((u) => u.rol === 'admin').length,
      proveedores: usuarios.filter((u) => u.rol === 'proveedor').length,
      usuarios: usuarios.filter((u) => u.rol === 'usuario').length,
    }),
    [usuarios]
  );

  return (
    <div className="au-page">
      <aside className="au-sidebar">
        <div className="au-brand">
          <div className="au-brand__icon">🐾</div>
          <div>
            <p className="au-brand__name">PetGo</p>
            <p className="au-brand__sub">Panel administrativo</p>
          </div>
        </div>

        <nav className="au-menu" aria-label="Menu admin">
          <button
            type="button"
            className="au-menu__item"
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="au-menu__item au-menu__item--active"
            onClick={() => navigate('/admin/usuarios')}
          >
            Gestion de usuarios
          </button>
          <button
            type="button"
            className="au-menu__item"
            onClick={() => navigate('/servicios')}
          >
            Ver marketplace
          </button>
        </nav>
      </aside>

      <main className="au-main">
        <div className="au-shell">
          <div className="au-header">
            <div>
              <h1 className="au-title">Gestion de usuarios</h1>
              <p className="au-subtitle">Administra roles, estado y permisos de usuarios.</p>
            </div>
            <div className="au-pills">
              <span className="au-pill">Rol: Admin</span>
              <span className="au-pill">Usuarios: {usuariosFiltrados.length}</span>
            </div>
          </div>

          {error && <div className="au-error">{error}</div>}

          <div className="au-stats">
            <div className="au-stat">
              <p className="au-stat__label">Total</p>
              <p className="au-stat__value">{estadisticas.total}</p>
            </div>
            <div className="au-stat">
              <p className="au-stat__label">Activos</p>
              <p className="au-stat__value">{estadisticas.activos}</p>
            </div>
            <div className="au-stat">
              <p className="au-stat__label">Inactivos</p>
              <p className="au-stat__value">{estadisticas.inactivos}</p>
            </div>
            <div className="au-stat">
              <p className="au-stat__label">Admins</p>
              <p className="au-stat__value">{estadisticas.admins}</p>
            </div>
            <div className="au-stat">
              <p className="au-stat__label">Proveedores</p>
              <p className="au-stat__value">{estadisticas.proveedores}</p>
            </div>
            <div className="au-stat">
              <p className="au-stat__label">Usuarios</p>
              <p className="au-stat__value">{estadisticas.usuarios}</p>
            </div>
          </div>

          <div className="au-controls">
            <input
              className="au-search"
              type="search"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="au-filters">
              <select
                className="au-filter"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="todos">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="proveedor">Proveedores</option>
                <option value="usuario">Usuarios</option>
              </select>
              <select
                className="au-filter"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="au-empty">Cargando usuarios...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="au-empty">
              {usuarios.length === 0
                ? 'No hay usuarios en el sistema.'
                : 'No hay usuarios que coincidan con los filtros.'}
            </div>
          ) : (
            <div className="au-table-container">
              <table className="au-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Servicios</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className={usuario.activo === false ? 'au-row--inactive' : ''}>
                      <td>
                        <strong>
                          {usuario.nombre} {usuario.apellido}
                        </strong>
                      </td>
                      <td>{usuario.correo}</td>
                      <td>
                        <span className={`au-badge au-badge--${usuario.rol}`}>
                          {usuario.rol === 'admin'
                            ? 'Admin'
                            : usuario.rol === 'proveedor'
                              ? 'Proveedor'
                              : 'Usuario'}
                        </span>
                      </td>
                      <td>{usuario.rol === 'proveedor' ? (serviciosPorProveedor[usuario.id] || 0) : '-'}</td>
                      <td>
                        <span
                          className={`au-status ${usuario.activo !== false ? 'au-status--active' : 'au-status--inactive'}`}
                        >
                          {usuario.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="au-actions">
                          <button
                            type="button"
                            className="au-action-btn au-action-btn--edit"
                            onClick={() => handleAbrirModalRol(usuario)}
                            disabled={accionPendiente}
                            title="Cambiar rol"
                          >
                            Rol
                          </button>
                          {usuario.activo !== false ? (
                            <button
                              type="button"
                              className="au-action-btn au-action-btn--danger"
                              onClick={() => setUsuarioEnAccion(usuario.id)}
                              disabled={accionPendiente || usuarioEnAccion === usuario.id}
                              title="Desactivar usuario"
                            >
                              {usuarioEnAccion === usuario.id ? 'Confirmar' : 'Desactivar'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="au-action-btn au-action-btn--success"
                              onClick={() => handleActivar(usuario.id)}
                              disabled={accionPendiente}
                              title="Activar usuario"
                            >
                              {accionPendiente ? 'Activando...' : 'Activar'}
                            </button>
                          )}
                          {usuarioEnAccion === usuario.id && usuario.activo !== false && (
                            <button
                              type="button"
                              className="au-action-btn au-action-btn--secondary"
                              onClick={() => setUsuarioEnAccion(null)}
                              disabled={accionPendiente}
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                        {usuarioEnAccion === usuario.id && usuario.activo !== false && (
                          <button
                            type="button"
                            className="au-confirm-btn"
                            onClick={() => handleDesactivar(usuario.id)}
                            disabled={accionPendiente}
                          >
                            {accionPendiente ? 'Desactivando...' : '¿Estás seguro?'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal para cambiar rol */}
      {modalActivo && usuarioSeleccionado && (
        <div className="au-modal-overlay" onClick={() => setModalActivo(false)}>
          <div className="au-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="au-modal__title">Cambiar rol de usuario</h2>
            <p className="au-modal__subtitle">
              {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
            </p>

            <div className="au-modal__content">
              <label className="au-label">Selecciona el nuevo rol:</label>
              <div className="au-role-options">
                {['admin', 'proveedor', 'usuario'].map((rol) => (
                  <label
                    key={rol}
                    className={`au-role-option ${nuevoRol === rol ? 'au-role-option--selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={rol}
                      checked={nuevoRol === rol}
                      onChange={(e) => setNuevoRol(e.target.value)}
                      disabled={accionPendiente}
                    />
                    <span className="au-role-label">
                      {rol === 'admin'
                        ? 'Administrador'
                        : rol === 'proveedor'
                          ? 'Proveedor de servicios'
                          : 'Usuario regular'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="au-modal__actions">
              <button
                type="button"
                className="au-btn au-btn--secondary"
                onClick={() => setModalActivo(false)}
                disabled={accionPendiente}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="au-btn au-btn--primary"
                onClick={handleGuardarRol}
                disabled={accionPendiente || nuevoRol === usuarioSeleccionado.rol}
              >
                {accionPendiente ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
