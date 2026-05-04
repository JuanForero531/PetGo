import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceCard({ servicio }) {
	const navigate = useNavigate();
	const inicial = (servicio?.tipo || 'S').charAt(0).toUpperCase();
	const esPremium = Boolean(servicio?.proveedor?.esPremium);

	return (
		<article className={`sl-card ${esPremium ? 'sl-card--premium' : ''}`} key={servicio.id}>
			<div className="sl-card__cover">
				<div className="sl-card__tags">
					<span className="sl-card__badge">{servicio.tipo}</span>
					{esPremium && <span className="sl-card__flag">Premium</span>}
				</div>
				<span className="sl-card__avatar">{inicial}</span>
			</div>
			<div className="sl-card__body">
				<h2 className="sl-card__nombre">{servicio.nombreNegocio}</h2>
				<p className="sl-card__desc">{servicio.descripcion}</p>
				{esPremium && <p className="sl-card__hint">Proveedor destacado con visibilidad prioritaria.</p>}
				<div className="sl-card__info">
					<span className="sl-card__precio">${Number(servicio.precio || 0).toLocaleString('es-CO')}</span>
					<span className="sl-card__direccion">{servicio.direccion}</span>
				</div>
			</div>
			<button
				type="button"
				className="sl-card__btn"
				onClick={() => navigate(`/servicios/${servicio.id}`)}
			>
				Ver detalle
			</button>
		</article>
	);
}