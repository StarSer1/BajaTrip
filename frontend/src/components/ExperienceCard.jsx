import { money } from '../utils/format.js';

export default function ExperienceCard({ experience, onDetails }) {
  const t = experience;
  const photo = (width) => `https://images.unsplash.com/${t.image}?auto=format&fit=crop&w=${width}&q=80`;
  return <article className="card tarjeta-experiencia" aria-labelledby={`titulo-${t.id}`}>
    <figure className="photo tarjeta-experiencia__imagen">
      <div className="tarjeta-experiencia__foto">
        <img src={t.illustration || photo(800)}
          srcSet={t.illustration ? undefined : `${photo(400)} 400w, ${photo(800)} 800w, ${photo(1200)} 1200w`}
          sizes="auto, (max-width: 30rem) calc(100vw - 2.25rem), 440px"
          alt={t.imageAlt || `Fotografía ilustrativa: ${t.name}`} loading="lazy" width="800" height="600" />
        {onDetails && <button className="details-button" onClick={() => onDetails(t)} aria-label={`Ver detalles de ${t.name}`}>Ver detalles</button>}
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
