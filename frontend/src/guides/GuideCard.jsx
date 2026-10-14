import { useObjectUrl } from './photo.js';
import { longDate, seniority } from '../utils/format.js';

export default function GuideCard({ guide, onEdit, onDelete }) {
  const photo = useObjectUrl(guide.photo);
  return <article className="guide-card" aria-labelledby={`guia-${guide.id}`}>
    <div className="guide-card__photo">
      {photo && <img src={photo} alt={`Fotografía de ${guide.name}`} width="480" height="480" />}
    </div>
    <div className="guide-card__body">
      <h3 id={`guia-${guide.id}`}>{guide.name}</h3>
      <p className="guide-card__meta">{guide.specialty} · {guide.municipality}</p>
      <dl>
        <div><dt>Idiomas</dt><dd>{guide.languages?.join(', ') ?? 'Sin registrar'}</dd></div>
        <div><dt>Ingreso</dt><dd><time dateTime={guide.startDate}>{longDate(guide.startDate)}</time> ({seniority(guide.startDate)})</dd></div>
        <div><dt>Teléfono</dt><dd><a href={`tel:${guide.phone.replace(/\s/g, '')}`}>{guide.phone}</a></dd></div>
        <div><dt>Correo</dt><dd><a href={`mailto:${guide.email}`}>{guide.email}</a></dd></div>
      </dl>
      <div className="guide-card__actions">
        <button type="button" className="button button--secundario" onClick={() => onEdit(guide.id)}
          aria-label={`Modificar a ${guide.name}`}>Modificar</button>
        <button type="button" className="button button--peligro" onClick={() => onDelete(guide)}
          aria-label={`Dar de baja a ${guide.name}`}>Dar de baja</button>
      </div>
    </div>
  </article>;
}
