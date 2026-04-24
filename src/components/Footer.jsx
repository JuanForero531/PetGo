import React from 'react';

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="pg-footer">
			<div className="pg-footer__inner">
				<p>PetGo {year} · Servicios para mascotas en Tunja</p>
			</div>
		</footer>
	);
}