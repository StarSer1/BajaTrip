import { useSyncExternalStore } from 'react';

// navigator.onLine y los eventos online/offline: avisan cuando se pierde la señal.
function subscribe(listener) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => { window.removeEventListener('online', listener); window.removeEventListener('offline', listener); };
}

export default function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
