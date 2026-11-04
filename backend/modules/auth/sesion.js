import { createHash, randomBytes } from 'node:crypto';
import { config } from '../../config/index.js';
import { pool } from '../../shared/db.js';
import { esHttps, leerCookies } from '../../shared/http.js';

// Sesión en almacén compartido (docs/balanceo.md): la cookie solo lleva un token al azar y
// cualquier nodo la busca en la misma tabla, así que sobrevive a cambiar de servidor.
const COOKIE = 'bt_sesion';
const DIAS = 30;
const huella = (token) => createHash('sha256').update(token).digest('hex');

// Devuelve la sesión de la petición, o null. Con crear, abre una nueva si no hay una válida.
export async function obtenerSesion(req, res, { crear = false } = {}) {
  const token = leerCookies(req)[COOKIE];
  if (/^[\w-]{43}$/.test(token ?? '')) {
    const id = huella(token);
    const [filas] = await pool.execute(
      'SELECT id, nodo_origen AS nodoOrigen FROM sesiones WHERE id = ? AND ultima_actividad > NOW() - INTERVAL ? DAY',
      [id, DIAS],
    );
    if (filas.length > 0) {
      await pool.execute('UPDATE sesiones SET ultima_actividad = NOW() WHERE id = ?', [id]);
      return filas[0];
    }
  }
  if (!crear) return null;

  const nuevo = randomBytes(32).toString('base64url');
  const id = huella(nuevo);
  await pool.execute('INSERT INTO sesiones (id, nodo_origen) VALUES (?, ?)', [id, config.nodo]);
  // HttpOnly: JavaScript no puede leerla. SameSite=Lax: otro sitio no puede usarla para
  // mandar un POST o un DELETE en nombre del visitante. Secure cuando se entra por HTTPS.
  res.setHeader('Set-Cookie', `${COOKIE}=${nuevo}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; SameSite=Lax${esHttps(req) ? '; Secure' : ''}`);
  return { id, nodoOrigen: config.nodo };
}

// Para mostrar y registrar la sesión sin exponer nada útil: los primeros 8 caracteres de su huella.
export const sesionCorta = (sesion) => sesion.id.slice(0, 8);
