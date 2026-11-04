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
};
