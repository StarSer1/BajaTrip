// Práctica 4: catálogo de guías locales en IndexedDB. Cada guía es un registro con su
// fotografía guardada como Blob, así que el catálogo no depende de archivos ni de un servidor.
import { categories } from '../data/experiences.js';

const DATABASE = 'bajatrip-guias';
const STORE = 'guias';
export const LATEST_VERSION = 2;

export const specialties = categories;
export const municipalities = ['La Paz', 'Los Cabos', 'Comondú', 'Loreto', 'Mulegé'];
export const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano'];

// Resultado de la última actualización de esquema durante esta visita (null si no hubo).
let migration = null;

// Con ?version=1 la base se crea como en la primera entrega. Solo sirve para demostrar la
// migración: al volver a /guias sin el parámetro, el navegador la actualiza a la versión 2.
export const requestedVersion = () =>
  (new URLSearchParams(window.location.search).get('version') === '1' ? 1 : LATEST_VERSION);

function upgrade(request, oldVersion, newVersion) {
  const db = request.result;
  // Versión 1: almacén con clave autoincremental e índice por municipio para las búsquedas.
  if (oldVersion < 1) {
    db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }).createIndex('municipality', 'municipality');
  }
  // Versión 2: agrega los idiomas con un índice multiEntry (una entrada por idioma).
  // Los registros de la versión 1 se recorren con un cursor y reciben «Español»; ninguno se borra.
  if (oldVersion < 2 && newVersion >= 2) {
    const store = request.transaction.objectStore(STORE);
    store.createIndex('languages', 'languages', { multiEntry: true });
    if (oldVersion === 0) return;
    migration = { from: oldVersion, to: newVersion, records: 0 };
    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return;
      cursor.update({ ...cursor.value, languages: cursor.value.languages ?? ['Español'] });
      migration.records += 1;
      cursor.continue();
    };
  }
}

function open() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, requestedVersion());
    request.onupgradeneeded = (event) => upgrade(request, event.oldVersion, event.newVersion);
    request.onsuccess = () => {
      const db = request.result;
      // Si otra pestaña necesita actualizar el esquema, cerramos esta conexión para no bloquearla.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

// action recibe el almacén y devuelve la solicitud cuyo resultado se entrega al terminar la
// transacción, o una función que lo calcula cuando hay varias solicitudes.
async function run(mode, action) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const pending = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => { db.close(); resolve(typeof pending === 'function' ? pending() : pending.result); };
    transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}

export async function databaseInfo() {
  const db = await open();
  const info = { version: db.version, migration };
  db.close();
  return info;
}

const byName = (a, b) => a.name.localeCompare(b.name, 'es');

// Con municipio la consulta usa su índice; con idioma, el índice multiEntry. Si se eligen
// ambos, el índice de municipio reduce la lista y el idioma se filtra sobre ese resultado.
export async function searchGuides({ municipality = '', language = '' } = {}) {
  const index = municipality ? 'municipality' : language ? 'languages' : null;
  const guides = await run('readonly', (store) =>
    (index ? store.index(index).getAll(municipality || language) : store.getAll()));
  const results = municipality && language ? guides.filter((g) => g.languages?.includes(language)) : guides;
  return { guides: results.sort(byName), index };
}

// El gráfico cuenta los registros de cada municipio directamente con el índice.
export const countByMunicipality = () => run('readonly', (store) => {
  const index = store.index('municipality');
  const counts = municipalities.map((label) => [label, index.count(label)]);
  return () => counts.map(([label, request]) => ({ label, value: request.result }));
});

export const getGuide = (id) => run('readonly', (store) => store.get(id));
// put agrega el registro si no trae id (la clave se genera sola) o lo reemplaza si ya existe.
export const saveGuide = (guide) => run('readwrite', (store) => store.put(guide));
export const deleteGuide = (id) => run('readwrite', (store) => store.delete(id));
