import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
	crearServicio,
	actualizarPerfilProveedor,
	editarServicio,
	eliminarServicio,
	obtenerServicio,
	obtenerServiciosDelProveedor,
} from '../firebase/firestore';
import { cerrarSesion } from '../firebase/auth';
import '../styles/ProviderModule.css';

const PAYPAL_LINK = import.meta.env.VITE_PAYPAL_URL || 'https://www.paypal.com/paypalme/tuusuario';

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

const initialForm = {
	nombreNegocio: '',
	tipo: '',
	descripcion: '',
	precio: '',
	direccion: '',
};

export default function ServiceForm() {
	const navigate = useNavigate();
	const { id } = useParams();
	const { user, perfil, refreshPerfil } = useAuth();

	const [form, setForm] = useState(initialForm);
	const [misServicios, setMisServicios] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savingPerfil, setSavingPerfil] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [perfilForm, setPerfilForm] = useState({
		nombre: '',
		apellido: '',
		correo: '',
		telefono: '',
		nombreNegocio: '',
		tipoServicio: '',
		direccion: '',
	});

	const editMode = useMemo(() => Boolean(id), [id]);
	const [activeTab, setActiveTab] = useState(editMode ? 'servicios' : 'perfil');

	useEffect(() => {
		if (editMode) {
			setActiveTab('servicios');
		}
	}, [editMode]);

	useEffect(() => {
		if (!user?.uid) {
			setLoading(false);
			return;
		}

		const cargar = async () => {
			setLoading(true);
			setError('');
			try {
				const [serviciosProveedor] = await Promise.all([
					obtenerServiciosDelProveedor(user.uid),
				]);
				setMisServicios(serviciosProveedor);

				if (editMode && id) {
					const servicio = await obtenerServicio(id);
					if (!servicio || servicio.proveedorId !== user.uid) {
						setError('No puedes editar este servicio.');
						navigate('/proveedor/nuevo', { replace: true });
						return;
					}
					setForm({
						nombreNegocio: servicio.nombreNegocio || '',
						tipo: servicio.tipo || '',
						descripcion: servicio.descripcion || '',
						precio: String(servicio.precio ?? ''),
						direccion: servicio.direccion || '',
					});
					return;
				}

				setForm((prev) => ({
					...prev,
					nombreNegocio: prev.nombreNegocio || perfil?.nombreNegocio || '',
					tipo: prev.tipo || perfil?.tipoServicio || '',
					direccion: prev.direccion || perfil?.direccion || '',
				}));
			} catch (err) {
				console.error('Error al cargar modulo proveedor:', err);
				setError('No se pudo cargar el modulo de proveedor.');
			} finally {
				setLoading(false);
			}
		};

		cargar();
	}, [user?.uid, perfil?.nombreNegocio, perfil?.tipoServicio, perfil?.direccion, id, editMode, navigate]);

	useEffect(() => {
		setPerfilForm({
			nombre: perfil?.nombre || '',
			apellido: perfil?.apellido || '',
			correo: perfil?.correo || '',
			telefono: perfil?.telefono || '',
			nombreNegocio: perfil?.nombreNegocio || '',
			tipoServicio: perfil?.tipoServicio || '',
			direccion: perfil?.direccion || '',
		});
	}, [perfil]);

	const recargarServicios = async () => {
		if (!user?.uid) return;
		const serviciosProveedor = await obtenerServiciosDelProveedor(user.uid);
		setMisServicios(serviciosProveedor);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handlePerfilChange = (e) => {
		const { name, value } = e.target;
		setPerfilForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleGuardarPerfil = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (!user?.uid) {
			setError('Sesión no válida.');
			return;
		}

		if (!perfilForm.nombre.trim() || !perfilForm.apellido.trim()) {
			setError('Nombre y apellido son requeridos.');
			return;
		}

		if (!perfilForm.correo.trim()) {
			setError('El correo es requerido.');
			return;
		}

		if (!perfilForm.telefono.trim()) {
			setError('El teléfono es requerido.');
			return;
		}

		if (!perfilForm.nombreNegocio.trim()) {
			setError('El nombre del negocio es requerido.');
			return;
		}

		if (!perfilForm.tipoServicio) {
			setError('Selecciona el tipo de servicio principal.');
			return;
		}

		if (!perfilForm.direccion.trim()) {
			setError('La dirección es requerida.');
			return;
		}

		setSavingPerfil(true);
		try {
			await actualizarPerfilProveedor(user.uid, {
				nombre: perfilForm.nombre.trim(),
				apellido: perfilForm.apellido.trim(),
				correo: perfilForm.correo.trim(),
				telefono: perfilForm.telefono.trim(),
				nombreNegocio: perfilForm.nombreNegocio.trim(),
				tipoServicio: perfilForm.tipoServicio,
				direccion: perfilForm.direccion.trim(),
			});

			await refreshPerfil();
			setSuccess('Perfil actualizado correctamente.');
		} catch (err) {
			console.error('Error al actualizar perfil:', err);
			setError(err.message || 'No se pudo actualizar el perfil.');
		} finally {
			setSavingPerfil(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (!user?.uid) {
			setError('Sesion no valida. Inicia sesion de nuevo.');
			return;
		}

		// Validación de campos requeridos
		if (!form.nombreNegocio?.trim()) {
			setError('El nombre del negocio es requerido.');
			return;
		}

		if (!form.tipo) {
			setError('Debes seleccionar un tipo de servicio.');
			return;
		}

		if (!form.descripcion?.trim()) {
			setError('La descripción es requerida.');
			return;
		}

		if (form.descripcion.trim().length < 10) {
			setError('La descripción debe tener al menos 10 caracteres.');
			return;
		}

		if (!form.precio) {
			setError('El precio es requerido.');
			return;
		}

		const precioNum = Number(form.precio);
		if (isNaN(precioNum) || precioNum <= 0) {
			setError('El precio debe ser un número mayor a cero.');
			return;
		}

		if (!form.direccion?.trim()) {
			setError('La dirección es requerida.');
			return;
		}

		setSaving(true);
		try {
			if (editMode && id) {
				await editarServicio(id, {
					nombreNegocio: form.nombreNegocio.trim(),
					tipo: form.tipo,
					descripcion: form.descripcion.trim(),
					precio: precioNum,
					direccion: form.direccion.trim(),
				});
				setSuccess('Servicio actualizado correctamente.');
				navigate('/proveedor/nuevo', { replace: true });
			} else {
				await crearServicio(user.uid, {
					nombreNegocio: form.nombreNegocio.trim(),
					tipo: form.tipo,
					descripcion: form.descripcion.trim(),
					precio: precioNum,
					direccion: form.direccion.trim(),
				});
				setSuccess('Servicio creado correctamente.');
				setForm({
					nombreNegocio: perfil?.nombreNegocio || '',
					tipo: perfil?.tipoServicio || '',
					descripcion: '',
					precio: '',
					direccion: perfil?.direccion || '',
				});
			}

			await recargarServicios();
		} catch (err) {
			console.error('Error al guardar servicio:', err);
			setError('No se pudo guardar el servicio. Intenta nuevamente.');
		} finally {
			setSaving(false);
		}
	};

	const handleEliminar = async (servicioId) => {
		const confirmar = window.confirm('¿Seguro que quieres desactivar este servicio?');
		if (!confirmar) return;

		setError('');
		setSuccess('');
		try {
			await eliminarServicio(servicioId);
			setSuccess('Servicio desactivado correctamente.');
			await recargarServicios();
		} catch (err) {
			console.error('Error al eliminar servicio:', err);
			setError('No se pudo desactivar el servicio.');
		}
	};

	const handleLogout = async () => {
		try {
			await cerrarSesion();
			navigate('/login');
		} catch (err) {
			console.error('Error al cerrar sesion:', err);
			setError('No se pudo cerrar sesion.');
		}
	};

	if (loading) {
		return <div className="pm-empty">Cargando modulo proveedor...</div>;
	}

	return (
		<div className="pm-root">
			<header className="pm-header">
				<div className="pm-actions">
					<button type="button" className="pm-action-btn" onClick={() => navigate('/servicios')}>
						Ver servicios
					</button>
					<button type="button" className="pm-action-btn pm-action-btn--ghost" onClick={handleLogout}>
						Cerrar sesion
					</button>
				</div>
				<h1 className="pm-title">Modulo de proveedor</h1>
				<p className="pm-desc">Publica y administra tus servicios para mascotas en Tunja.</p>
				{perfil?.rol === 'proveedor' && (
					<div className={`pm-premium ${perfil?.esPremium ? 'pm-premium--active' : ''}`}>
						<div>
							<p className="pm-premium__eyebrow">Estado premium</p>
							<h2 className="pm-premium__title">
								{perfil?.esPremium ? 'Tu perfil ya está destacado' : 'Hazte premium y gana visibilidad'}
							</h2>
							<p className="pm-premium__desc">
								{perfil?.esPremium
									? 'Tu perfil puede mostrarse antes en el marketplace y destacar frente a otros proveedores.'
									: 'Recibe más visibilidad, recomendación prioritaria y una presencia destacada en la página principal.'}
							</p>
						</div>
						<div className="pm-premium__actions">
							{perfil?.esPremium ? (
								<span className="pm-premium__badge">Proveedor premium activo</span>
							) : (
								<>
									<a className="pm-premium__btn" href={PAYPAL_LINK} target="_blank" rel="noreferrer">
										Pagar con PayPal
									</a>
									<p className="pm-premium__hint">Usa tu enlace de PayPal directo para habilitar el plan premium.</p>
								</>
							)}
						</div>
					</div>
				)}
			</header>

			{error && <div className="pm-alert pm-alert--error">{error}</div>}
			{success && <div className="pm-alert pm-alert--success">{success}</div>}

			<div className="pm-tabs" role="tablist" aria-label="Módulo del proveedor">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'perfil'}
					className={`pm-tab ${activeTab === 'perfil' ? 'pm-tab--active' : ''}`}
					onClick={() => setActiveTab('perfil')}
				>
					<span className="pm-tab__icon" aria-hidden="true">👤</span>
					<span>Mi perfil</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'servicios'}
					className={`pm-tab ${activeTab === 'servicios' ? 'pm-tab--active' : ''}`}
					onClick={() => setActiveTab('servicios')}
				>
					<span className="pm-tab__icon" aria-hidden="true">🧰</span>
					<span>Mis servicios</span>
				</button>
			</div>

			{activeTab === 'perfil' && (
				<div className="pm-tab-content" role="tabpanel" aria-label="Editar perfil">
				<section className="pm-panel">
					<h2 className="pm-subtitle">Editar perfil del proveedor</h2>
					<form className="pm-form" onSubmit={handleGuardarPerfil}>
						<div className="pm-row">
							<label className="pm-field">
								Nombre
								<input
									name="nombre"
									value={perfilForm.nombre}
									onChange={handlePerfilChange}
									required
								/>
							</label>
							<label className="pm-field">
								Apellido
								<input
									name="apellido"
									value={perfilForm.apellido}
									onChange={handlePerfilChange}
									required
								/>
							</label>
						</div>

						<div className="pm-row">
							<label className="pm-field">
								Correo de contacto
								<input
									name="correo"
									type="email"
									value={perfilForm.correo}
									onChange={handlePerfilChange}
									required
								/>
							</label>
							<label className="pm-field">
								Teléfono
								<input
									name="telefono"
									value={perfilForm.telefono}
									onChange={handlePerfilChange}
									required
								/>
							</label>
						</div>

						<div className="pm-row">
							<label className="pm-field">
								Nombre del negocio
								<input
									name="nombreNegocio"
									value={perfilForm.nombreNegocio}
									onChange={handlePerfilChange}
									required
								/>
							</label>
							<label className="pm-field">
								Servicio principal
								<select
									name="tipoServicio"
									value={perfilForm.tipoServicio}
									onChange={handlePerfilChange}
									required
								>
									<option value="" disabled>Selecciona un tipo</option>
									{TIPOS.map((tipo) => (
										<option key={`perfil-${tipo}`} value={tipo}>{tipo}</option>
									))}
								</select>
							</label>
						</div>

						<label className="pm-field">
							Dirección
							<input
								name="direccion"
								value={perfilForm.direccion}
								onChange={handlePerfilChange}
								required
							/>
						</label>

						<button type="submit" className="pm-submit" disabled={savingPerfil}>
							{savingPerfil ? 'Guardando perfil...' : 'Guardar perfil'}
						</button>
					</form>
				</section>
				</div>
			)}

			{activeTab === 'servicios' && (
				<div className="pm-tab-content" role="tabpanel" aria-label="Gestionar servicios">
					<section className="pm-panel">
						<h2 className="pm-subtitle">{editMode ? 'Editar servicio' : 'Crear nuevo servicio'}</h2>
						<form className="pm-form" onSubmit={handleSubmit}>
					<label className="pm-field">
						Nombre del servicio
						<input
							name="nombreNegocio"
							value={form.nombreNegocio}
							onChange={handleChange}
							placeholder="Ej: Baño premium para perros"
							required
						/>
					</label>

					<label className="pm-field">
						Tipo de servicio
						<select name="tipo" value={form.tipo} onChange={handleChange} required>
							<option value="" disabled>Selecciona un tipo</option>
							{TIPOS.map((tipo) => (
								<option key={tipo} value={tipo}>{tipo}</option>
							))}
						</select>
					</label>

					<label className="pm-field">
						Descripcion
						<textarea
							name="descripcion"
							value={form.descripcion}
							onChange={handleChange}
							placeholder="Describe el servicio que ofreces"
							rows={3}
							required
						/>
					</label>

					<div className="pm-row">
						<label className="pm-field">
							Precio
							<input
								name="precio"
								type="number"
								min="1"
								value={form.precio}
								onChange={handleChange}
								placeholder="Ej: 25000"
								required
							/>
						</label>

						<label className="pm-field">
							Direccion
							<input
								name="direccion"
								value={form.direccion}
								onChange={handleChange}
								placeholder="Ej: Cra 10 #23-45"
								required
							/>
						</label>
					</div>

					<button type="submit" className="pm-submit" disabled={saving}>
						{saving ? 'Guardando...' : editMode ? 'Actualizar servicio' : 'Publicar servicio'}
					</button>
						</form>
					</section>

					<section className="pm-panel">
						<h2 className="pm-subtitle">Mis servicios activos</h2>
						{misServicios.length === 0 ? (
							<p className="pm-empty">Aun no has publicado servicios.</p>
						) : (
							<div className="pm-grid">
								{misServicios.map((servicio) => (
									<article className="pm-card" key={servicio.id}>
										<h3>{servicio.nombreNegocio}</h3>
										<span className="pm-chip">{servicio.tipo}</span>
										<p>{servicio.descripcion}</p>
										<strong>${Number(servicio.precio || 0).toLocaleString('es-CO')}</strong>
										<small>{servicio.direccion}</small>
										<div className="pm-card-actions">
											<button type="button" onClick={() => navigate(`/proveedor/editar/${servicio.id}`)}>
												Editar
											</button>
											<button type="button" className="danger" onClick={() => handleEliminar(servicio.id)}>
												Eliminar
											</button>
										</div>
									</article>
								))}
							</div>
						)}
					</section>
				</div>
			)}
		</div>
	);
}