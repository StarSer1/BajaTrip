import { tours } from '../data/experiences.js';
import { catalogExamples } from '../data/catalogExamples.js';
import ExperienceGrid from '../components/ExperienceGrid.jsx';
import ExperienceSearch from '../components/ExperienceSearch.jsx';
import ExperienceResults from '../components/ExperienceResults.jsx';
import useExperiences from '../hooks/useExperiences.js';

export default function CatalogPage() {
  const model = useExperiences(tours);
  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">Descubre tu siguiente destino</p><h1>Catálogo de experiencias</h1><p>Acércate al mar y descubre otra forma de disfrutar Baja California Sur.</p></header>
    <ExperienceSearch model={model} />
    <section id="experiencias" aria-label="Experiencias del catálogo"><ExperienceResults model={model} /></section>
    <section className="section" aria-labelledby="titulo-la-paz"><div className="heading"><h2 id="titulo-la-paz">Una mirada a La Paz</h2></div><ExperienceGrid experiences={catalogExamples} /></section>
  </div>;
}
