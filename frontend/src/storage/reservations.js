import { api, nuevoId } from './servidor.js';

// IndexedDB: guarda las reservas de ejemplo como registros con fecha, viajeros y total.
// Cada una lleva un uuid creado aquí y se copia al servidor cuando hay backend; si no lo hay
// (o no hay señal) queda «pendiente» y se reenvía la próxima vez que se abra Mis viajes.
const DATABASE = 'bajatrip';
const STORE = 'reservas';

function open() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(mode, action) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => { db.close(); resolve(request.result); };
    transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}

// El servidor solo recibe qué, cuándo y cuántos: el total lo calcula él con su catálogo.
async function sincronizar(reserva) {
  const uuid = reserva.uuid ?? nuevoId();
  const respuesta = await api('/api/reservas', {
    method: 'POST',
    body: { id: uuid, experienciaId: reserva.experienceId, fecha: reserva.date, viajeros: reserva.travelers },
  });
  let servidor = 'pendiente';
  if (respuesta?.ok) servidor = 'guardada';
  else if (respuesta && respuesta.estado < 500) servidor = 'rechazada';
  const actualizada = { ...reserva, uuid, servidor };
  if (actualizada.servidor !== reserva.servidor || actualizada.uuid !== reserva.uuid) await run('readwrite', (store) => store.put(actualizada));
  return actualizada;
}

export async function saveReservation(reservation) {
  const record = { ...reservation, uuid: nuevoId(), servidor: 'pendiente', createdAt: new Date().toISOString() };
  record.id = await run('readwrite', (store) => store.add(record));
  return sincronizar(record);
}

export async function listReservations() {
  const items = await run('readonly', (store) => store.getAll());
  return Promise.all(items.map((r) => (r.servidor === 'pendiente' || !r.uuid ? sincronizar(r).catch(() => r) : r)));
}

export async function deleteReservation(id) {
  const record = await run('readonly', (store) => store.get(id));
  await run('readwrite', (store) => store.delete(id));
  if (record?.servidor === 'guardada') await api(`/api/reservas/${record.uuid}`, { method: 'DELETE' });
}
