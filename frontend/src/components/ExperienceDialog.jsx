import { useState } from 'react';
import { Link } from 'react-router-dom';
import useModalDialog from '../hooks/useModalDialog.js';
import { saveReservation } from '../storage/reservations.js';
import { longDate, money, people, today } from '../utils/format.js';

export default function ExperienceDialog({ experience: t, travelers, onClose }) {
  const dialogRef = useModalDialog();
  const [result, setResult] = useState(null);

  async function reserve(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const field = form.elements.fecha;
    field.min = today();
    if (!form.reportValidity()) return;
    const summary = `Tu selección de ejemplo: ${t.name}, ${longDate(field.value)}, ${people(travelers)}. No se envió ninguna solicitud.`;
    try {
      await saveReservation({ experienceId: t.id, name: t.name, destination: t.destination, date: field.value, travelers, total: t.price * travelers });
      setResult({ text: `${summary} La guardamos en Mis viajes, solo en este navegador.`, saved: true });
    } catch {
      setResult({ text: `${summary} Este navegador no permitió guardarla.`, saved: false });
    }
  }

  return <dialog ref={dialogRef} id="details" aria-labelledby="dialog-title" onCancel={onClose}>
    <button className="close" aria-label="Cerrar detalles" onClick={onClose}>✕</button>
    <div id="dialog-content">
      <p className="eyebrow">{t.destination} · {t.duration} horas</p>
      <h2 id="dialog-title">{t.name}</h2><p>{t.description}</p>
      <h3>Qué incluiría</h3><ul>{t.includes.map((item) => <li key={item}>{item}</li>)}</ul>
      <p>El itinerario, los requisitos y la disponibilidad se confirmarán cuando el prestador publique el servicio.</p>
      <p><strong>{money(t.price * travelers)} MXN</strong> para {people(travelers)} · precio ilustrativo.</p>
      <p className="notice">Demostración: las fotografías, servicios y precios son ilustrativos. No se realizan cobros ni reservas reales.</p>
      <form id="reservation" onSubmit={reserve}>
        <label>Fecha de tu aventura<input type="date" name="fecha" required min={today()} /></label>
        <button className="button">Probar reserva de ejemplo</button>
        <p className="result" role="status">{result?.text}{result?.saved && <> <Link to="/mis-viajes">Ver Mis viajes</Link></>}</p>
      </form>
    </div>
  </dialog>;
}
