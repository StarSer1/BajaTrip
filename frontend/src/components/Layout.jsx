import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import useFavorites from '../hooks/useFavorites.js';
import useOnline from '../hooks/useOnline.js';

function Logo() {
  return <Link className="logo" to="/" aria-label="BajaTrip, inicio"><b className="symbol">≈</b> baja<b>trip</b><sup>®</sup></Link>;
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  const home = pathname === '/';
  const { ids } = useFavorites();
  const online = useOnline();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return <div className="site-layout">
    <a className="skip" href="#contenido">Saltar al contenido</a>
    <header className={`site-header ${home ? 'site-header--home' : ''}`}>
      <div className="wrap navigation">
        <Logo />
        <nav aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <Link to="/#destinos">Destinos</Link>
          <NavLink to="/catalogo">Catálogo</NavLink>
          <NavLink to="/galeria">Galería</NavLink>
          <NavLink to="/mis-viajes">Mis viajes{ids.length > 0 && <span className="nav-count">
            <span aria-hidden="true"> ({ids.length})</span>
            <span className="visually-hidden">, {ids.length} {ids.length === 1 ? 'favorito' : 'favoritos'}</span>
          </span>}</NavLink>
          <Link to="/#como-funciona">Cómo funciona</Link>
        </nav>
        <Link className="nav-cta" to="/#experiencias">Encuentra tu aventura</Link>
      </div>
    </header>
    <main id="contenido" tabIndex={-1}><Outlet /></main>
    <footer>
      <div className="wrap footer-top">
        <div><Logo /><p>Historias que empiezan en Baja Sur.</p></div>
        <Link to="/#experiencias">Tu próxima aventura te espera</Link>
      </div>
      <div className="wrap footer-bottom"><span>© 2026 BajaTrip</span><span>Hecho para explorar Baja California Sur.</span></div>
    </footer>
    {!online && <p className="offline-notice" role="status">Sin conexión: algunas fotografías no cargarán. Tus favoritos y reservas de ejemplo siguen guardados en este dispositivo.</p>}
  </div>;
}
