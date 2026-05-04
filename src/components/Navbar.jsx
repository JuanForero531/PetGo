import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cerrarSesion } from '../firebase/auth';

export default function Navbar() {
	const navigate = useNavigate();
	const { user, perfil } = useAuth();
	const [error, setError] = useState('');

	const linkClass = ({ isActive }) => `pg-nav__link ${isActive ? 'pg-nav__link--active' : ''}`;

	const handleLogout = async () => {
		try {
			await cerrarSesion();
			navigate('/login');
		} catch {
			setError('No se pudo cerrar sesión.');
		}
	};

	return (
		<header className="pg-nav">
			<div className="pg-nav__inner">
				<button type="button" className="pg-nav__brand" onClick={() => navigate('/servicios')}>
					PetGo
				</button>

				<nav className="pg-nav__menu" aria-label="Navegación principal">
					<NavLink to="/servicios" className={linkClass}>
						Servicios
					</NavLink>
					{!user && (
						<>
							<NavLink to="/login" className={linkClass}>
								Iniciar sesión
							</NavLink>
							<NavLink to="/registro" className={linkClass}>
								Registro
							</NavLink>
						</>
					)}
				</nav>

				<div className="pg-nav__actions">
					{perfil?.rol === 'proveedor' && (
						<button type="button" className="pg-nav__btn" onClick={() => navigate('/proveedor/nuevo')}>
							{perfil?.esPremium ? 'Mi módulo premium' : 'Mi módulo'}
						</button>
					)}
					{perfil?.rol === 'admin' && (
						<button type="button" className="pg-nav__btn" onClick={() => navigate('/admin/dashboard')}>
							Panel admin
						</button>
					)}
					{user && (
						<button type="button" className="pg-nav__btn pg-nav__btn--ghost" onClick={handleLogout}>
							Cerrar sesión
						</button>
					)}
				</div>
			</div>

			{error && <p className="pg-nav__error">{error}</p>}
		</header>
	);
}