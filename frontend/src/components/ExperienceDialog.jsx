import { useLayoutEffect, useRef, useState } from 'react';
import { money, today } from '../utils/format.js';

export default function ExperienceDialog({ experience: t, travelers, onClose }) {
  const dialogRef = useRef(null);
  const [result, setResult] = useState('');
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  function reserve(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const field = form.elements.fecha;
    field.min = today();
    if (!form.reportValidity()) return;
    const date = new Date(`${field.value}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    setResult(`Tu selección de ejemplo: ${t.name}, ${date}, ${travelers} ${travelers === 1 ? 'persona' : 'personas'}. No se envió ninguna solicitud. Las reservas estarán disponibles al conectar a los prestadores.`);
  }

  return <dialog ref={dialogRef} id="details" aria-labelledby="dialog-title" onCancel={onClose}>
    <button className="close" aria-label="Cerrar detalles" onClick={onClose}>✕</button>
    <div id="dialog-content">
      <p className="eyebrow">{t.destination} · {t.duration} horas</p>
      <h2 id="dialog-title">{t.name}</h2><p>{t.description}</p>
      <h3>Qué incluiría</h3><ul>{t.includes.map((item) => <li key={item}>{item}</li>)}</ul>
      <p>El itinerario, los requisitos y la disponibilidad se confirmarán cuando el prestador publique el servicio.</p>
      <p><strong>{money(t.price * travelers)} MXN</strong> para {travelers} {travelers === 1 ? 'persona' : 'personas'} · precio ilustrativo.</p>
      <p className="notice">Demostración: las fotografías, servicios y precios son ilustrativos. No se realizan cobros ni reservas reales.</p>
      <form id="reservation" onSubmit={reserve}>
        <label>Fecha de tu aventura<input type="date" name="fecha" required min={today()} /></label>
        <button className="button">Probar reserva de ejemplo</button><p className="result" role="status">{result}</p>
      </form>
    </div>
  </dialog>;
}
