import { ErrorHttp } from './http.js';

// Validación en el servidor. La del navegador (required, type="email"…) es solo para ayudar a
// quien llena el formulario: cualquiera puede mandar la petición sin pasar por la página.
// Cada función devuelve el valor limpio o lanza un 400 con un mensaje que sí se puede mostrar.

const CORREO = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
// Letras (con acentos), espacios, punto, apóstrofo y guion. Nada de < > " ni llaves.
const NOMBRE = /^[\p{L}][\p{L} .'-]{1,59}$/u;

export function correo(valor) {
  const limpio = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (!CORREO.test(limpio)) throw new ErrorHttp(400, 'Escribe un correo válido.');
  return limpio;
}

export function nombre(valor) {
  const limpio = typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
  if (!NOMBRE.test(limpio)) throw new ErrorHttp(400, 'Escribe tu nombre (de 2 a 60 letras).');
  return limpio;
}

// bcrypt solo usa los primeros 72 bytes: más largo daría una falsa sensación de seguridad.
export function contrasena(valor, { nueva = false } = {}) {
  if (typeof valor !== 'string' || valor.length === 0) throw new ErrorHttp(400, 'Escribe tu contraseña.');
  const bytes = Buffer.byteLength(valor, 'utf8');
  if (bytes > 72) throw new ErrorHttp(400, 'La contraseña puede tener hasta 72 caracteres.');
  if (nueva && valor.length < 8) throw new ErrorHttp(400, 'La contraseña debe tener al menos 8 caracteres.');
  return valor;
}

export function textoCorto(valor, maximo) {
  return typeof valor === 'string' ? valor.slice(0, maximo) : '';
}
