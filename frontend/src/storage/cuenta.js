import { api } from './servidor.js';

// Cuenta del visitante. La sesión vive en una cookie HttpOnly que JavaScript no puede leer:
// para saber quién está conectado se le pregunta al servidor (/api/auth/yo).
// Ningún dato de la cuenta se guarda en localStorage.
const AVISO = 'bajatrip:cuenta';

export const avisarCambio = () => window.dispatchEvent(new Event(AVISO));
export const alCambiar = (fn) => {
  window.addEventListener(AVISO, fn);
  return () => window.removeEventListener(AVISO, fn);
};

export async function quienSoy() {
  const respuesta = await api('/api/auth/yo');
  return respuesta?.ok ? respuesta.datos.usuario : null;
}

export const configuracion = () => api('/api/config');
export const registrar = (datos) => api('/api/auth/registro', { method: 'POST', body: datos });

export async function entrar(datos) {
  const respuesta = await api('/api/auth/entrar', { method: 'POST', body: datos });
  if (respuesta?.ok) avisarCambio();
  return respuesta;
}

export async function salir() {
  const respuesta = await api('/api/auth/salir', { method: 'POST' });
  avisarCambio();
  return respuesta;
}

export const subirFoto = (archivo) => api('/api/cuenta/foto', { method: 'PUT', body: archivo });
export const reservasDeLaCuenta = () => api('/api/reservas');
export const reservaPorId = (id) => api(`/api/reservas/${encodeURIComponent(id)}`);
export const usuariosAdmin = () => api('/api/admin/usuarios');
