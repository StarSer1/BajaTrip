import { createHash, randomBytes } from 'node:crypto';
import { config } from '../../config/index.js';
import { pool } from '../../shared/db.js';
import { esHttps, leerCookies } from '../../shared/http.js';

// Sesión en almacén compartido (docs/balanceo.md): la cookie solo lleva un token al azar y
// cualquier nodo la busca en la misma tabla, así que sobrevive a cambiar de servidor.
const COOKIE = 'bt_sesion';
const DIAS = 30;
const huella = (token) => createHash('sha256').update(token).digest('hex');

// HttpOnly: JavaScript no puede leerla (un script inyectado no se la puede llevar).
// SameSite=Lax: otro sitio no puede usarla para mandar un POST o un DELETE en nombre del visitante.
// Secure: solo viaja por HTTPS. El balanceador avisa con X-Forwarded-Proto si entró por HTTPS.
function cookie(req, valor, maxAge) {
  return `${COOKIE}=${valor}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${esHttps(req) ? '; Secure' : ''}`;
}

async function nuevaSesion(req, res, usuarioId = null) {
  const token = randomBytes(32).toString('base64url');
  const id = huella(token);
  await pool.execute('INSERT INTO sesiones (id, usuario_id, nodo_origen) VALUES (?, ?, ?)', [id, usuarioId, config.nodo]);
  res.setHeader('Set-Cookie', cookie(req, token, DIAS * 86400));
  return id;
}

// Devuelve la sesión de la petición, o null. Con crear, abre una nueva si no hay una válida.
// Incluye la cuenta (usuarioId, nombre, rol) si la sesión tiene una: el rol se lee siempre de
// la base, nunca de algo que mande el navegador.
export async function obtenerSesion(req, res, { crear = false } = {}) {
  const token = leerCookies(req)[COOKIE];
  if (/^[\w-]{43}$/.test(token ?? '')) {
    const id = huella(token);
    const [filas] = await pool.execute(
      `SELECT s.id, s.nodo_origen AS nodoOrigen, u.id AS usuarioId, u.nombre, u.correo, u.rol, u.foto
         FROM sesiones s LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.id = ? AND s.ultima_actividad > NOW() - INTERVAL ? DAY`,
      [id, DIAS],
    );
    if (filas.length > 0) {
      await pool.execute('UPDATE sesiones SET ultima_actividad = NOW() WHERE id = ?', [id]);
      return filas[0];
    }
  }
  if (!crear) return null;
  return { id: await nuevaSesion(req, res), nodoOrigen: config.nodo, usuarioId: null };
}

// Al entrar se emite un token NUEVO (contra la fijación de sesión: un token que alguien conocía
// antes del inicio de sesión deja de servir). Las reservas anónimas pasan a la cuenta.
export async function iniciarSesion(req, res, anterior, usuarioId) {
  const id = await nuevaSesion(req, res, usuarioId);
  if (anterior) {
    await pool.execute('UPDATE reservas SET usuario_id = ? WHERE sesion_id = ? AND usuario_id IS NULL', [usuarioId, anterior.id]);
    await pool.execute('DELETE FROM sesiones WHERE id = ?', [anterior.id]);
  }
  return id;
}

// Cerrar sesión de verdad: se borra en el servidor. Aunque alguien hubiera copiado la cookie,
// ya no corresponde a ninguna sesión. Borrarla solo del navegador no bastaría.
export async function cerrarSesion(req, res, sesion) {
  if (sesion) await pool.execute('DELETE FROM sesiones WHERE id = ?', [sesion.id]);
  res.setHeader('Set-Cookie', cookie(req, '', 0));
}

// Para mostrar y registrar la sesión sin exponer nada útil: los primeros 8 caracteres de su huella.
export const sesionCorta = (sesion) => sesion?.id.slice(0, 8);
