import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tours } from '../data/experiences.js';
import useFavorites from '../hooks/useFavorites.js';
import useSessionState from '../hooks/useSessionState.js';
import { DEFAULT_SEARCH, SEARCH_KEY } from '../hooks/useExperiences.js';
import { deleteReservation, listReservations } from '../storage/reservations.js';
import { longDate, money, people } from '../utils/format.js';
import ExperienceGrid from '../components/ExperienceGrid.jsx';
import ExperienceDialog from '../components/ExperienceDialog.jsx';

export default function TripsPage() {
  const { ids } = useFavorites();
  const favorites = tours.filter((t) => ids.includes(t.id));
  const [{ travelers }] = useSessionState(SEARCH_KEY, DEFAULT_SEARCH);
  const [selected, setSelected] = useState(null);
  const [reservations, setReservations] = useState({ status: 'loading', items: [] });

  const load = () => listReservations()
    .then((items) => setReservations({ status: 'ready', items: items.sort((a, b) => a.date.localeCompare(b.date)) }))
    .catch(() => setReservations({ status: 'error', items: [] }));
  useEffect(() => { load(); }, []);

  const remove = (id) => deleteReservation(id).catch(() => {}).then(load);

  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">TU PRÓXIMA AVENTURA</p><h1>Mis viajes</h1><p>Lo que guardes aquí se queda en este navegador: no necesitas cuenta y nada se envía a un servidor.</p></header>

    <section aria-labelledby="titulo-favoritos">
      <div className="heading"><h2 id="titulo-favoritos">Favoritos</h2><p className="storage-note">Se conservan aunque cierres el navegador.</p></div>
      {favorites.length > 0
        ? <ExperienceGrid experiences={favorites} onDetails={(experience) => setSelected(experience)} />
        : <div className="empty-state"><h3>Aún no guardas favoritos</h3><p>Toca el corazón de una experiencia para encontrarla aquí después.</p><Link className="button" to="/catalogo">Explorar el catálogo</Link></div>}
    </section>

    <section className="section" aria-labelledby="titulo-reservas">
      <div className="heading"><h2 id="titulo-reservas">Reservas de ejemplo</h2><p className="storage-note">Guardadas en este dispositivo; todavía no se envían a los prestadores.</p></div>
      {reservations.status === 'error' && <p className="empty-state">Este navegador no permite guardar reservas de ejemplo.</p>}
      {reservations.status === 'ready' && (reservations.items.length > 0
        ? <ol className="trip-list">{reservations.items.map((r) => <li key={r.id}>
          <div>
            <h3>{r.name}</h3>
            <dl>
              <div><dt>Fecha</dt><dd>{longDate(r.date)}</dd></div>
              <div><dt>Destino</dt><dd>{r.destination}</dd></div>
              <div><dt>Viajeros</dt><dd>{people(r.travelers)}</dd></div>
              <div><dt>Total ilustrativo</dt><dd>{money(r.total)} MXN</dd></div>
            </dl>
          </div>
          <button type="button" className="button button--secundario" onClick={() => remove(r.id)} aria-label={`Eliminar reserva de ejemplo: ${r.name}, ${longDate(r.date)}`}>Eliminar</button>
        </li>)}</ol>
        : <div className="empty-state"><h3>Sin reservas de ejemplo</h3><p>Abre los detalles de una experiencia y prueba una reserva con fecha.</p></div>)}
    </section>
    {selected && <ExperienceDialog experience={selected} travelers={travelers} onClose={() => { setSelected(null); load(); }} />}
  </div>;
}
