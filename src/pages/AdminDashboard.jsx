import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerMetricasAdmin } from '../firebase/firestore';
import '../styles/AdminDashboard.css';

function calcularPorcentaje(valor, total) {
	if (!total) return 0;
	return Math.min(100, Math.max(0, Math.round((valor / total) * 100)));
}

function normalizarTexto(texto) {
	return String(texto || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function escaparRegex(texto) {
	return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resaltarTexto(texto, busqueda) {
	if (!busqueda) return texto;

	const regex = new RegExp(`(${escaparRegex(busqueda)})`, 'ig');
	const partes = String(texto).split(regex);

	return partes.map((parte, index) =>
		normalizarTexto(parte) === normalizarTexto(busqueda) ? (
			<mark key={`${parte}-${index}`} className="ad-highlight-text">
				{parte}
			</mark>
		) : (
			<React.Fragment key={`${parte}-${index}`}>{parte}</React.Fragment>
		),
	);
}

export default function AdminDashboard() {
	const navigate = useNavigate();
	const { perfil } = useAuth();
	const [metricas, setMetricas] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [busqueda, setBusqueda] = useState('');
	const [seccionActiva, setSeccionActiva] = useState('');
	const cardsRef = useRef(null);
	const composicionRef = useRef(null);
	const tiposRef = useRef(null);

	useEffect(() => {
		const cargarMetricas = async () => {
			setLoading(true);
			setError('');

			try {
				const data = await obtenerMetricasAdmin();
				setMetricas(data);
			} catch (err) {
				console.error('Error al cargar métricas admin:', err);
				setError('No se pudieron cargar las métricas del panel.');
			} finally {
				setLoading(false);
			}
		};

		cargarMetricas();
	}, []);

	const cards = useMemo(
		() =>
			metricas
				? [
						{ label: 'Usuarios totales', value: metricas.totalUsuarios },
						{ label: 'Usuarios activos', value: metricas.usuariosActivos },
						{ label: 'Proveedores', value: metricas.totalProveedores },
						{ label: 'Administradores', value: metricas.totalAdmins },
						{ label: 'Servicios activos', value: metricas.serviciosActivos },
						{ label: 'Servicios inactivos', value: metricas.serviciosInactivos },
					]
				: [],
		[metricas],
	);

	const estadoUsuarios = useMemo(() => {
		if (!metricas) return [];

		return [
			{
				label: 'Activos',
				value: metricas.usuariosActivos,
				percent: calcularPorcentaje(metricas.usuariosActivos, metricas.totalUsuarios),
			},
			{
				label: 'Inactivos',
				value: metricas.usuariosInactivos,
				percent: calcularPorcentaje(metricas.usuariosInactivos, metricas.totalUsuarios),
			},
			{
				label: 'Proveedores',
				value: metricas.totalProveedores,
				percent: calcularPorcentaje(metricas.totalProveedores, metricas.totalUsuarios),
			},
			{
				label: 'Admins',
				value: metricas.totalAdmins,
				percent: calcularPorcentaje(metricas.totalAdmins, metricas.totalUsuarios),
			},
		];
	}, [metricas]);

	const cardsFiltradas = useMemo(() => {
		if (!busqueda) return cards;
		const termino = normalizarTexto(busqueda);
		return cards.filter((card) => normalizarTexto(card.label).includes(termino));
	}, [busqueda, cards]);

	const secciones = useMemo(() => {
		const tiposNombres = metricas?.tiposMasUsados?.map((tipo) => tipo.tipo) || [];
		return [
			{
				id: 'resumen',
				nombre: 'Resumen de metricas',
				ref: cardsRef,
				terminos: ['dashboard', 'resumen', 'metricas', ...cards.map((card) => card.label)],
			},
			{
				id: 'usuarios',
				nombre: 'Composicion de usuarios',
				ref: composicionRef,
				terminos: ['usuarios', 'composicion', 'activos', 'inactivos', 'proveedores', 'admins'],
			},
			{
				id: 'tipos',
				nombre: 'Tipos de servicio mas usados',
				ref: tiposRef,
				terminos: ['tipos', 'servicio', 'servicios', ...tiposNombres],
			},
		];
	}, [cards, metricas]);

	const resultadoBusqueda = useMemo(() => {
		if (!busqueda) return null;
		const termino = normalizarTexto(busqueda);
		return (
			secciones.find((seccion) =>
				seccion.terminos.some((item) => normalizarTexto(item).includes(termino)),
			) || null
		);
	}, [busqueda, secciones]);

	useEffect(() => {
		if (!busqueda || loading) {
			setSeccionActiva('');
			return;
		}

		if (resultadoBusqueda) {
			setSeccionActiva(resultadoBusqueda.id);
			resultadoBusqueda.ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			setSeccionActiva('');
		}
	}, [busqueda, loading, resultadoBusqueda]);

	return (
		<div className="ad-page">
			<aside className="ad-sidebar">
				<div className="ad-brand">
					<div className="ad-brand__icon">🐾</div>
					<div>
						<p className="ad-brand__name">PetGo</p>
						<p className="ad-brand__sub">Panel administrativo</p>
					</div>
				</div>

				<nav className="ad-menu" aria-label="Menu admin">
					<button type="button" className="ad-menu__item ad-menu__item--active" onClick={() => navigate('/admin/dashboard')}>
						Dashboard
					</button>
					<button type="button" className="ad-menu__item" onClick={() => navigate('/admin/usuarios')}>
						Gestion de usuarios
					</button>				<button type="button" className="ad-menu__item" onClick={() => navigate('/admin/servicios')}>
					Gestion de servicios
				</button>					<button type="button" className="ad-menu__item" onClick={() => navigate('/servicios')}>
						Ver marketplace
					</button>
				</nav>
			</aside>

			<main className="ad-main">
				<div className="ad-shell">
					<div className="ad-topbar">
						<input
							className="ad-search"
							type="search"
							placeholder="Buscar seccion del panel..."
							value={busqueda}
							onChange={(event) => setBusqueda(event.target.value)}
						/>
						<div className="ad-pills">
							<span className="ad-pill">Rol: Admin</span>
							<span className="ad-pill">PetGo Tunja</span>
						</div>
					</div>

					{busqueda && (
						<div className={resultadoBusqueda ? 'ad-search-status ad-search-status--ok' : 'ad-search-status ad-search-status--empty'}>
							{resultadoBusqueda
								? `Seccion encontrada: ${resultadoBusqueda.nombre}`
								: 'No hay coincidencias en el panel para esa busqueda.'}
						</div>
					)}

					<h1 className="ad-title">Hola, {perfil?.nombre || 'Administrador'}</h1>
					<p className="ad-subtitle">Vista ejecutiva de usuarios y servicios de la plataforma.</p>

					{loading ? (
						<div className="ad-empty">Cargando metricas...</div>
					) : error ? (
						<div className="ad-error">{error}</div>
					) : (
						<>
							<section
								ref={cardsRef}
								className={`ad-cards ${seccionActiva === 'resumen' ? 'ad-section-highlight' : ''}`}
							>
								{cardsFiltradas.map((card) => (
									<article className={`ad-card ${busqueda && normalizarTexto(card.label).includes(normalizarTexto(busqueda)) ? 'ad-card--match' : ''}`} key={card.label}>
										<p className="ad-card__label">{resaltarTexto(card.label, busqueda)}</p>
										<p className="ad-card__value">{card.value}</p>
									</article>
								))}
								{cardsFiltradas.length === 0 && <div className="ad-empty">No hay metricas que coincidan con esa busqueda.</div>}
							</section>

							<section className="ad-panels">
								<article
									ref={composicionRef}
									className={`ad-panel ${seccionActiva === 'usuarios' ? 'ad-section-highlight' : ''}`}
								>
									<h2 className="ad-panel__title">{resaltarTexto('Composicion de usuarios', busqueda)}</h2>
									{estadoUsuarios.map((item) => (
										<div className="ad-meter" key={item.label}>
											<span>{resaltarTexto(item.label, busqueda)}</span>
											<div className="ad-meter__track">
												<div className="ad-meter__fill" style={{ width: `${item.percent}%` }} />
											</div>
											<strong>{item.value}</strong>
										</div>
									))}
								</article>

								<article
									ref={tiposRef}
									className={`ad-panel ${seccionActiva === 'tipos' ? 'ad-section-highlight' : ''}`}
								>
									<h2 className="ad-panel__title">{resaltarTexto('Tipos de servicio mas usados', busqueda)}</h2>
									{metricas.tiposMasUsados.length === 0 ? (
										<p style={{ margin: 0, color: '#5b3f27' }}>Todavia no hay servicios publicados.</p>
									) : (
										<ul className="ad-types">
											{metricas.tiposMasUsados.map((tipo) => (
												<li key={tipo.tipo}>
													<span>{resaltarTexto(tipo.tipo, busqueda)}</span>
													<span className="ad-types__count">{tipo.cantidad}</span>
												</li>
											))}
										</ul>
									)}
								</article>
							</section>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
