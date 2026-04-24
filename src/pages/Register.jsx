import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import { registrarUsuario, loginConGoogle } from '../firebase/auth';

const initialState = {
	nombre: '',
	apellido: '',
	correo: '',
	telefono: '',
	password: '',
	confirmPassword: '',
	rol: 'usuario',
	negocio: '',
	tipoServicio: '',
	direccion: '',
	terminos: false,
};

const servicios = [
	'Baño y secado',
	'Corte de pelo',
	'Corte de uñas',
	'Paseo de mascotas',
	'Cuidado a domicilio',
	'Vacunación',
	'Peinado para mascotas',
	'Atención veterinaria',
];

export default function Register() {
	const [form, setForm] = useState(initialState);
	const [proveedorExtra, setProveedorExtra] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [created, setCreated] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleRol = (rol) => {
		setForm({ ...form, rol });
		setProveedorExtra(rol === 'proveedor');
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm({
			...form,
			[name]: type === 'checkbox' ? checked : value,
		});
		if (name === 'password') checkStrength(value);
	};

	const checkStrength = (val) => {
		let score = 0;
		if (val.length >= 8) score++;
		if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
		if (/[^A-Za-z0-9]/.test(val)) score++;
		setPasswordStrength(score);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		// Validación de campos requeridos
		if (!form.nombre?.trim()) {
			setError('El nombre es requerido.');
			return;
		}
		if (!form.apellido?.trim()) {
			setError('El apellido es requerido.');
			return;
		}
		if (!form.correo?.trim()) {
			setError('El correo es requerido.');
			return;
		}
		if (!form.telefono?.trim()) {
			setError('El teléfono es requerido.');
			return;
		}

		// Validación de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(form.correo.trim())) {
			setError('Por favor ingresa un correo válido.');
			return;
		}

		// Validación de contraseña
		if (!form.password || form.password.length < 6) {
			setError('La contraseña debe tener al menos 6 caracteres.');
			return;
		}

		if (form.password !== form.confirmPassword) {
			setError('Las contraseñas no coinciden.');
			return;
		}

		// Validaciones para proveedores
		if (form.rol === 'proveedor') {
			if (!form.negocio?.trim()) {
				setError('El nombre del negocio es requerido para proveedores.');
				return;
			}
			if (!form.tipoServicio) {
				setError('El tipo de servicio es requerido para proveedores.');
				return;
			}
			if (!form.direccion?.trim()) {
				setError('La dirección es requerida para proveedores.');
				return;
			}
		}

		if (!form.terminos) {
			setError('Debes aceptar los términos y condiciones.');
			return;
		}

		setLoading(true);
		const {
			nombre,
			apellido,
			correo,
			telefono,
			password,
			rol,
			negocio,
			tipoServicio,
			direccion,
		} = form;

		try {
			await registrarUsuario(correo.trim(), password, {
				nombre: nombre.trim(),
				apellido: apellido.trim(),
				telefono: telefono.trim(),
				rol,
				nombreNegocio: rol === 'proveedor' ? negocio.trim() : '',
				tipoServicio: rol === 'proveedor' ? tipoServicio : '',
				direccion: rol === 'proveedor' ? direccion.trim() : '',
			});
			setCreated(true);
			if (rol === 'proveedor') {
				navigate('/proveedor/nuevo');
				return;
			}
			navigate('/login');
		} catch (err) {
			console.error('Error al registrar usuario:', err);
			setError(err?.message || 'No se pudo completar el registro. Intenta nuevamente.');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogle = async () => {
		setError('');
		setLoading(true);
		try {
			const { perfil } = await loginConGoogle();
			if (perfil?.rol === 'proveedor') {
				navigate('/proveedor/nuevo');
				return;
			}
			if (perfil?.rol === 'admin') {
				navigate('/admin/dashboard');
				return;
			}
			navigate('/servicios');
		} catch (err) {
			console.error('Error al iniciar con Google desde registro:', err);
			setError(err?.message || 'No se pudo continuar con Google.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="register-body">
			<div className="left-panel">
				<div className="brand">
					<div className="brand-icon">🐾</div>
					<div className="brand-name">Pet<span>Servicios</span></div>
					<div className="brand-sub">Tunja, Boyacá</div>
				</div>
				<div className="left-content">
					<h2 className="left-headline">Tu mascota merece el mejor <em>cuidado</em></h2>
					<p className="left-desc">Conectamos a dueños de mascotas con los mejores proveedores de servicios en Tunja. Baños, cortes, paseos y más.</p>
				</div>
				<div className="features">
					<div className="feature-item"><div className="feature-dot"></div> Proveedores verificados en Tunja</div>
					<div className="feature-item"><div className="feature-dot"></div> Baños, cortes, paseos y cuidado a domicilio</div>
					<div className="feature-item"><div className="feature-dot"></div> Registro gratuito para usuarios y proveedores</div>
					<div className="feature-item"><div className="feature-dot"></div> Gestión sencilla de tus servicios</div>
				</div>
			</div>
			<div className="right-panel">
				<div className="form-container">
					<div className="form-header">
						<h1>Crear cuenta</h1>
						<p>¿Ya tienes una cuenta? <a href="/login">Inicia sesión aquí</a></p>
					</div>
					<div className="rol-selector">
						<div className={`rol-card${form.rol === 'usuario' ? ' active' : ''}`} onClick={() => handleRol('usuario')}>
							<div className="rol-icon">🐶</div>
							<div className="rol-title">Soy dueño</div>
							<div className="rol-desc">Busco servicios para mi mascota</div>
						</div>
						<div className={`rol-card${form.rol === 'proveedor' ? ' active' : ''}`} onClick={() => handleRol('proveedor')}>
							<div className="rol-icon">✂️</div>
							<div className="rol-title">Soy proveedor</div>
							<div className="rol-desc">Ofrezco servicios para mascotas</div>
						</div>
					</div>
					<form onSubmit={handleSubmit} autoComplete="off">
						{error && <div role="alert" style={{ marginBottom: '12px', color: '#b42318' }}>{error}</div>}
						<div className="form-row">
							<div className="field">
								<label>Nombre <span className="required">*</span></label>
								<div className="input-wrap">
									<span className="icon">👤</span>
									<input name="nombre" type="text" placeholder="Ej: Juan" value={form.nombre} onChange={handleChange} required />
								</div>
							</div>
							<div className="field">
								<label>Apellido <span className="required">*</span></label>
								<div className="input-wrap">
									<span className="icon">👤</span>
									<input name="apellido" type="text" placeholder="Ej: Forero" value={form.apellido} onChange={handleChange} required />
								</div>
							</div>
						</div>
						<div className="field">
							<label>Correo electrónico <span className="required">*</span></label>
							<div className="input-wrap">
								<span className="icon">✉️</span>
								<input name="correo" type="email" placeholder="ejemplo@correo.com" value={form.correo} onChange={handleChange} required />
							</div>
						</div>
						<div className="field">
							<label>Teléfono <span className="required">*</span></label>
							<div className="input-wrap">
								<span className="icon">📱</span>
								<input name="telefono" type="tel" placeholder="300 123 4567" value={form.telefono} onChange={handleChange} required />
							</div>
						</div>
						<div className="field">
							<label>Contraseña <span className="required">*</span></label>
							<div className="input-wrap">
								<span className="icon">🔒</span>
								<input name="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} required />
							</div>
							<div className="password-strength">
								<div className={`strength-bar${passwordStrength >= 1 ? ' filled-weak' : ''}`}></div>
								<div className={`strength-bar${passwordStrength >= 2 ? ' filled-medium' : ''}`}></div>
								<div className={`strength-bar${passwordStrength === 3 ? ' filled-strong' : ''}`}></div>
								<span className="strength-label">
									{passwordStrength === 1 ? 'Débil' : passwordStrength === 2 ? 'Media' : passwordStrength === 3 ? 'Fuerte' : ''}
								</span>
							</div>
						</div>
						<div className="field">
							<label>Confirmar contraseña <span className="required">*</span></label>
							<div className="input-wrap">
								<span className="icon">🔒</span>
								<input name="confirmPassword" type="password" placeholder="Repite tu contraseña" value={form.confirmPassword} onChange={handleChange} required />
							</div>
						</div>
						{proveedorExtra && (
							<div className="proveedor-extra visible">
								<div className="section-label">🐾 Información de proveedor</div>
								<div className="field">
									<label>Nombre del negocio <span className="required">*</span></label>
									<div className="input-wrap">
										<span className="icon">🏪</span>
										<input name="negocio" type="text" placeholder="Ej: PetCare Tunja" value={form.negocio} onChange={handleChange} />
									</div>
								</div>
								<div className="field">
									<label>Tipo de servicio principal <span className="required">*</span></label>
									<div className="input-wrap">
										<span className="icon">🐾</span>
										<select name="tipoServicio" value={form.tipoServicio} onChange={handleChange} required>
											<option value="" disabled>Selecciona un servicio</option>
											{servicios.map(s => <option key={s} value={s}>{s}</option>)}
										</select>
									</div>
								</div>
								<div className="field">
									<label>Dirección en Tunja</label>
									<div className="input-wrap">
										<span className="icon">📍</span>
										<input name="direccion" type="text" placeholder="Ej: Cra 10 #23-45, Centro" value={form.direccion} onChange={handleChange} />
									</div>
								</div>
							</div>
						)}
						<div className="checkbox-field">
							<input name="terminos" type="checkbox" checked={form.terminos} onChange={handleChange} />
							<label htmlFor="terminos">Acepto los <a href="#">términos y condiciones</a> y la <a href="#">política de privacidad</a> de PetServicios Tunja</label>
						</div>
						<button type="submit" className="btn-submit" disabled={loading} style={created ? { background: '#7A9E7E' } : {}}>
							<span>{loading ? 'Creando cuenta...' : created ? '✓ Cuenta creada' : 'Crear cuenta gratis'}</span>
						</button>
						{!proveedorExtra ? (
							<>
								<div className="divider"><span>o regístrate con</span></div>
								<button type="button" className="btn-google" onClick={handleGoogle} disabled={loading}>
									<svg className="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
									Continuar con Google
								</button>
							</>
						) : (
							<div className="divider"><span>Registro de proveedor solo con formulario completo</span></div>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}