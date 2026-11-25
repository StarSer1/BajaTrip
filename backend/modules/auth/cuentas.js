import bcrypt from 'bcryptjs';
import { pool } from '../../shared/db.js';
import { bitacora, enmascararCorreo, ErrorHttp, ipCliente } from '../../shared/http.js';
import * as validar from '../../shared/validar.js';
import { captchaValido } from './captcha.js';
import { claveCorreo, claveIp, reiniciar, revisarLimite, sumarIntento } from './limite.js';
import { cerrarSesion, iniciarSesion, sesionCorta } from './sesion.js';

// bcrypt es lento a propósito (costo 12 ≈ 250 ms): a quien se lleve la base le cuesta lo mismo
// probar cada contraseña. La sal va dentro del propio hash.
const COSTO = 12;
// Si el correo no existe se compara contra este hash, para que la respuesta tarde lo mismo y el
// tiempo no revele qué correos tienen cuenta.
const HASH_FALSO = bcrypt.hashSync('no-es-una-contrasena-de-nadie', COSTO);

// 5 fallos por cuenta cada 15 min frena a quien adivina la contraseña de alguien. Por IP el límite
// es más alto (20): en el wifi de un hotel muchos turistas salen por la misma dirección.
const LIMITE_CORREO = { maximo: 5, minutos: 15 };
const LIMITE_IP = { maximo: 20, minutos: 15 };
const LIMITE_REGISTRO = { maximo: 20, minutos: 15 };

// El mismo mensaje exista o no el correo, y sea cual sea el dato equivocado.
const ERROR_ENTRAR = 'Correo o contraseña incorrectos.';
// El registro tampoco dice si el correo ya tenía cuenta.
const LISTO_REGISTRO = 'Si el correo no tenía cuenta, ya quedó lista. Inicia sesión para continuar.';

export async function registrar(req, datos) {
  const ip = ipCliente(req);
  // Campo trampa: está oculto en la página; una persona lo deja vacío y un programa lo llena.
  // Se responde igual que si todo saliera bien para no enseñarle al programa qué lo delató.
  if (datos?.sitio) {
    bitacora('aviso', 'registro-trampa', { ip });
    return { mensaje: LISTO_REGISTRO };
  }
  const correo = validar.correo(datos?.correo);
  const nombre = validar.nombre(datos?.nombre);
  const contrasena = validar.contrasena(datos?.contrasena, { nueva: true });

  const claves = [claveIp('registro', ip)];
  await revisarLimite(claves, LIMITE_REGISTRO);
  await sumarIntento(claves, LIMITE_REGISTRO);

  if (!(await captchaValido(datos?.captcha, ip))) {
    throw new ErrorHttp(400, 'No pudimos comprobar que eres una persona. Vuelve a resolver la verificación.');
  }

  const hash = await bcrypt.hash(contrasena, COSTO);
  try {
    await pool.execute('INSERT INTO usuarios (correo, nombre, contrasena_hash) VALUES (?, ?, ?)', [correo, nombre, hash]);
    bitacora('info', 'registro', { ip, correo: enmascararCorreo(correo) });
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    bitacora('aviso', 'registro-correo-existente', { ip, correo: enmascararCorreo(correo) });
  }
  return { mensaje: LISTO_REGISTRO };
}

export async function entrar(req, res, sesion, datos) {
  const ip = ipCliente(req);
  const correo = validar.correo(datos?.correo);
  const contrasena = validar.contrasena(datos?.contrasena);
  const porIp = claveIp('entrar', ip);
  const porCorreo = claveCorreo('entrar', correo);
  try {
    await revisarLimite([porIp], LIMITE_IP);
    await revisarLimite([porCorreo], LIMITE_CORREO);
  } catch (error) {
    bitacora('aviso', 'entrar-bloqueado', { ip, correo: enmascararCorreo(correo) });
    throw error;
  }

  const [filas] = await pool.execute('SELECT id, nombre, rol, contrasena_hash AS hash FROM usuarios WHERE correo = ?', [correo]);
  const usuario = filas[0];
  const coincide = await bcrypt.compare(contrasena, usuario?.hash ?? HASH_FALSO);
  if (!usuario || !coincide) {
    await sumarIntento([porIp], LIMITE_IP);
    await sumarIntento([porCorreo], LIMITE_CORREO);
    bitacora('aviso', 'entrar-fallido', { ip, correo: enmascararCorreo(correo) });
    throw new ErrorHttp(401, ERROR_ENTRAR);
  }

  // El bloqueo por IP sigue contando: así no se pueden probar muchos correos desde un mismo lugar.
  await reiniciar(porCorreo);
  const nueva = await iniciarSesion(req, res, sesion, usuario.id);
  bitacora('info', 'entrar', { ip, usuario: usuario.id, sesion: nueva.slice(0, 8) });
  return { nombre: usuario.nombre, rol: usuario.rol };
}

export async function salir(req, res, sesion) {
  await cerrarSesion(req, res, sesion);
  if (sesion?.usuarioId) bitacora('info', 'salir', { ip: ipCliente(req), usuario: sesion.usuarioId, sesion: sesionCorta(sesion) });
}

export const perfil = (sesion) => (sesion?.usuarioId
  ? { nombre: sesion.nombre, correo: sesion.correo, rol: sesion.rol, foto: Boolean(sesion.foto) }
  : null);

// Solo para el administrador. Correos enmascarados: para moderar no hace falta verlos completos.
export async function listarUsuarios() {
  const [filas] = await pool.execute('SELECT id, nombre, correo, rol, creado_en AS creadoEn FROM usuarios ORDER BY id');
  return filas.map((u) => ({ ...u, correo: enmascararCorreo(u.correo) }));
}
