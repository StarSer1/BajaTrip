// Llamadas a la API del backend (backend/server.js). El mismo sitio también se publica sin
// backend (Cloudflare, npm run dev): ahí /api no responde JSON y se devuelve null.
export async function api(ruta, opciones = {}) {
  try {
    const respuesta = await fetch(ruta, {
      ...opciones,
      headers: opciones.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opciones.body && JSON.stringify(opciones.body),
    });
    const json = respuesta.headers.get('Content-Type')?.includes('application/json');
    if (!json) return null;
    return { ok: respuesta.ok, estado: respuesta.status, datos: respuesta.status === 204 ? null : await respuesta.json() };
  } catch {
    return null;
  }
}

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
