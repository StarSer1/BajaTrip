import { useEffect, useState } from 'react';

// sessionStorage: el valor sobrevive a recargas y cambios de vista dentro de la misma pestaña,
// y se descarta al cerrarla. Si el navegador bloquea el almacenamiento, funciona solo en memoria.
export default function useSessionState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* almacenamiento no disponible */ }
  }, [key, value]);
  return [value, setValue];
}
