import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { tours } from '../data/experiences.js';
import { reservaPorId } from '../storage/cuenta.js';
import { mensajeDeError } from '../storage/servidor.js';
import { longDate, money, people } from '../utils/format.js';

// /mis-viajes/reserva/<id>. Cambiar el id en la dirección por el de otra persona no sirve: el
// servidor solo entrega la reserva a su dueño y, si no es tuya, responde como si no existiera.
export default function ReservationPage() {
  const { id } = useParams();
  const [estado, setEstado] = useState({ cargando: true });
  useEffect(() => {
    reservaPorId(id).then((respuesta) => setEstado(respuesta?.ok
      ? { reserva: respuesta.datos }
      : { error: mensajeDeError(respuesta) }));
  }, [id]);

  const experiencia = tours.find((t) => t.id === estado.reserva?.experienciaId);
  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">RESERVA DE EJEMPLO</p><h1>{experiencia?.name ?? 'Reserva'}</h1></header>
    {estado.cargando && <p role="status">Cargando…</p>}
    {estado.error && <div className="empty-state"><h2>{estado.error}</h2><p>Solo puedes ver las reservas de tu cuenta o de este navegador.</p></div>}
    {estado.reserva && <dl className="reservation-detail">
      <div><dt>Fecha</dt><dd>{longDate(estado.reserva.fecha)}</dd></div>
      <div><dt>Destino</dt><dd>{experiencia?.destination}</dd></div>
      <div><dt>Viajeros</dt><dd>{people(estado.reserva.viajeros)}</dd></div>
      <div><dt>Total (calculado por el servidor)</dt><dd>{money(estado.reserva.total)} MXN</dd></div>
      <div><dt>Guardada por el nodo</dt><dd>{estado.reserva.nodo}</dd></div>
    </dl>}
    <Link className="button button--secundario" to="/mis-viajes">Volver a Mis viajes</Link>
  </div>;
}
