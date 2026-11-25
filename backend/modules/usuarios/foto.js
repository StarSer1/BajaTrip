import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../../config/index.js';
import { pool } from '../../shared/db.js';
import { bitacora, ErrorHttp, ipCliente, leerBinario } from '../../shared/http.js';

// Subida segura de la foto de perfil. Un archivo subido lo eligió otra persona, así que:
// 1. Se limita el tamaño (2 MB) antes de leerlo completo.
// 2. El tipo se decide por los primeros bytes del contenido, no por la extensión ni por el
//    Content-Type que manda el navegador: «foto.jpg.php» o un PHP con Content-Type image/jpeg
//    no empiezan como una imagen y se rechazan.
// 3. Se guarda con un nombre nuevo al azar, fuera de dist/ (no es parte del sitio y nadie la
//    puede pedir por su ruta), y solo su dueño la puede ver.
export const MAX_FOTO = 2 * 1024 * 1024;

const TIPOS = [
  { tipo: 'image/jpeg', ext: '.jpg', firma: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { tipo: 'image/png', ext: '.png', firma: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { tipo: 'image/webp', ext: '.webp', firma: (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' },
];
const NOMBRE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const detectarTipo = (bytes) => (bytes.length >= 12 ? TIPOS.find((t) => t.firma(bytes)) : undefined);

export async function guardarFoto(req, sesion) {
  const bytes = await leerBinario(req, MAX_FOTO);
  const tipo = detectarTipo(bytes);
  if (!tipo) {
    bitacora('aviso', 'archivo-rechazado', { ip: ipCliente(req), usuario: sesion.usuarioId, bytes: bytes.length });
    throw new ErrorHttp(415, 'Solo se aceptan fotos JPG, PNG o WebP.');
  }
  const nombre = `${randomUUID()}${tipo.ext}`;
  await mkdir(config.subidas, { recursive: true });
  // wx: falla si el archivo ya existe en lugar de sobrescribirlo. 0o600: solo el proceso lo lee.
  await writeFile(join(config.subidas, nombre), bytes, { flag: 'wx', mode: 0o600 });
  await pool.execute('UPDATE usuarios SET foto = ? WHERE id = ?', [nombre, sesion.usuarioId]);
  if (sesion.foto && NOMBRE.test(sesion.foto)) await rm(join(config.subidas, sesion.foto), { force: true });
  bitacora('info', 'foto-actualizada', { usuario: sesion.usuarioId, tipo: tipo.tipo, bytes: bytes.length });
}

// Se entrega con el tipo detectado al guardarla, nosniff y una CSP que la encierra: aunque el
// archivo trajera HTML o JavaScript escondido, el navegador no lo ejecuta.
export function enviarFoto(res, sesion) {
  if (!sesion.foto || !NOMBRE.test(sesion.foto)) throw new ErrorHttp(404, 'Aún no tienes foto.');
  const tipo = TIPOS.find((t) => sesion.foto.endsWith(t.ext)).tipo;
  const flujo = createReadStream(join(config.subidas, sesion.foto));
  flujo.once('error', () => (res.headersSent ? res.destroy() : res.writeHead(404).end()));
  flujo.once('open', () => {
    res.writeHead(200, {
      'Content-Type': tipo,
      'Content-Disposition': 'inline; filename="foto"',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'private, no-store',
    });
    flujo.pipe(res);
  });
}
