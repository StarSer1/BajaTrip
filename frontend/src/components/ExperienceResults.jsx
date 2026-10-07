import { categories } from '../data/experiences.js';
import ExperienceGrid from './ExperienceGrid.jsx';
import ExperienceDialog from './ExperienceDialog.jsx';

export default function ExperienceResults({ model }) {
  return <>
    <div className="filter-row">
      <div className="filters" role="group" aria-label="Filtrar experiencias">
        {['', ...categories].map((c) => <button key={c} aria-pressed={model.filters.category === c} onClick={() => model.chooseCategory(c)}>{c || 'Todas'}</button>)}
      </div>
      <span id="count" role="status">{model.results.length} experiencias{model.filters.destination ? ` en ${model.filters.destination}` : ''}</span>
    </div>
    <ExperienceGrid experiences={model.results} onDetails={model.openDetails} />
    {model.results.length === 0 && <div id="empty">
      <h3>Tu próxima aventura está por llegar</h3><p>Aún no tenemos ejemplos para esta combinación.</p>
      <button className="button" onClick={model.reset}>Ver todas las experiencias</button>
    </div>}
    {model.selected && <ExperienceDialog {...model.selected} onClose={model.closeDetails} />}
  </>;
}
