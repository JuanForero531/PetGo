import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/RecoverPassword.css';
// import { recuperarContrasena } from '../firebase/auth';

export default function RecoverPassword() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Simulación: reemplazar por await recuperarContrasena(correo)
      // await recuperarContrasena(correo);
      await new Promise(res => setTimeout(res, 1000)); // simula delay
      setEnviado(true);
    } catch (err) {
      setError('No encontramos una cuenta con ese correo. Verifica e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-root">

      {/* ── PANEL IZQUIERDO ── */}
      <aside className="rp-aside">
        <div className="rp-aside__glow rp-aside__glow--top" />
        <div className="rp-aside__glow rp-aside__glow--bottom" />
        <div className="rp-aside__paw-bg">🐾</div>

        <div className="rp-brand">
          <div className="rp-brand__paw">🐾</div>
          <p className="rp-brand__name">Pet<span>GO</span></p>
          <p className="rp-brand__city">Tunja · Boyacá</p>
        </div>

        <div className="rp-hero">
          <h1 className="rp-hero__headline">
            ¿Olvidaste tu<br />
            <em>contraseña?</em>
          </h1>
          <p className="rp-hero__sub">
            No te preocupes. Te enviamos un correo para que puedas recuperar el acceso a tu cuenta en segundos.
          </p>
        </div>

        <ul className="rp-steps">
          <li className="rp-step">
            <div className="rp-step__num">1</div>
            <span>Ingresa tu correo registrado</span>
          </li>
          <li className="rp-step">
            <div className="rp-step__num">2</div>
            <span>Revisa tu bandeja de entrada</span>
          </li>
          <li className="rp-step">
            <div className="rp-step__num">3</div>
            <span>Sigue el enlace para crear una nueva contraseña</span>
          </li>
        </ul>
      </aside>

      {/* ── PANEL DERECHO ── */}
      <main className="rp-main">
        <div className="rp-card">

          {!enviado ? (
            <>
              <header className="rp-card__header">
                <p className="rp-card__eyebrow">Recuperar acceso</p>
                <h2 className="rp-card__title">Restablecer contraseña</h2>
                <p className="rp-card__sub">
                  Ingresa el correo con el que te registraste y te enviaremos un enlace de recuperación.
                </p>
              </header>

              {error && (
                <div className="rp-error" role="alert">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="rp-form">
                <div className="rp-field">
                  <label htmlFor="correo" className="rp-field__label">
                    Correo electrónico
                  </label>
                  <div className="rp-field__wrap">
                    <span className="rp-field__icon">✉️</span>
                    <input
                      id="correo"
                      type="email"
                      className="rp-field__input"
                      placeholder="tucorreo@ejemplo.com"
                      value={correo}
                      onChange={e => setCorreo(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="rp-btn-primary" disabled={loading}>
                  {loading
                    ? <span className="rp-spinner" />
                    : <span>Enviar enlace de recuperación</span>
                  }
                </button>
              </form>

              <div className="rp-footer-links">
                <Link to="/login" className="rp-link">← Volver a iniciar sesión</Link>
                <Link to="/registro" className="rp-link">Crear cuenta nueva</Link>
              </div>
            </>
          ) : (
            /* ── ESTADO: CORREO ENVIADO ── */
            <div className="rp-success">
              <div className="rp-success__icon">📬</div>
              <h2 className="rp-success__title">¡Correo enviado!</h2>
              <p className="rp-success__msg">
                Enviamos un enlace de recuperación a <strong>{correo}</strong>.
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
              <p className="rp-success__note">
                ¿No lo ves? Revisa tu carpeta de spam o correo no deseado.
              </p>
              <Link to="/login" className="rp-btn-primary rp-btn-primary--link">
                Volver a iniciar sesión
              </Link>
              <button
                className="rp-btn-ghost"
                onClick={() => { setEnviado(false); setCorreo(''); }}
              >
                Usar otro correo
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}