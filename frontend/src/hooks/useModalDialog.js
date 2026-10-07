import { useLayoutEffect, useRef } from 'react';

// Abre el <dialog> nativo como modal y, al cerrarlo, devuelve el foco al control que lo abrió.
export default function useModalDialog() {
  const dialogRef = useRef(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return dialogRef;
}
