import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function Logo() {
  return <Link className="logo" to="/" aria-label="BajaTrip, inicio"><b className="symbol">≈</b> baja<b>trip</b><sup>®</sup></Link>;
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  const home = pathname === '/';
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
          {!home && <Link to="/">Inicio</Link>}
          <Link to="/#destinos">Destinos</Link>
          <Link to="/#experiencias">Experiencias</Link>
          <Link to="/#como-funciona">Cómo funciona</Link>
          {!home && <Link to="/catalogo" aria-current={pathname === '/catalogo' ? 'page' : undefined}>Catálogo</Link>}
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
  </div>;
}
