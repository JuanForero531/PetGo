import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';
// import { loginConCorreo, loginConGoogle } from '../firebase/auth';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Simulación: reemplazar por await loginConCorreo(correo, password)
      const user = {
        rol: correo === 'admin@admin.com' ? 'admin'
          : correo === 'proveedor@proveedor.com' ? 'proveedor'
          : 'usuario'
      };
      if (user.rol === 'proveedor') navigate('/proveedor/nuevo');
      else if (user.rol === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      // Simulación: reemplazar por await loginConGoogle()
      const user = { rol: 'usuario' };
      if (user.rol === 'proveedor') navigate('/proveedor/nuevo');
      else if (user.rol === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError('No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ── PANEL IZQUIERDO ── */}
      <aside className="lp-aside">
        <div className="lp-aside__noise" />
        <div className="lp-aside__glow lp-aside__glow--top" />
        <div className="lp-aside__glow lp-aside__glow--bottom" />

        <div className="lp-brand">
          <div className="lp-brand__paw">🐾</div>
          <p className="lp-brand__name">Pet<span>GO</span></p>
          <p className="lp-brand__city">Tunja · Boyacá</p>
        </div>

        <div className="lp-hero">
          <h1 className="lp-hero__headline">
            El mejor cuidado<br />para tu<br />
            <em>compañero fiel.</em>
          </h1>
          <div className="lp-hero__divider" />
          <p className="lp-hero__sub">
            Baños, cortes, paseos y cuidado a domicilio — todo en un solo lugar.
          </p>
        </div>

        <ul className="lp-pills">
          {['Proveedores verificados', 'Servicios a domicilio', 'Fácil y gratuito'].map(t => (
            <li key={t} className="lp-pill">{t}</li>
          ))}
        </ul>

        <div className="lp-aside__paw-bg">🐾</div>
      </aside>

      {/* ── PANEL DERECHO ── */}
      <main className="lp-main">
        <div className="lp-card">

          <header className="lp-card__header">
            <p className="lp-card__eyebrow">Bienvenido de vuelta</p>
            <h2 className="lp-card__title">Inicia sesión</h2>
            <p className="lp-card__sub">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="lp-link">Regístrate gratis</Link>
            </p>
          </header>

          {error && (
            <div className="lp-error" role="alert">
              <span className="lp-error__icon">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="lp-form">

            {/* Correo */}
            <div className="lp-field">
              <label htmlFor="correo" className="lp-field__label">
                Correo electrónico
              </label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon">✉️</span>
                <input
                  id="correo"
                  type="email"
                  className="lp-field__input"
                  placeholder="tucorreo@ejemplo.com"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="lp-field">
              <div className="lp-field__labelrow">
                <label htmlFor="password" className="lp-field__label">
                  Contraseña
                </label>
                <Link to="/recuperar" className="lp-link lp-link--sm">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="lp-field__wrap">
                <span className="lp-field__icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lp-field__input lp-field__input--pass"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-field__eye"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="lp-btn-primary" disabled={loading}>
              {loading
                ? <span className="lp-btn-primary__spinner" />
                : <span>Ingresar →</span>
              }
            </button>

          </form>

          {/* Divider */}
          <div className="lp-divider">
            <span className="lp-divider__line" />
            <span className="lp-divider__text">o continúa con</span>
            <span className="lp-divider__line" />
          </div>

          {/* Google */}
          <button className="lp-btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

        </div>
      </main>
    </div>
  );
}