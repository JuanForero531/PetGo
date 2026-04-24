import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { obtenerServicio, obtenerUsuario } from '../firebase/firestore';
import '../styles/ServiceDetail.css';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [servicio, setServicio] = useState(null);
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarServicio = async () => {
      setLoading(true);
      setError('');
      setProveedor(null);

      try {
        const data = await obtenerServicio(id);
        if (!data || data.activo === false) {
          setError('El servicio no está disponible en este momento.');
          setServicio(null);
          return;
        }
        setServicio(data);

        if (data.proveedorId) {
          const perfilProveedor = await obtenerUsuario(data.proveedorId);
          setProveedor(perfilProveedor);
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
  }, [id]);

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
            <span className="sd-chip">{servicio.tipo}</span>
            <h1 className="sd-title">{servicio.nombreNegocio}</h1>
            <p className="sd-desc">{servicio.descripcion}</p>

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
                <strong>{proveedor?.nombreNegocio || servicio.nombreNegocio || 'No disponible'}</strong>
              </div>
              <div className="sd-item">
                <span className="sd-label">Teléfono del proveedor</span>
                <strong>{proveedor?.telefono || 'No disponible'}</strong>
              </div>
              {proveedor?.correo && (
                <div className="sd-item">
                  <span className="sd-label">Correo del proveedor</span>
                  <a href={`mailto:${proveedor.correo}`} className="sd-link">
                    {proveedor.correo}
                  </a>
                </div>
              )}
            </div>

            <div className="sd-actions">
              <button 
                type="button" 
                className="sd-btn sd-btn--primary"
                onClick={() => proveedor && navigate(`/proveedor/${proveedor.id}`)}
                disabled={!proveedor}
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
