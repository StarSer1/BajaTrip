import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tours } from '../data/experiences.js';
import useFavorites from '../hooks/useFavorites.js';
import useSessionState from '../hooks/useSessionState.js';
import { DEFAULT_SEARCH, SEARCH_KEY } from '../hooks/useExperiences.js';
import { deleteReservation, listReservations } from '../storage/reservations.js';
import { api } from '../storage/servidor.js';
import { longDate, money, people } from '../utils/format.js';
import ExperienceGrid from '../components/ExperienceGrid.jsx';
import ExperienceDialog from '../components/ExperienceDialog.jsx';

export default function TripsPage() {
  const { ids } = useFavorites();
  const favorites = tours.filter((t) => ids.includes(t.id));
  const [{ travelers }] = useSessionState(SEARCH_KEY, DEFAULT_SEARCH);
  const [selected, setSelected] = useState(null);
  const [reservations, setReservations] = useState({ status: 'loading', items: [] });
  // Solo cuando el sitio corre con el backend: qué nodo respondió y la sesión que comparten todos.
  const [server, setServer] = useState(null);

  const askServer = () => api('/api/sesion').then((respuesta) => setServer(respuesta?.ok ? respuesta.datos : null));
  const load = () => listReservations()
    .then((items) => setReservations({ status: 'ready', items: items.sort((a, b) => a.date.localeCompare(b.date)) }))
    .catch(() => setReservations({ status: 'error', items: [] }))
    .then(askServer);
  useEffect(() => { load(); }, []);

  const remove = (id) => deleteReservation(id).catch(() => {}).then(load);

  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">TU PRÓXIMA AVENTURA</p><h1>Mis viajes</h1><p>Tus favoritos se quedan en este navegador. Las reservas de ejemplo también se copian al servidor de BajaTrip cuando está disponible. No necesitas cuenta y no se cobra nada.</p></header>

    <section aria-labelledby="titulo-favoritos">
      <div className="heading"><h2 id="titulo-favoritos">Favoritos</h2><p className="storage-note">Se conservan aunque cierres el navegador.</p></div>
      {favorites.length > 0
        ? <ExperienceGrid experiences={favorites} onDetails={(experience) => setSelected(experience)} />
        : <div className="empty-state"><h3>Aún no guardas favoritos</h3><p>Toca el corazón de una experiencia para encontrarla aquí después.</p><Link className="button" to="/catalogo">Explorar el catálogo</Link></div>}
    </section>

    <section className="section" aria-labelledby="titulo-reservas">
      <div className="heading"><h2 id="titulo-reservas">Reservas de ejemplo</h2><p className="storage-note">Guardadas en este dispositivo; todavía no se envían a los prestadores.</p></div>
      {server && <div className="server-note">
        <p role="status">Te atendió el <strong>nodo {server.nodo}</strong> · sesión <code>{server.sesion}</code> (abierta en el nodo {server.creadaEnNodo}) · {server.reservas} {server.reservas === 1 ? 'reserva guardada' : 'reservas guardadas'} en el servidor</p>
        <button type="button" className="button button--secundario" onClick={askServer}>Consultar otra vez</button>
      </div>}
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
