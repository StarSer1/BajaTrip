import { Link } from 'react-router-dom';
import { destinations, tours } from '../data/experiences.js';
import useExperiences from '../hooks/useExperiences.js';
import ExperienceSearch from '../components/ExperienceSearch.jsx';
import ExperienceResults from '../components/ExperienceResults.jsx';
import LandingStory from '../components/LandingStory.jsx';

export default function HomePage() {
  const model = useExperiences(tours);
  return <>
    <section className="hero" aria-labelledby="titulo-inicio">
      <div className="wrap hero-content">
        <h1 id="titulo-inicio">BAJA SUR</h1>
        <div className="hero-bottom"><h2>Hay lugares que visitas.<br />Y otros que se quedan contigo.</h2></div>
        <ExperienceSearch model={model} />
      </div>
    </section>
    <section id="destinos" className="wrap destinations" aria-label="Destinos">
      <span>ENCUENTRA TU LUGAR</span><div>{destinations.map((d) => <button key={d} onClick={() => model.chooseDestination(d)}>{d}</button>)}</div>
    </section>
    <section id="experiencias" className="wrap section" aria-labelledby="titulo-experiencias">
      <div className="heading"><div><p className="eyebrow">SAL DE LA RUTINA</p><h2 id="titulo-experiencias">Elige el plan.<br />Nos vemos en la Baja.</h2></div></div>
      <ExperienceResults model={model} />
      <Link className="catalog" to="/catalogo">Explorar experiencias en el catálogo</Link>
    </section>
    <LandingStory />
  </>;
}
