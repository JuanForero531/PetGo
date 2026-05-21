import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  obtenerSolicitudesPorProveedor,
  responderSolicitudServicio,
} from '../firebase/firestore';
import '../styles/ProviderProfile.css';

export default function ProviderRequests() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gestionandoId, setGestionandoId] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
      try {
        if (!user?.uid) return;
        const dades = await obtenerSolicitudesPorProveedor(user.uid);
        setSolicitudes(dades);
      } catch (err) {
        console.error(err);
        setError('No fue posible cargar las solicitudes.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.uid]);

  const handleGestionarSolicitud = async (solicitudId, estado) => {
    setGestionandoId(solicitudId);
    setError('');
    try {
      await responderSolicitudServicio({ solicitudId, proveedorId: user.uid, estado });
      const listas = await obtenerSolicitudesPorProveedor(user.uid);
      setSolicitudes(listas);
    } catch (err) {
      console.error(err);
      setError('No fue posible actualizar la solicitud.');
    } finally {
      setGestionandoId('');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="pp-root">
        <section className="pp-requests">
          <header className="pp-requests__header">
            <div>
              <h2 className="pp-requests__title">Solicitudes de contratación</h2>
              <p className="pp-requests__subtitle">Acepta o rechaza las solicitudes que llegan a tus servicios.</p>
            </div>
            <span className="pp-requests__count">{solicitudes.length} solicitud{solicitudes.length === 1 ? '' : 'es'}</span>
          </header>

          {loading ? (
            <div className="pp-empty"><p>Cargando solicitudes...</p></div>
          ) : solicitudes.length === 0 ? (
            <div className="pp-empty"><p>Aún no tienes solicitudes registradas.</p></div>
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
                      <strong>{solicitud.createdAt ? (typeof solicitud.createdAt.toDate === 'function' ? solicitud.createdAt.toDate().toLocaleDateString() : new Date(solicitud.createdAt).toLocaleDateString()) : 'Sin fecha'}</strong>
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

          {error && <div className="pp-empty pp-empty--error"><p>{error}</p></div>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
