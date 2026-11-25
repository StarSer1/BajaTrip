import { createHash } from 'node:crypto';
import { pool } from '../../shared/db.js';
import { ErrorHttp } from '../../shared/http.js';

// Límite de intentos guardado en MySQL: los dos nodos comparten el contador, así que repartir
// los intentos entre servidores no sirve para saltárselo.

// El correo se guarda como huella: la tabla no revela qué cuentas se intentaron.
export const claveCorreo = (accion, correo) => `${accion}:correo:${createHash('sha256').update(correo).digest('hex')}`;
export const claveIp = (accion, ip) => `${accion}:ip:${ip}`.slice(0, 80);

// Lanza 429 con Retry-After si alguna de las claves ya agotó sus intentos en la ventana.
export async function revisarLimite(claves, { maximo, minutos }) {
  for (const clave of claves) {
    const [filas] = await pool.execute(
      `SELECT contador, TIMESTAMPDIFF(SECOND, NOW(), ventana_inicio + INTERVAL ? MINUTE) AS restante
         FROM intentos WHERE clave = ?`,
      [minutos, clave],
    );
    const fila = filas[0];
    if (fila && fila.restante > 0 && fila.contador >= maximo) {
      const minutosRestantes = Math.ceil(fila.restante / 60);
      throw new ErrorHttp(429, `Demasiados intentos. Espera ${minutosRestantes} ${minutosRestantes === 1 ? 'minuto' : 'minutos'} e inténtalo de nuevo.`, { 'Retry-After': String(fila.restante) });
    }
  }
}

// Suma un intento. Si la ventana ya venció, empieza una nueva. MySQL evalúa las asignaciones de
// izquierda a derecha: contador se calcula con la ventana_inicio anterior, antes de cambiarla.
export async function sumarIntento(claves, { minutos }) {
  for (const clave of claves) {
    await pool.execute(
      `INSERT INTO intentos (clave, contador, ventana_inicio) VALUES (?, 1, NOW())
       ON DUPLICATE KEY UPDATE
         contador = IF(ventana_inicio <= NOW() - INTERVAL ? MINUTE, 1, contador + 1),
         ventana_inicio = IF(ventana_inicio <= NOW() - INTERVAL ? MINUTE, NOW(), ventana_inicio)`,
      [clave, minutos, minutos],
    );
  }
}

export async function reiniciar(clave) {
  await pool.execute('DELETE FROM intentos WHERE clave = ?', [clave]);
}
