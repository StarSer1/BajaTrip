import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  countByMunicipality, databaseInfo, deleteGuide, getGuide, languages, municipalities, searchGuides,
} from './guidesDb.js';
import GuideForm from './GuideForm.jsx';
import GuideCard from './GuideCard.jsx';
import GuidesChart from './GuidesChart.jsx';
import DeleteGuideDialog from './DeleteGuideDialog.jsx';

const NO_FILTERS = { municipality: '', language: '' };

function describeSearch({ municipality, language }, count) {
  const where = municipality ? ` en ${municipality}` : '';
  const speaks = language ? ` que hablan ${language.toLowerCase()}` : '';
  return `${count} ${count === 1 ? 'guía' : 'guías'}${where}${speaks}`;
}

export default function GuidesPage() {
  const { search } = useLocation();
  const [draft, setDraft] = useState(NO_FILTERS);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState({ status: 'loading' });
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [listMessage, setListMessage] = useState('');
  const listHeadingRef = useRef(null);

  // Cada alta, modificación o baja incrementa revision y vuelve a leer la lista y el gráfico del almacén.
  useEffect(() => {
    let active = true;
    Promise.all([databaseInfo(), searchGuides(filters), countByMunicipality()])
      .then(([info, found, counts]) => { if (active) setData({ status: 'ready', ...info, ...found, counts }); })
      .catch((error) => { if (active) setData({ status: 'error', error }); });
    return () => { active = false; };
  }, [filters, revision, search]);

  async function startEdit(id) {
    setFormMessage('');
    setEditing(await getGuide(id));
  }

  function saved(guide, modified) {
    setEditing(null);
    setFormMessage(modified ? `Guardamos los cambios de ${guide.name}.` : `Registramos a ${guide.name}.`);
    setRevision((r) => r + 1);
  }

  async function confirmDelete() {
    const guide = toDelete;
    setToDelete(null);
    try {
      await deleteGuide(guide.id);
      if (editing?.id === guide.id) setEditing(null);
      setListMessage(`Dimos de baja a ${guide.name}.`);
    } catch {
      setListMessage(`No pudimos dar de baja a ${guide.name}.`);
    }
    setRevision((r) => r + 1);
    listHeadingRef.current.focus();
  }

  function applySearch(event) {
    event.preventDefault();
    setListMessage('');
    setFilters(draft);
  }

  function clearSearch() {
    setListMessage('');
    setDraft(NO_FILTERS);
    setFilters(NO_FILTERS);
  }

  const ready = data.status === 'ready';
  const version = ready ? data.version : null;
  const filtered = Boolean(filters.municipality || filters.language);

  return <div className="wrap section page-content guides-page">
    <header className="page-intro">
      <p className="eyebrow">QUIÉN TE ACOMPAÑA</p>
      <h1>Guías locales</h1>
      <p>El catálogo de las personas que guían cada experiencia. Se guarda en este navegador con IndexedDB y sigue funcionando sin conexión.</p>
      {ready && <p className="storage-note">Base de datos local «bajatrip-guias», versión {data.version} del esquema.</p>}
    </header>

    {ready && data.migration && <p className="notice guides-notice" role="status">
      Actualizamos la base de la versión {data.migration.from} a la {data.migration.to} y conservamos
      {' '}{data.migration.records} {data.migration.records === 1 ? 'registro' : 'registros'}. A cada uno le asignamos «Español» como idioma inicial.
    </p>}
    {version === 1 && <p className="notice guides-notice">
      Estás usando la versión 1 de la base para demostrar la migración. Cuando tengas algunos registros,
      {' '}<Link to="/guias">abre el catálogo normal</Link> para actualizarla a la versión 2.
    </p>}
    {data.status === 'error' && <p className="notice guides-notice" role="alert">
      {data.error?.name === 'VersionError'
        ? 'La base de este navegador ya está en una versión más reciente. Para repetir la demostración, elimina «bajatrip-guias» desde las herramientas del navegador (Aplicación › IndexedDB).'
        : 'Este navegador no permite abrir la base de datos local.'}
    </p>}

    <div className="guides-layout">
      <section className="guides-panel" aria-labelledby="titulo-registro">
        <h2 id="titulo-registro">{editing ? `Modificar a ${editing.name}` : 'Registrar guía'}</h2>
        {ready && <GuideForm version={version} editing={editing} onSaved={saved}
          onCancel={() => { setEditing(null); setFormMessage('Cancelamos la modificación.'); }} />}
        <p className="result" role="status">{formMessage}</p>
      </section>

      <section className="guides-panel" aria-labelledby="titulo-grafico">
        <h2 id="titulo-grafico">Distribución</h2>
        {ready && <GuidesChart data={data.counts} />}
      </section>
    </div>

    <section className="section guides-results" aria-labelledby="titulo-catalogo">
      <div className="heading">
        <h2 id="titulo-catalogo" ref={listHeadingRef} tabIndex={-1}>Catálogo de guías</h2>
      </div>
      <form className="search guides-search" role="search" aria-label="Buscar guías" onSubmit={applySearch}>
        <label><span>Municipio</span>
          <select value={draft.municipality} onChange={(e) => setDraft({ ...draft, municipality: e.target.value })}>
            <option value="">Todos los municipios</option>{municipalities.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        {version >= 2 && <label><span>Idioma</span>
          <select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}>
            <option value="">Todos los idiomas</option>{languages.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>}
        <button className="button">Buscar guías</button>
        <button type="button" className="button button--secundario" onClick={clearSearch}>Mostrar todos</button>
      </form>

      {ready && <p className="guides-count" role="status">
        {describeSearch(filters, data.guides.length)}
        <span>{data.index ? ` · consulta resuelta con el índice «${data.index}»` : ' · lectura completa del almacén'}</span>
        {listMessage && <strong> {listMessage}</strong>}
      </p>}

      {ready && (data.guides.length > 0
        ? <ul className="guides-list">{data.guides.map((guide) => <li key={guide.id}>
          <GuideCard guide={guide} onEdit={startEdit} onDelete={setToDelete} />
        </li>)}</ul>
        : <div className="empty-state">
          <h3>{filtered ? 'Ningún guía coincide con la búsqueda' : 'Aún no hay guías registrados'}</h3>
          <p>{filtered ? 'Prueba con otro municipio o idioma.' : 'Usa el formulario de registro para agregar el primero.'}</p>
        </div>)}
    </section>

    {toDelete && <DeleteGuideDialog guide={toDelete} onConfirm={confirmDelete} onClose={() => setToDelete(null)} />}
  </div>;
}
