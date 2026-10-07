import { money } from '../utils/format.js';
import { photoSrcSet, photoUrl } from '../utils/images.js';
import FavoriteButton from './FavoriteButton.jsx';

export default function ExperienceCard({ experience, onDetails }) {
  const t = experience;
  return <article className="card tarjeta-experiencia" aria-labelledby={`titulo-${t.id}`}>
    <figure className="photo tarjeta-experiencia__imagen">
      <div className="tarjeta-experiencia__foto">
        <img src={t.illustration || photoUrl(t.image, 800)}
          srcSet={t.illustration ? undefined : photoSrcSet(t.image, [400, 800, 1200])}
          sizes="auto, (max-width: 30rem) calc(100vw - 2.25rem), 440px"
          alt={t.imageAlt || `Fotografía ilustrativa: ${t.name}`} loading="lazy" width="800" height="600" />
        {onDetails && <>
          <FavoriteButton experience={t} />
          <button className="details-button" onClick={() => onDetails(t)} aria-label={`Ver detalles de ${t.name}`}>Ver detalles</button>
        </>}
      </div>
      <figcaption>{t.caption || `${t.destination} · ${t.category}`}</figcaption>
    </figure>
    <div className="tarjeta-experiencia__contenido">
      <h3 id={`titulo-${t.id}`}>{onDetails ? <button onClick={() => onDetails(t)}>{t.name}</button> : t.name}</h3>
      {t.introduction && <p>{t.introduction}</p>}
      <dl className="tarjeta-experiencia__datos">
        {t.facts ? t.facts.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>) : <>
          <div><dt>Duración</dt><dd>{t.duration} horas</dd></div>
          <div><dt>Desde</dt><dd>{money(t.price)} MXN</dd></div>
        </>}
      </dl>
      <details className="tarjeta-experiencia__detalle">
        <summary>Conocer la experiencia</summary><p>{t.description}</p>
        {t.conditions && <p>{t.conditions}</p>}
      </details>
      <div className="price tarjeta-experiencia__nota">{t.note || 'Precio ilustrativo por persona.'}</div>
    </div>
  </article>;
}
