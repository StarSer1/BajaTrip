import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { enviarJson, ErrorHttp } from '../shared/http.js';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function archivo(ruta) {
  try {
    const info = await stat(ruta);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

// Sirve el sitio compilado (dist/). Las rutas de React Router (/catalogo, /mis-viajes…) no son
// archivos: reciben index.html y el navegador decide qué vista mostrar.
export async function servirEstatico(req, res, pathname, raiz) {
  let ruta;
  try {
    ruta = resolve(join(raiz, decodeURIComponent(pathname)));
  } catch {
    throw new ErrorHttp(400, 'Dirección no válida.');
  }
  // Nada fuera de dist/: /../.env o %2e%2e se quedan sin respuesta.
  if (ruta !== raiz && !ruta.startsWith(raiz + sep)) throw new ErrorHttp(404, 'No encontrado.');

  let info = await archivo(ruta);
  if (!info && !extname(ruta)) info = await archivo(ruta = join(raiz, 'index.html'));
  if (!info) {
    if (ruta.endsWith('index.html')) return enviarJson(res, 503, { error: 'Falta compilar el sitio: npm run build.' });
    throw new ErrorHttp(404, 'No encontrado.');
  }

  res.writeHead(200, {
    'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream',
    'Content-Length': info.size,
    // Los archivos de /assets llevan una huella en el nombre y nunca cambian; lo demás se revalida.
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(ruta).on('error', () => res.destroy()).pipe(res);
}
