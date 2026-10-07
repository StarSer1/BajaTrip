import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <div className="wrap section page-content"><div className="page-intro"><h1>Página no encontrada</h1><p>Esta vista todavía no está disponible.</p></div><Link className="button" to="/">Volver al inicio</Link></div>;
}
