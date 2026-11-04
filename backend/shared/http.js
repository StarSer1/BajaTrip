import { config } from '../config/index.js';

// Error con el código HTTP y el mensaje que sí puede ver el usuario.
export class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export function enviarJson(res, estado, cuerpo) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(cuerpo === undefined ? undefined : JSON.stringify(cuerpo));
}

// Cuerpo JSON con límite de tamaño. Exigir application/json también frena los formularios de
// otros sitios: el navegador no puede mandar ese tipo a otro dominio sin preguntar antes.
export async function leerJson(req, limite = 10_000) {
  if (!String(req.headers['content-type']).startsWith('application/json')) {
    throw new ErrorHttp(415, 'Envía los datos como JSON.');
  }
  const partes = [];
  let tamano = 0;
  for await (const parte of req) {
    tamano += parte.length;
    if (tamano > limite) throw new ErrorHttp(413, 'La solicitud es demasiado grande.');
    partes.push(parte);
  }
  try {
    return JSON.parse(Buffer.concat(partes).toString('utf8'));
  } catch {
    throw new ErrorHttp(400, 'Los datos no tienen un formato válido.');
  }
}

export function leerCookies(req) {
  const cookies = {};
  for (const par of (req.headers.cookie ?? '').split(';')) {
    const corte = par.indexOf('=');
    if (corte > 0) cookies[par.slice(0, corte).trim()] = par.slice(corte + 1).trim();
  }
  return cookies;
}

const ipDirecta = (req) => (req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');
const vieneDelBalanceador = (req) => config.proxiesConfiables.includes(ipDirecta(req));

// IP del visitante: la que el balanceador pone en X-Real-IP, o la conexión directa.
export const ipCliente = (req) => (vieneDelBalanceador(req) && req.headers['x-real-ip']) || ipDirecta(req);

export const esHttps = (req) => (vieneDelBalanceador(req)
  ? req.headers['x-forwarded-proto'] === 'https'
  : Boolean(req.socket.encrypted));

// Bitácora en una línea JSON por evento: Docker la junta con «docker compose logs».
// Nunca lleva contraseñas, tokens ni datos personales; la sesión, solo abreviada.
export function bitacora(nivel, evento, detalle = {}) {
  const linea = JSON.stringify({ hora: new Date().toISOString(), nodo: config.nodo, nivel, evento, ...detalle });
  if (nivel === 'error') console.error(linea);
  else console.log(linea);
}
