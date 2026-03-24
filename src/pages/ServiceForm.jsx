import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
	crearServicio,
	editarServicio,
	eliminarServicio,
	obtenerServicio,
	obtenerServiciosDelProveedor,
} from '../firebase/firestore';
import { cerrarSesion } from '../firebase/auth';
import '../styles/ProviderModule.css';

const TIPOS = [
	'Baño y secado',
	'Corte de pelo',
	'Corte de uñas',
	'Paseo de mascotas',
	'Cuidado a domicilio',
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
	const { user, perfil } = useAuth();

	const [form, setForm] = useState(initialForm);
	const [misServicios, setMisServicios] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const editMode = useMemo(() => Boolean(id), [id]);

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

	const recargarServicios = async () => {
		if (!user?.uid) return;
		const serviciosProveedor = await obtenerServiciosDelProveedor(user.uid);
		setMisServicios(serviciosProveedor);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (!user?.uid) {
			setError('Sesion no valida. Inicia sesion de nuevo.');
			return;
		}

		if (!form.nombreNegocio || !form.tipo || !form.descripcion || !form.precio || !form.direccion) {
			setError('Completa todos los campos del servicio antes de continuar.');
			return;
		}

		if (Number(form.precio) <= 0) {
			setError('El precio debe ser mayor a cero.');
			return;
		}

		setSaving(true);
		try {
			if (editMode && id) {
				await editarServicio(id, {
					nombreNegocio: form.nombreNegocio,
					tipo: form.tipo,
					descripcion: form.descripcion,
					precio: Number(form.precio),
					direccion: form.direccion,
				});
				setSuccess('Servicio actualizado correctamente.');
				navigate('/proveedor/nuevo', { replace: true });
			} else {
				await crearServicio(user.uid, {
					nombreNegocio: form.nombreNegocio,
					tipo: form.tipo,
					descripcion: form.descripcion,
					precio: Number(form.precio),
					direccion: form.direccion,
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
			</header>

			{error && <div className="pm-alert pm-alert--error">{error}</div>}
			{success && <div className="pm-alert pm-alert--success">{success}</div>}

			<section className="pm-panel">
				<h2 className="pm-subtitle">{editMode ? 'Editar servicio' : 'Crear nuevo servicio'}</h2>
				<form className="pm-form" onSubmit={handleSubmit}>
					<label className="pm-field">
						Nombre del negocio
						<input
							name="nombreNegocio"
							value={form.nombreNegocio}
							onChange={handleChange}
							placeholder="Ej: PetCare Tunja"
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
	);
}