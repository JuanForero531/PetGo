import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  crearResenaServicio,
  crearSolicitudServicio,
  marcarSolicitudComoCompletada,
  obtenerResumenResenasDelServicio,
  obtenerServicio,
  obtenerSolicitudesPorCliente,
  obtenerUsuario,
} from '../firebase/firestore';
import '../styles/ServiceDetail.css';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [servicio, setServicio] = useState(null);
  const [proveedor, setProveedor] = useState(null);
  const [solicitudCliente, setSolicitudCliente] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [resumenResenas, setResumenResenas] = useState({ total: 0, promedio: 0 });
  const [solicitando, setSolicitando] = useState(false);
  const [guardandoResena, setGuardandoResena] = useState(false);
  const [completando, setCompletando] = useState(false);
  const [requestForm, setRequestForm] = useState({ mensaje: '', canalContacto: '' });
  const [reviewForm, setReviewForm] = useState({ rating: '5', review: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const proveedorVisible = proveedor || servicio?.proveedorSnapshot || null;

  useEffect(() => {
    const cargarServicio = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      setProveedor(null);
      setSolicitudCliente(null);
      setResenas([]);
      setResumenResenas({ total: 0, promedio: 0 });

      try {
        const data = await obtenerServicio(id);

        if (!data || data.activo === false) {
          setError('El servicio no está disponible en este momento.');
          setServicio(null);
          return;
        }
        setServicio(data);

        if (user?.uid) {
          try {
            const solicitudesCliente = await obtenerSolicitudesPorCliente(user.uid);
            const solicitudActual = solicitudesCliente.find((solicitud) => solicitud.servicioId === data.id);
            setSolicitudCliente(solicitudActual || null);
          } catch (requestError) {
            console.warn('No fue posible cargar solicitudes previas:', requestError);
            setSolicitudCliente(null);
          }
        }

        try {
          const resumen = await obtenerResumenResenasDelServicio(data.id);
          setResenas(resumen.resenas);
          setResumenResenas({ total: resumen.total, promedio: resumen.promedio });
        } catch (reviewError) {
          console.warn('No fue posible cargar reseñas:', reviewError);
          setResenas([]);
          setResumenResenas({ total: 0, promedio: 0 });
        }

        if (data.proveedorId) {
          try {
            const perfilProveedor = await obtenerUsuario(data.proveedorId);
            setProveedor(perfilProveedor);
          } catch (providerError) {
            console.warn('No fue posible cargar el perfil del proveedor:', providerError);
          }
        }
      } catch (err) {
        console.error('Error al cargar detalle del servicio:', err);
        setError('No fue posible cargar el detalle del servicio.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarServicio();
    }
  }, [id, user?.uid]);

  const miResena = useMemo(
    () => resenas.find((resena) => resena.clienteId === user?.uid) || null,
    [resenas, user?.uid]
  );

  const puedeSolicitar = Boolean(
    user?.uid &&
    servicio?.id &&
    servicio?.proveedorId &&
    user.uid !== servicio.proveedorId &&
    (!solicitudCliente || ['rechazada', 'completada'].includes(solicitudCliente.estado))
  );

  const puedeResenar = Boolean(
    user?.uid &&
    solicitudCliente?.estado === 'completada' &&
    !miResena
  );

  const formatearFecha = (valor) => {
    if (!valor) return 'Sin fecha';
    const fecha = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleSolicitar = async () => {
    if (!user?.uid || !servicio) {
      navigate('/login');
      return;
    }

    setSolicitando(true);
    setError('');
    setSuccess('');

    try {
      const servicioCompleto = {
        ...servicio,
        proveedor: proveedorVisible,
      };
      await crearSolicitudServicio({
        servicio: servicioCompleto,
        clienteId: user.uid,
        mensaje: requestForm.mensaje.trim(),
        canalContacto: requestForm.canalContacto.trim(),
        clienteSnapshot: {
          nombre: perfil?.nombre || '',
          apellido: perfil?.apellido || '',
          correo: perfil?.correo || '',
          telefono: perfil?.telefono || '',
        },
      });

      setSolicitudCliente({
        id: 'local-pending',
        servicioId: servicio.id,
        proveedorId: servicio.proveedorId,
        clienteId: user.uid,
        estado: 'pendiente',
        mensaje: requestForm.mensaje.trim(),
        canalContacto: requestForm.canalContacto.trim(),
        clienteSnapshot: {
          nombre: perfil?.nombre || '',
          apellido: perfil?.apellido || '',
          correo: perfil?.correo || '',
          telefono: perfil?.telefono || '',
        },
      });
      setRequestForm({ mensaje: '', canalContacto: '' });
      setSuccess('Solicitud enviada. El proveedor la revisará y podrás seguir el estado aquí.');
    } catch (err) {
      console.error('Error al crear la solicitud:', err);
      setError(err.message || 'No fue posible enviar la solicitud.');
    } finally {
      setSolicitando(false);
    }
  };

  const handleCompletar = async () => {
    if (!solicitudCliente?.id || !user?.uid) return;

    setCompletando(true);
    setError('');
    setSuccess('');

    try {
      await marcarSolicitudComoCompletada({
        solicitudId: solicitudCliente.id,
        clienteId: user.uid,
      });

      const solicitudesCliente = await obtenerSolicitudesPorCliente(user.uid);
      const solicitudActualizada = solicitudesCliente.find((solicitud) => solicitud.servicioId === servicio.id) || null;
      setSolicitudCliente(solicitudActualizada);
      setSuccess('Contratación confirmada. Ya puedes dejar tu puntuación y reseña.');
    } catch (err) {
      console.error('Error al completar la solicitud:', err);
      setError(err.message || 'No fue posible confirmar la contratación.');
    } finally {
      setCompletando(false);
    }
  };

  const handleEnviarResena = async () => {
    if (!solicitudCliente?.id || !servicio?.id || !proveedor?.id || !user?.uid) return;

    setGuardandoResena(true);
    setError('');
    setSuccess('');

    try {
      await crearResenaServicio({
        solicitudId: solicitudCliente.id,
        servicioId: servicio.id,
        proveedorId: proveedor.id,
        clienteId: user.uid,
        rating: reviewForm.rating,
        review: reviewForm.review,
      });

      const resumen = await obtenerResumenResenasDelServicio(servicio.id);
      setResenas(resumen.resenas);
      setResumenResenas({ total: resumen.total, promedio: resumen.promedio });
      setReviewForm({ rating: '5', review: '' });
      setSuccess('Tu reseña fue publicada correctamente.');
    } catch (err) {
      console.error('Error al guardar la reseña:', err);
      setError(err.message || 'No fue posible guardar la reseña.');
    } finally {
      setGuardandoResena(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="sd-root">
        {loading ? (
          <div className="sd-state">Cargando detalle...</div>
        ) : error ? (
          <div className="sd-state">{error}</div>
        ) : (
          <article className="sd-card">
            <div className="sd-hero">
              <div>
                <span className="sd-chip">{servicio.tipo}</span>
                {proveedorVisible?.esPremium && <span className="sd-chip sd-chip--premium">Premium</span>}
                <h1 className="sd-title">{servicio.nombreNegocio}</h1>
                <p className="sd-desc">{servicio.descripcion}</p>
              </div>

              <div className="sd-rating">
                <strong>{resumenResenas.promedio ? resumenResenas.promedio.toFixed(1) : '0.0'}</strong>
                <span>Calificación media</span>
                <small>{resumenResenas.total} reseña{resumenResenas.total === 1 ? '' : 's'}</small>
              </div>
            </div>

            {success && <div className="sd-state sd-state--success">{success}</div>}

            <div className="sd-grid">
              <div className="sd-item">
                <span className="sd-label">Precio</span>
                <strong>${Number(servicio.precio || 0).toLocaleString('es-CO')}</strong>
              </div>
              <div className="sd-item">
                <span className="sd-label">Dirección</span>
                <strong>{servicio.direccion}</strong>
              </div>
              <div className="sd-item">
                <span className="sd-label">Nombre del negocio</span>
                <strong>{proveedorVisible?.nombreNegocio || servicio.nombreNegocio || 'No disponible'}</strong>
              </div>
              <div className="sd-item">
                <span className="sd-label">Proveedor</span>
                <strong>{proveedorVisible ? `${proveedorVisible.nombre || ''} ${proveedorVisible.apellido || ''}`.trim() || 'No disponible' : 'No disponible'}</strong>
              </div>
              {proveedorVisible?.telefono && (
                <div className="sd-item">
                  <span className="sd-label">Teléfono del proveedor</span>
                  <a href={`tel:${proveedorVisible.telefono}`} className="sd-link">
                    {proveedorVisible.telefono}
                  </a>
                </div>
              )}
              {proveedorVisible?.correo && (
                <div className="sd-item">
                  <span className="sd-label">Correo del proveedor</span>
                  <a href={`mailto:${proveedorVisible.correo}`} className="sd-link">
                    {proveedorVisible.correo}
                  </a>
                </div>
              )}
            </div>

            <section className="sd-section">
              <div className="sd-section__head">
                <div>
                  <p className="sd-kicker">Contratación</p>
                  <h2>Solicita el servicio y contacta al proveedor</h2>
                </div>
                {solicitudCliente && <span className={`sd-status sd-status--${solicitudCliente.estado}`}>{solicitudCliente.estado}</span>}
              </div>

              <div className="sd-booking">
                <div className="sd-booking__contact">
                  <strong>Datos de contacto</strong>
                  <p>{proveedorVisible?.telefono || 'Teléfono no disponible'}</p>
                  <p>{proveedorVisible?.correo || 'Correo no disponible'}</p>
                  <button type="button" className="sd-btn sd-btn--secondary" onClick={() => navigate(servicio?.proveedorId ? `/proveedor/${servicio.proveedorId}` : '/servicios')} disabled={!servicio?.proveedorId}>
                    Ver perfil del proveedor
                  </button>
                </div>

                <div className="sd-booking__form">
                  {!user?.uid ? (
                    <div className="sd-note">
                      <p>Inicia sesión para solicitar la contratación.</p>
                      <button type="button" className="sd-btn sd-btn--primary" onClick={() => navigate('/login')}>
                        Ir a iniciar sesión
                      </button>
                    </div>
                  ) : (
                    <>
                      {puedeSolicitar ? (
                        <>
                          <label className="sd-field">
                            <span className="sd-label">Mensaje para el proveedor</span>
                            <textarea
                              className="sd-textarea"
                              rows="4"
                              value={requestForm.mensaje}
                              onChange={(e) => setRequestForm((prev) => ({ ...prev, mensaje: e.target.value }))}
                              placeholder="Cuéntale al proveedor qué necesitas, fecha tentativa y detalles del servicio."
                            />
                          </label>
                          <label className="sd-field">
                            <span className="sd-label">Cómo prefieres que te contacten</span>
                            <input
                              className="sd-input"
                              type="text"
                              value={requestForm.canalContacto}
                              onChange={(e) => setRequestForm((prev) => ({ ...prev, canalContacto: e.target.value }))}
                              placeholder="WhatsApp, llamada o correo"
                            />
                          </label>
                          <button type="button" className="sd-btn sd-btn--primary" onClick={handleSolicitar} disabled={solicitando}>
                            {solicitando ? 'Enviando solicitud...' : 'Confirmar contratación'}
                          </button>
                        </>
                      ) : solicitudCliente ? (
                        <div className="sd-note sd-note--status">
                          <p>
                            {solicitudCliente.estado === 'pendiente' && 'El proveedor todavía no responde tu solicitud.'}
                            {solicitudCliente.estado === 'aceptada' && 'Tu contratación fue aceptada. Confirma el servicio cuando se haya realizado.'}
                            {solicitudCliente.estado === 'rechazada' && 'La solicitud fue rechazada. Puedes enviar otra si lo deseas.'}
                            {solicitudCliente.estado === 'completada' && 'La contratación está cerrada. Si ya lo hiciste, deja tu reseña abajo.'}
                          </p>
                          {solicitudCliente.estado === 'aceptada' && (
                            <button type="button" className="sd-btn sd-btn--primary" onClick={handleCompletar} disabled={completando}>
                              {completando ? 'Confirmando...' : 'Marcar como completado'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="sd-note">
                          <p>No hay una solicitud activa para este servicio.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            <section className="sd-section">
              <div className="sd-section__head">
                <div>
                  <p className="sd-kicker">Reseñas</p>
                  <h2>Experiencias de otros clientes</h2>
                </div>
              </div>

              <div className="sd-reviews-summary">
                <strong>{resumenResenas.promedio ? resumenResenas.promedio.toFixed(1) : '0.0'} / 5</strong>
                <span>{resumenResenas.total} calificación{resumenResenas.total === 1 ? '' : 'es'}</span>
              </div>

              {puedeResenar && (
                <div className="sd-review-form">
                  <label className="sd-field">
                    <span className="sd-label">Tu calificación</span>
                    <select
                      className="sd-input"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={String(value)}>{value} estrella{value === 1 ? '' : 's'}</option>
                      ))}
                    </select>
                  </label>

                  <label className="sd-field sd-field--wide">
                    <span className="sd-label">Tu reseña</span>
                    <textarea
                      className="sd-textarea"
                      rows="4"
                      value={reviewForm.review}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, review: e.target.value }))}
                      placeholder="Cuenta cómo fue la experiencia con el servicio."
                    />
                  </label>

                  <button type="button" className="sd-btn sd-btn--primary" onClick={handleEnviarResena} disabled={guardandoResena}>
                    {guardandoResena ? 'Publicando...' : 'Publicar reseña'}
                  </button>
                </div>
              )}

              <div className="sd-review-list">
                {resenas.length === 0 ? (
                  <div className="sd-note">
                    <p>Aún no hay reseñas publicadas para este servicio.</p>
                  </div>
                ) : (
                  resenas.map((resena) => (
                    <article key={resena.id} className="sd-review-card">
                      <div className="sd-review-card__head">
                        <strong>{'★'.repeat(Math.max(1, Math.round(Number(resena.rating || 0))))}</strong>
                        <span>{formatearFecha(resena.createdAt)}</span>
                      </div>
                      <p>{resena.review}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <div className="sd-actions">
              <button
                type="button"
                className="sd-btn sd-btn--primary"
                onClick={() => servicio?.proveedorId && navigate(`/proveedor/${servicio.proveedorId}`)}
                disabled={!servicio?.proveedorId}
              >
                Ver perfil del proveedor
              </button>
              <button type="button" className="sd-btn sd-btn--secondary" onClick={() => navigate('/servicios')}>
                Volver al listado
              </button>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
