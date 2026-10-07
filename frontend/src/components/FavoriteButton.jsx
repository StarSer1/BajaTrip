import useFavorites from '../hooks/useFavorites.js';

export default function FavoriteButton({ experience }) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(experience.id);
  return <button type="button" className="favorite-button" aria-pressed={saved}
    aria-label={`Guardar ${experience.name} en favoritos`} onClick={() => toggle(experience.id)}>
    <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
  </button>;
}
