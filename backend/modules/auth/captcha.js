import { config } from '../../config/index.js';
import { bitacora } from '../../shared/http.js';

const VERIFICAR = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Cloudflare Turnstile. El widget en /registro entrega un token; aquí el servidor le pregunta a
// Cloudflare si es válido. Un token solo sirve una vez y caduca a los 5 minutos.
// Falla cerrado: si Cloudflare no contesta, el registro se rechaza en lugar de dejarlo pasar.
export async function captchaValido(token, ip) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
  try {
    const respuesta = await fetch(VERIFICAR, {
      method: 'POST',
      body: new URLSearchParams({ secret: config.turnstile.secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const resultado = await respuesta.json();
    if (!resultado.success) bitacora('aviso', 'captcha-rechazado', { ip, codigos: resultado['error-codes'] });
    return resultado.success === true;
  } catch (error) {
    bitacora('error', 'captcha-sin-respuesta', { ip, codigo: error.code ?? error.name });
    return false;
  }
}
