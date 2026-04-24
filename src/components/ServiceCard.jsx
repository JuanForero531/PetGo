import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceCard({ servicio }) {
	const navigate = useNavigate();
	const inicial = (servicio?.tipo || 'S').charAt(0).toUpperCase();

	return (
		<article className="sl-card" key={servicio.id}>
			<div className="sl-card__cover">
				<span className="sl-card__badge">{servicio.tipo}</span>
				<span className="sl-card__avatar">{inicial}</span>
			</div>
			<div className="sl-card__body">
				<h2 className="sl-card__nombre">{servicio.nombreNegocio}</h2>
				<p className="sl-card__desc">{servicio.descripcion}</p>
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