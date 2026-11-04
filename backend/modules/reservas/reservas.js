import { tours } from '../../../frontend/src/data/experiences.js';
import { config } from '../../config/index.js';
import { pool } from '../../shared/db.js';
import { ErrorHttp } from '../../shared/http.js';

// Límites del negocio, revisados aquí y no en el navegador.
const MAX_VIAJEROS = 6;
const MAX_POR_SESION = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const COLUMNAS = 'id, experiencia_id AS experienciaId, fecha, viajeros, total, nodo, creada_en AS creadaEn';

// Fecha de hoy en Baja California Sur, sin depender de la zona horaria del contenedor.
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mazatlan' }).format(new Date());

function fechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const dia = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(dia.getTime()) || dia.toISOString().slice(0, 10) !== fecha) return false;
  return fecha >= hoy();
}

export async function contarReservas(sesion) {
  const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM reservas WHERE sesion_id = ?', [sesion.id]);
  return total;
}

export async function listarReservas(sesion) {
  const [filas] = await pool.execute(`SELECT ${COLUMNAS} FROM reservas WHERE sesion_id = ? ORDER BY fecha, creada_en`, [sesion.id]);
  return filas;
}

async function buscarPropia(sesion, id) {
  const [filas] = await pool.execute(`SELECT ${COLUMNAS} FROM reservas WHERE id = ? AND sesion_id = ?`, [id, sesion.id]);
  return filas[0] ?? null;
}

// Devuelve { estado, reserva }: 201 si es nueva, 200 si ya estaba (un reintento).
export async function crearReserva(sesion, datos) {
  const id = typeof datos?.id === 'string' ? datos.id.toLowerCase() : '';
  const experiencia = tours.find((t) => t.id === datos?.experienciaId);
  const viajeros = datos?.viajeros;
  if (!UUID.test(id) || !experiencia || !Number.isInteger(viajeros) || viajeros < 1 || viajeros > MAX_VIAJEROS || !fechaValida(datos.fecha)) {
    throw new ErrorHttp(400, 'Revisa la experiencia, la fecha y el número de viajeros.');
  }

  const existente = await buscarPropia(sesion, id);
  if (existente) return { estado: 200, reserva: existente };
  if (await contarReservas(sesion) >= MAX_POR_SESION) {
    throw new ErrorHttp(429, `Puedes guardar hasta ${MAX_POR_SESION} reservas de ejemplo.`);
  }

  // El total nunca se toma del navegador: se recalcula con el precio del catálogo del servidor.
  const total = experiencia.price * viajeros;
  try {
    await pool.execute(
      'INSERT INTO reservas (id, sesion_id, experiencia_id, fecha, viajeros, total, nodo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, sesion.id, experiencia.id, datos.fecha, viajeros, total, config.nodo],
    );
  } catch (error) {
    // El id ya pertenece a otra sesión. Respuesta genérica: no confirma que ese id exista.
    if (error.code === 'ER_DUP_ENTRY') throw new ErrorHttp(409, 'No pudimos guardar esta reserva.');
    throw error;
  }
  return { estado: 201, reserva: await buscarPropia(sesion, id) };
}

// Borra solo si la reserva es de esta sesión. Ajena o inexistente responden igual.
export async function eliminarReserva(sesion, id) {
  if (!UUID.test(id)) return false;
  const [resultado] = await pool.execute('DELETE FROM reservas WHERE id = ? AND sesion_id = ?', [id, sesion.id]);
  return resultado.affectedRows > 0;
}
