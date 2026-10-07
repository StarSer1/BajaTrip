import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tours } from '../data/experiences.js';
import { catalogExamples } from '../data/catalogExamples.js';
import { photoSrcSet, photoUrl } from '../utils/images.js';
import ExperienceGrid from '../components/ExperienceGrid.jsx';
import PhotoDialog from '../components/PhotoDialog.jsx';

export default function GalleryPage() {
  const [selected, setSelected] = useState(null);
  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">POSTALES DE BAJA SUR</p><h1>Galería</h1><p>Del mar de Cortés al Pacífico: una mirada a cada destino antes de elegir tu plan.</p></header>
    <section aria-labelledby="titulo-postales">
      <div className="heading"><h2 id="titulo-postales">Postales de cada destino</h2><p>Selecciona una fotografía para ampliarla.</p></div>
      <ul className="gallery">{tours.map((t, index) => <li key={t.id} style={{ '--orden': index }}>
        <figure className="gallery__figure">
          <button type="button" onClick={() => setSelected(t)} aria-label={`Ampliar fotografía: ${t.name}`}>
            <img src={photoUrl(t.image, 800)} srcSet={photoSrcSet(t.image, [400, 800, 1200])}
              sizes="(max-width: 40rem) calc(100vw - 2.25rem), (max-width: 64rem) 45vw, 400px"
              alt={`Fotografía ilustrativa: ${t.name}`} loading="lazy" width="800" height="600" />
          </button>
          <figcaption>{t.name}<span>{t.destination} · {t.category}</span></figcaption>
        </figure>
      </li>)}</ul>
    </section>
    <section className="section" aria-labelledby="titulo-la-paz">
      <div className="heading"><div><p className="eyebrow">PRÁCTICA 1 · TARJETA ANIMADA</p><h2 id="titulo-la-paz">Una mirada a La Paz</h2></div><p>Abre «Conocer la experiencia» para ver el giro de la ilustración.</p></div>
      <ExperienceGrid experiences={catalogExamples} />
    </section>
    <Link className="catalog" to="/catalogo">Encuentra estas experiencias en el catálogo</Link>
    {selected && <PhotoDialog experience={selected} onClose={() => setSelected(null)} />}
  </div>;
}
