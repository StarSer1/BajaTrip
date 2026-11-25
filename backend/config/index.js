import { fileURLToPath } from 'node:url';

// Todo lo que cambia entre nodos o entre equipos llega por variables de entorno.
// Las contraseñas nunca se escriben aquí: van en .env, que no se sube al repositorio.
const env = process.env;

export const config = {
  port: Number(env.PORT) || 3000,
  // Identifica al nodo en la cabecera X-Servidor, en /salud y en la bitácora.
  nodo: env.NODO || 'sin-nombre',
  // Solo se aceptan X-Real-IP y X-Forwarded-Proto si la petición viene de estas direcciones
  // (el balanceador). De cualquier otra, alguien podría inventarlas.
  proxiesConfiables: (env.PROXIES_CONFIABLES || '127.0.0.1,::1').split(',').map((ip) => ip.trim()).filter(Boolean),
  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT) || 3306,
    database: env.DB_DATABASE || 'bajatrip',
    user: env.DB_USERNAME || 'bajatrip',
    password: env.DB_PASSWORD || '',
  },
  dist: env.DIST_DIR || fileURLToPath(new URL('../../dist', import.meta.url)),
  // Fotos de perfil: fuera de dist/, para que nunca se sirvan como parte del sitio. En Docker es
  // un volumen que montan los dos nodos, así que la foto subida al nodo 1 la lee el nodo 2.
  subidas: env.SUBIDAS_DIR || fileURLToPath(new URL('../../subidas', import.meta.url)),
  turnstile: {
    // Sin llaves en .env se usan las de prueba de Cloudflare (siempre pasan): solo para desarrollo.
    sitekey: env.TURNSTILE_SITEKEY || '1x00000000000000000000AA',
    secret: env.TURNSTILE_SECRET || '1x0000000000000000000000000000000AA',
  },
};
