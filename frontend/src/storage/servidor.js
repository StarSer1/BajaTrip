// Llamadas a la API del backend (backend/server.js). El mismo sitio también se publica sin
// backend (Cloudflare, npm run dev): ahí /api no responde JSON y se devuelve null.
// Un Blob o File (la foto de perfil) se manda tal cual; cualquier otro cuerpo, como JSON.
export async function api(ruta, opciones = {}) {
  const binario = opciones.body instanceof Blob;
  let headers;
  if (binario) headers = { 'Content-Type': opciones.body.type || 'application/octet-stream' };
  else if (opciones.body) headers = { 'Content-Type': 'application/json' };
  try {
    const respuesta = await fetch(ruta, {
      ...opciones,
      headers,
      body: binario ? opciones.body : opciones.body && JSON.stringify(opciones.body),
    });
    // 204 (sin contenido) es éxito aunque no traiga Content-Type: por HTTP/2 Nginx no lo reenvía.
    if (respuesta.status === 204) return { ok: true, estado: 204, datos: null };
    const json = respuesta.headers.get('Content-Type')?.includes('application/json');
    if (!json) return null;
    return { ok: respuesta.ok, estado: respuesta.status, datos: await respuesta.json() };
  } catch {
    return null;
  }
}

// Mensaje para mostrar cuando la API respondió con error, o cuando no hay backend.
export const mensajeDeError = (respuesta, otro = 'No pudimos completar la solicitud. Intenta de nuevo en un momento.') => {
  if (!respuesta) return 'Las cuentas solo funcionan en el servidor de BajaTrip (no en esta versión de demostración).';
  return respuesta.datos?.error ?? otro;
};

// crypto.randomUUID solo existe en HTTPS o localhost; desde otra computadora de la red
// (http://192.168.…:8080) se arma el mismo formato con getRandomValues.
export function nuevoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
