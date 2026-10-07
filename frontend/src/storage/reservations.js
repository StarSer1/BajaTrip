// IndexedDB: guarda las reservas de ejemplo como registros con fecha, viajeros y total,
// sin servidor. Cuando exista el backend, aquí quedarán las solicitudes pendientes de enviar.
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

export const saveReservation = (reservation) => run('readwrite', (store) => store.add({ ...reservation, createdAt: new Date().toISOString() }));
export const listReservations = () => run('readonly', (store) => store.getAll());
export const deleteReservation = (id) => run('readwrite', (store) => store.delete(id));
