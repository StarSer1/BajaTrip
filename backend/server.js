import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { config } from './config/index.js';
import { baseDisponible, pool, prepararEsquema } from './shared/db.js';
import { bitacora, enviarJson, ErrorHttp, ipCliente, leerJson } from './shared/http.js';
import { obtenerSesion, sesionCorta } from './modules/auth/sesion.js';
import { contarReservas, crearReserva, eliminarReserva, listarReservas } from './modules/reservas/reservas.js';
import { servirEstatico } from './middleware/estaticos.js';

// Nodo del backend de BajaTrip (Práctica 5). Cada nodo es este mismo proceso con otro NODO;
// el balanceador reparte entre ellos y todos usan la misma base de datos.
const raiz = resolve(config.dist);

async function salud(req, res) {
  try {
    await baseDisponible();
    enviarJson(res, 200, { nodo: config.nodo, bd: 'ok', ip_cliente: ipCliente(req) });
  } catch {
    enviarJson(res, 503, { nodo: config.nodo, bd: 'caida' });
  }
}

async function api(req, res, pathname) {
  const metodo = req.method;
  const registro = (evento, sesion) => bitacora('aviso', evento, { ip: ipCliente(req), ruta: pathname, sesion: sesion && sesionCorta(sesion) });

  if (pathname === '/api/sesion' && metodo === 'GET') {
    const sesion = await obtenerSesion(req, res, { crear: true });
    return enviarJson(res, 200, {
      nodo: config.nodo,
      sesion: sesionCorta(sesion),
      creadaEnNodo: sesion.nodoOrigen,
      reservas: await contarReservas(sesion),
    });
  }

  if (pathname === '/api/reservas' && metodo === 'GET') {
    const sesion = await obtenerSesion(req, res);
    return enviarJson(res, 200, sesion ? await listarReservas(sesion) : []);
  }

  if (pathname === '/api/reservas' && metodo === 'POST') {
    const datos = await leerJson(req);
    const sesion = await obtenerSesion(req, res, { crear: true });
    try {
      const { estado, reserva } = await crearReserva(sesion, datos);
      return enviarJson(res, estado, reserva);
    } catch (error) {
      if (error instanceof ErrorHttp) registro(`reserva-rechazada-${error.estado}`, sesion);
      throw error;
    }
  }

  const borrar = pathname.match(/^\/api\/reservas\/([^/]+)$/);
  if (borrar && metodo === 'DELETE') {
    const sesion = await obtenerSesion(req, res);
    if (sesion && await eliminarReserva(sesion, borrar[1])) return enviarJson(res, 204);
    // Pedir borrar una reserva que no es tuya es justo lo que se quiere detectar.
    registro('reserva-ajena-o-inexistente', sesion);
    throw new ErrorHttp(404, 'No encontramos esa reserva.');
  }

  if (['/api/sesion', '/api/reservas'].includes(pathname) || borrar) throw new ErrorHttp(405, 'Método no permitido.');
  throw new ErrorHttp(404, 'No encontrado.');
}

const server = createServer(async (req, res) => {
  // Para comprobar el reparto: F12 › Red muestra qué nodo atendió cada petición.
  res.setHeader('X-Servidor', config.nodo);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const { pathname } = new URL(req.url, 'http://bajatrip');
    if (pathname === '/salud') return await salud(req, res);
    if (pathname.startsWith('/api/')) return await api(req, res, pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new ErrorHttp(405, 'Método no permitido.');
    return await servirEstatico(req, res, pathname, raiz);
  } catch (error) {
    if (res.headersSent) return res.destroy();
    if (error instanceof ErrorHttp) return enviarJson(res, error.estado, { error: error.message });
    // Fallar cerrado: al usuario, un mensaje genérico; el detalle, solo en la bitácora.
    bitacora('error', 'error-interno', { ruta: req.url, codigo: error.code ?? error.name, mensaje: error.message });
    return enviarJson(res, 503, { error: 'No pudimos completar la solicitud. Intenta de nuevo en un momento.' });
  }
});

// La base puede tardar en arrancar (MySQL en Docker tarda unos segundos): el nodo atiende desde
// el principio, /salud responde 503 mientras tanto y el esquema se reintenta hasta que conteste.
async function conectar() {
  try {
    await prepararEsquema();
    bitacora('info', 'base-lista', { host: config.db.host });
  } catch (error) {
    bitacora('error', 'base-no-disponible', { codigo: error.code ?? error.name, reintento: '3 s' });
    setTimeout(conectar, 3000).unref();
  }
}

server.listen(config.port, '0.0.0.0', () => {
  bitacora('info', 'nodo-listo', { puerto: config.port, sitio: raiz });
  conectar();
});

// docker compose stop manda SIGTERM: se terminan las peticiones en curso antes de salir.
for (const senal of ['SIGTERM', 'SIGINT']) {
  process.on(senal, () => {
    bitacora('info', 'nodo-apagandose', { senal });
    server.close(() => pool.end().finally(() => process.exit(0)));
    server.closeIdleConnections();
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
