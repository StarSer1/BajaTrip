import { Link } from 'react-router-dom';
import { tours } from '../data/experiences.js';
import ExperienceSearch from '../components/ExperienceSearch.jsx';
import ExperienceResults from '../components/ExperienceResults.jsx';
import useExperiences from '../hooks/useExperiences.js';

export default function CatalogPage() {
  const model = useExperiences(tours);
  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">Descubre tu siguiente destino</p><h1>Catálogo de experiencias</h1><p>Acércate al mar y descubre otra forma de disfrutar Baja California Sur.</p></header>
    <ExperienceSearch model={model} />
    <section id="experiencias" aria-labelledby="titulo-resultados">
      <h2 id="titulo-resultados" className="visually-hidden">Experiencias del catálogo</h2>
      <ExperienceResults model={model} />
    </section>
    <Link className="catalog" to="/galeria">¿Buscas inspiración? Mira la galería</Link>
  </div>;
}
