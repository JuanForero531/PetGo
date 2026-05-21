import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerSolicitudesPorCliente, obtenerResumenResenasDelServicio } from '../firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/ProviderProfile.css';

export default function ClientHiredServices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puntuaciones, setPuntuaciones] = useState({});

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
      try {
        if (!user?.uid) return;
        const datos = await obtenerSolicitudesPorCliente(user.uid);
        setSolicitudes(datos);

        // Cargar puntuaciones para cada servicio
        const puntuacionesMap = {};
        for (const solicitud of datos) {
          try {
            const resumen = await obtenerResumenResenasDelServicio(solicitud.servicioId);
            puntuacionesMap[solicitud.servicioId] = resumen;
          } catch (err) {
            console.warn(`No fue posible cargar puntuación para servicio ${solicitud.servicioId}:`, err);
            puntuacionesMap[solicitud.servicioId] = { promedio: 0, total: 0 };
          }
        }
        setPuntuaciones(puntuacionesMap);
      } catch (err) {
        console.error(err);
        setError('No fue posible cargar tus servicios contratados.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.uid]);

  const formatearFecha = (valor) => {
    if (!valor) return 'Sin fecha';
    const fecha = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente de aceptación',
      aceptada: 'Aceptada',
      rechazada: 'Rechazada',
      completada: 'Completada',
    };
    return labels[estado] || estado;
  };

  return (
    <div>
      <Navbar />
      <main className="pp-root">
        <section className="pp-requests">
          <header className="pp-requests__header">
            <div>
              <h2 className="pp-requests__title">Mis servicios contratados</h2>
              <p className="pp-requests__subtitle">Aquí puedes ver el estado de tus contrataciones y gestionar tus reseñas.</p>
            </div>
            <span className="pp-requests__count">{solicitudes.length} servicio{solicitudes.length === 1 ? '' : 's'}</span>
          </header>

          {loading ? (
            <div className="pp-empty"><p>Cargando servicios...</p></div>
          ) : solicitudes.length === 0 ? (
            <div className="pp-empty">
              <p>Aún no has contratado servicios.</p>
              <button
                type="button"
                className="pp-btn-back"
                onClick={() => navigate('/servicios')}
                style={{ marginTop: '20px' }}
              >
                Ver servicios disponibles
              </button>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <span className={`pp-request-status pp-request-status--${solicitud.estado}`}>
                        {getEstadoLabel(solicitud.estado)}
                      </span>
                      {puntuaciones[solicitud.servicioId]?.promedio > 0 && (
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.14)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#8a4f17',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            textAlign: 'center',
                          }}
                        >
                          ⭐ {puntuaciones[solicitud.servicioId].promedio.toFixed(1)} ({puntuaciones[solicitud.servicioId].total} reseña{puntuaciones[solicitud.servicioId].total !== 1 ? 's' : ''})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pp-request-card__grid">
                    <div>
                      <span className="pp-request-label">Proveedor</span>
                      <strong>
                        {solicitud.proveedorSnapshot?.nombre || 'Proveedor'} {solicitud.proveedorSnapshot?.apellido || ''}
                      </strong>
                    </div>
                    <div>
                      <span className="pp-request-label">Contacto</span>
                      <strong>{solicitud.proveedorSnapshot?.telefono || solicitud.proveedorSnapshot?.email || 'No disponible'}</strong>
                    </div>
                    <div>
                      <span className="pp-request-label">Fecha solicitud</span>
                      <strong>{formatearFecha(solicitud.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="pp-request-label">Preferencia contacto</span>
                      <strong>{solicitud.canalContacto || 'No indicada'}</strong>
                    </div>
                  </div>

                  {solicitud.mensaje && <p className="pp-request-message"><strong>Mensaje:</strong> {solicitud.mensaje}</p>}

                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pp-btn-back"
                      onClick={() => navigate(`/servicios/${solicitud.servicioId}`)}
                    >
                      Ver servicio
                    </button>
                    {solicitud.estado === 'aceptada' && (
                      <span style={{ fontSize: '0.9rem', color: '#6b7280', alignSelf: 'center' }}>
                        ✓ El proveedor ha aceptado tu solicitud
                      </span>
                    )}
                    {solicitud.estado === 'rechazada' && (
                      <span style={{ fontSize: '0.9rem', color: '#991b1b', alignSelf: 'center' }}>
                        ✗ La solicitud fue rechazada
                      </span>
                    )}
                    {solicitud.estado === 'completada' && (
                      <span style={{ fontSize: '0.9rem', color: '#0f7a52', alignSelf: 'center' }}>
                        ✓ Servicio completado. ¡Puedes dejar tu reseña!
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {error && <div className="pp-empty pp-empty--error"><p>{error}</p></div>}
        </section>

        <button className="pp-btn-back" onClick={() => navigate('/servicios')}>
          ← Volver al marketplace
        </button>
      </main>
      <Footer />
    </div>
  );
}
