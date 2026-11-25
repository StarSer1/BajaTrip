import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { config } from './config/index.js';
import { baseDisponible, pool, prepararEsquema } from './shared/db.js';
import { bitacora, enviarJson, ErrorHttp, ipCliente, leerJson } from './shared/http.js';
import { textoCorto } from './shared/validar.js';
import { obtenerSesion, sesionCorta } from './modules/auth/sesion.js';
import { entrar, listarUsuarios, perfil, registrar, salir } from './modules/auth/cuentas.js';
import { contarReservas, crearReserva, eliminarReserva, listarReservas, obtenerReserva } from './modules/reservas/reservas.js';
import { enviarFoto, guardarFoto } from './modules/usuarios/foto.js';
import { servirEstatico } from './middleware/estaticos.js';

// Nodo del backend de BajaTrip (Prácticas 5 y 6). Cada nodo es este mismo proceso con otro NODO;
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

// CSRF, además de SameSite: una petición que cambia algo y trae Origin de otro sitio se rechaza.
// (Los navegadores siempre mandan Origin en un POST, PUT o DELETE hecho con fetch o formulario.)
function mismoOrigen(req) {
  const origen = req.headers.origin;
  if (!origen) return true;
  try {
    return new URL(origen).host === req.headers.host;
  } catch {
    return false;
  }
}

// Exige una cuenta. Sin sesión iniciada: 401. Negar por defecto.
function conCuenta(sesion) {
  if (!sesion?.usuarioId) throw new ErrorHttp(401, 'Inicia sesión para continuar.');
  return sesion;
}

async function api(req, res, pathname) {
  const metodo = req.method;
  const registro = (evento, sesion, extra = {}) => bitacora('aviso', evento, { ip: ipCliente(req), ruta: pathname, sesion: sesionCorta(sesion), ...extra });

  if (!['GET', 'HEAD'].includes(metodo) && !mismoOrigen(req)) {
    registro('origen-rechazado', null, { origen: textoCorto(req.headers.origin, 100) });
    throw new ErrorHttp(403, 'Solicitud no permitida.');
  }

  // El navegador manda aquí cada script que la CSP bloqueó. Se registra, sin guardar la página completa.
  if (pathname === '/api/csp-reporte' && metodo === 'POST') {
    const datos = await leerJson(req, 10_000, ['application/csp-report', 'application/json', 'application/reports+json']);
    const reporte = datos?.['csp-report'] ?? datos?.[0]?.body ?? {};
    registro('csp-bloqueo', null, {
      directiva: textoCorto(reporte['violated-directive'] ?? reporte.effectiveDirective, 60),
      bloqueado: textoCorto(reporte['blocked-uri'] ?? reporte.blockedURL, 100),
      pagina: textoCorto(new URL(reporte['document-uri'] ?? reporte.documentURL ?? 'http://x/', 'http://x').pathname, 100),
    });
    return enviarJson(res, 204);
  }

  // La sitekey de Turnstile es pública (va en la página); el secret nunca sale del servidor.
  if (pathname === '/api/config' && metodo === 'GET') {
    return enviarJson(res, 200, { turnstileSitekey: config.turnstile.sitekey });
  }

  if (pathname === '/api/sesion' && metodo === 'GET') {
    const sesion = await obtenerSesion(req, res, { crear: true });
    return enviarJson(res, 200, {
      nodo: config.nodo,
      sesion: sesionCorta(sesion),
      creadaEnNodo: sesion.nodoOrigen,
      reservas: await contarReservas(sesion),
      usuario: perfil(sesion),
    });
  }

  // --- Cuentas ---
  if (pathname === '/api/auth/registro' && metodo === 'POST') {
    return enviarJson(res, 201, await registrar(req, await leerJson(req)));
  }
  if (pathname === '/api/auth/entrar' && metodo === 'POST') {
    const datos = await leerJson(req);
    const sesion = await obtenerSesion(req, res);
    return enviarJson(res, 200, await entrar(req, res, sesion, datos));
  }
  if (pathname === '/api/auth/salir' && metodo === 'POST') {
    await salir(req, res, await obtenerSesion(req, res));
    return enviarJson(res, 204);
  }
  if (pathname === '/api/auth/yo' && metodo === 'GET') {
    return enviarJson(res, 200, { usuario: perfil(await obtenerSesion(req, res)) });
  }

  if (pathname === '/api/cuenta/foto') {
    const sesion = conCuenta(await obtenerSesion(req, res));
    if (metodo === 'PUT') {
      await guardarFoto(req, sesion);
      return enviarJson(res, 204);
    }
    if (metodo === 'GET') return enviarFoto(res, sesion);
  }

  // Esconder el enlace al panel no basta: la ruta revisa el rol en el servidor en cada petición.
  if (pathname === '/api/admin/usuarios' && metodo === 'GET') {
    const sesion = conCuenta(await obtenerSesion(req, res));
    if (sesion.rol !== 'admin') {
      registro('admin-denegado', sesion, { usuario: sesion.usuarioId });
      throw new ErrorHttp(403, 'No tienes permiso para ver esto.');
    }
    return enviarJson(res, 200, await listarUsuarios());
  }

  // --- Reservas ---
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

  const porId = pathname.match(/^\/api\/reservas\/([^/]+)$/);
  if (porId && metodo === 'GET') {
    const sesion = await obtenerSesion(req, res);
    const reserva = await obtenerReserva(sesion, porId[1]);
    if (reserva) return enviarJson(res, 200, reserva);
    // Cambiar el id en la dirección para ver la reserva de otro: mismo 404 que si no existiera.
    registro('reserva-ajena-o-inexistente', sesion, { usuario: sesion?.usuarioId });
    throw new ErrorHttp(404, 'No encontramos esa reserva.');
  }
  if (porId && metodo === 'DELETE') {
    const sesion = await obtenerSesion(req, res);
    if (sesion && await eliminarReserva(sesion, porId[1])) return enviarJson(res, 204);
    // Pedir borrar una reserva que no es tuya es justo lo que se quiere detectar.
    registro('reserva-ajena-o-inexistente', sesion, { usuario: sesion?.usuarioId });
    throw new ErrorHttp(404, 'No encontramos esa reserva.');
  }

  const conocidas = ['/api/sesion', '/api/reservas', '/api/config', '/api/csp-reporte', '/api/cuenta/foto', '/api/admin/usuarios'];
  if (conocidas.includes(pathname) || pathname.startsWith('/api/auth/') || porId) throw new ErrorHttp(405, 'Método no permitido.');
  throw new ErrorHttp(404, 'No encontrado.');
}

const server = createServer(async (req, res) => {
  // Para comprobar el reparto: F12 › Red muestra qué nodo atendió cada petición.
  res.setHeader('X-Servidor', config.nodo);
  // Si alguien llega directo al nodo (sin balanceador), igual recibe las cabeceras básicas.
  // Detrás de Nginx, el balanceador las reemplaza por las suyas (nginx/templates/).
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
    if (error instanceof ErrorHttp) return enviarJson(res, error.estado, { error: error.message }, error.cabeceras);
    // Fallar cerrado: al usuario, un mensaje genérico; el detalle, solo en la bitácora.
    // Nunca se manda la pila del error (stack) al navegador.
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
  bitacora('info', 'nodo-listo', { puerto: config.port, sitio: raiz, modo: process.env.NODE_ENV ?? 'desarrollo' });
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
