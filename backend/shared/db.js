import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

// Un solo grupo de conexiones por nodo. Todas las consultas usan pool.execute con «?»:
// el dato del usuario viaja aparte de la instrucción SQL y nunca se lee como código.
export const pool = mysql.createPool({
  ...config.db,
  connectionLimit: 10,
  connectTimeout: 2000,
  dateStrings: true,
  timezone: 'Z',
});

const esquema = new URL('../../database/schema/bajatrip.sql', import.meta.url);

export async function prepararEsquema() {
  const sql = (await readFile(esquema, 'utf8')).replace(/^\s*--.*$/gm, '');
  for (const sentencia of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    await pool.query(sentencia);
  }
}

// Lo que revisa /salud: que la base conteste de verdad, no solo que el proceso siga vivo.
export async function baseDisponible() {
  await pool.query('SELECT 1');
}
