import { categories, destinations } from '../data/experiences.js';

export default function ExperienceSearch({ model }) {
  return <form id="search" className="search" role="search" aria-label="Buscar experiencias" onSubmit={model.search}>
    <label><span>¿A dónde vamos?</span>
      <select id="destination" value={model.destination} onChange={(e) => model.setDestination(e.target.value)}>
        <option value="">Todos los destinos</option>{destinations.map((d) => <option key={d}>{d}</option>)}
      </select>
    </label>
    <label><span>☼ &nbsp; ¿Qué te gustaría hacer?</span>
      <select id="activity" value={model.category} onChange={(e) => model.setCategory(e.target.value)}>
        <option value="">Todas las experiencias</option>{categories.map((c) => <option key={c}>{c}</option>)}
      </select>
    </label>
    <label><span>♧ &nbsp; Viajeros</span>
      <select id="travelers" value={model.travelers} onChange={(e) => model.setTravelers(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>)}
      </select>
    </label>
    <button className="button">Explorar experiencias</button>
  </form>;
}
