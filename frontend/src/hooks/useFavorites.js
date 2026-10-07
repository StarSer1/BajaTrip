import { useSyncExternalStore } from 'react';

// localStorage: los favoritos siguen ahí al cerrar el navegador y volver otro día.
const KEY = 'bajatrip:favoritos';
const listeners = new Set();
let favorites = read();

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function subscribe(listener) {
  // El evento storage avisa cuando otra pestaña cambia los favoritos.
  const onStorage = (event) => { if (event.key === KEY) { favorites = read(); listener(); } };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}

function toggle(id) {
  favorites = favorites.includes(id) ? favorites.filter((saved) => saved !== id) : [...favorites, id];
  try { localStorage.setItem(KEY, JSON.stringify(favorites)); } catch { /* se conservan durante la visita */ }
  listeners.forEach((listener) => listener());
}

export default function useFavorites() {
  const ids = useSyncExternalStore(subscribe, () => favorites, () => favorites);
  return { ids, isFavorite: (id) => ids.includes(id), toggle };
}
