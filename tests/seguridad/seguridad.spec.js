import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect, request as crearContexto } from '@playwright/test';

// Práctica 6: una prueba por medida, contra el sistema real (balanceador + 2 nodos + MySQL).
// Requisito: docker compose up -d (ver README). Ejecutar: npm run test:seguridad
// Cada prueba sirve también de guion para la demostración en vivo.

const BASE = process.env.BAJATRIP_URL ?? 'https://localhost:8443';
const HTTP = process.env.BAJATRIP_HTTP ?? 'http://localhost:8080';
// Token cualquiera: con las llaves de PRUEBA de Turnstile (.env.example) el servidor lo acepta.
// Con llaves reales este token se rechaza, que es justo lo que debe pasar.
const CAPTCHA_PRUEBA = 'XXXX.DUMMY.TOKEN.XXXX';
const CONTRASENA = 'una frase larga de prueba';
const correoNuevo = (etiqueta) => `${etiqueta}-${randomUUID().slice(0, 8)}@prueba.bajatrip.mx`;

// Un «navegador» por persona: cada contexto guarda sus propias cookies.
const visitante = () => crearContexto.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, extraHTTPHeaders: { Origin: BASE } });

async function registrar(ctx, datos) {
  return ctx.post('/api/auth/registro', { data: { nombre: 'Persona de Prueba', contrasena: CONTRASENA, captcha: CAPTCHA_PRUEBA, ...datos } });
}

async function cuentaConSesion(etiqueta) {
  const ctx = await visitante();
  const correo = correoNuevo(etiqueta);
  expect((await registrar(ctx, { correo })).status()).toBe(201);
  expect((await ctx.post('/api/auth/entrar', { data: { correo, contrasena: CONTRASENA } })).status()).toBe(200);
  return { ctx, correo };
}

function docker(...args) {
  return execFileSync('docker', ['compose', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function mysql(sql) {
  const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return docker('exec', '-T', '-e', `MYSQL_PWD=${env.DB_PASSWORD}`, 'db', 'mysql', '-ubajatrip', '-N', 'bajatrip', '-e', sql).trim();
}

// El límite de intentos funciona de verdad: dos corridas seguidas registran más de 20 cuentas
// desde la misma IP en 15 minutos y la tercera recibiría 429. Antes de empezar se reinician los
// contadores para que cada corrida parta de cero (no cambia ninguna otra tabla).
test.beforeAll(() => {
  mysql('DELETE FROM intentos');
});

test.describe('Autenticación', () => {
  test('1. La contraseña se guarda derivada con bcrypt, nunca en claro', async () => {
    const { correo } = await cuentaConSesion('hash');
    const guardado = mysql(`SELECT contrasena_hash FROM usuarios WHERE correo = '${correo}'`);
    expect(guardado).toMatch(/^\$2[aby]\$12\$.{53}$/); // bcrypt, costo 12, sal incluida
    expect(guardado).not.toContain(CONTRASENA);
  });

  test('2. El error no revela si el correo existe', async () => {
    const { correo } = await cuentaConSesion('generico');
    const ctx = await visitante();
    const malaContrasena = await ctx.post('/api/auth/entrar', { data: { correo, contrasena: 'no-es-esta' } });
    const sinCuenta = await ctx.post('/api/auth/entrar', { data: { correo: correoNuevo('nadie'), contrasena: 'no-es-esta' } });
    expect(malaContrasena.status()).toBe(401);
    expect(sinCuenta.status()).toBe(401);
    expect(await malaContrasena.json()).toEqual(await sinCuenta.json());
    // El registro de un correo que ya existe responde igual que uno nuevo.
    const repetido = await registrar(ctx, { correo });
    const nuevo = await registrar(ctx, { correo: correoNuevo('otro') });
    expect(repetido.status()).toBe(nuevo.status());
    expect(await repetido.json()).toEqual(await nuevo.json());
  });

  test('3. El registro exige captcha y tiene campo trampa', async () => {
    const ctx = await visitante();
    const sinCaptcha = await registrar(ctx, { correo: correoNuevo('sincaptcha'), captcha: '' });
    expect(sinCaptcha.status()).toBe(400);
    // Un programa que llena el campo oculto recibe la respuesta normal, pero no se crea la cuenta.
    const correo = correoNuevo('robot');
    expect((await registrar(ctx, { correo, sitio: 'https://spam.example' })).status()).toBe(201);
    expect((await ctx.post('/api/auth/entrar', { data: { correo, contrasena: CONTRASENA } })).status()).toBe(401);
  });

  test('4. Límite de intentos: al sexto fallo, 429 aunque la contraseña sea correcta', async () => {
    const { correo } = await cuentaConSesion('limite');
    const atacante = await visitante();
    for (let i = 0; i < 5; i += 1) {
      expect((await atacante.post('/api/auth/entrar', { data: { correo, contrasena: `intento-${i}` } })).status()).toBe(401);
    }
    const bloqueado = await atacante.post('/api/auth/entrar', { data: { correo, contrasena: CONTRASENA } });
    expect(bloqueado.status()).toBe(429);
    expect(Number(bloqueado.headers()['retry-after'])).toBeGreaterThan(0);
  });

  test('5. Cookie con HttpOnly, Secure y SameSite; se rota al entrar y se invalida al salir', async () => {
    const ctx = await visitante();
    await ctx.get('/api/sesion');
    const anonima = (await ctx.storageState()).cookies.find((c) => c.name === 'bt_sesion').value;
    const correo = correoNuevo('cookie');
    await registrar(ctx, { correo });
    const entrada = await ctx.post('/api/auth/entrar', { data: { correo, contrasena: CONTRASENA } });
    const cabecera = entrada.headers()['set-cookie'];
    expect(cabecera).toContain('HttpOnly');
    expect(cabecera).toContain('Secure');
    expect(cabecera).toContain('SameSite=Lax');
    const conCuenta = (await ctx.storageState()).cookies.find((c) => c.name === 'bt_sesion').value;
    expect(conCuenta).not.toBe(anonima); // otro token después de iniciar sesión

    expect((await ctx.post('/api/auth/salir')).status()).toBe(204);
    // Alguien que copió la cookie antes de que se cerrara la sesión ya no entra con ella.
    const copia = await crearContexto.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, extraHTTPHeaders: { Cookie: `bt_sesion=${conCuenta}` } });
    expect((await (await copia.get('/api/auth/yo')).json()).usuario).toBeNull();
  });
});

test.describe('Aplicación', () => {
  test('6. Consultas parametrizadas: una inyección SQL no inicia sesión', async () => {
    const ctx = await visitante();
    for (const correo of ["' OR '1'='1' -- @x.mx", 'admin@x.mx\' OR 1=1 #']) {
      const respuesta = await ctx.post('/api/auth/entrar', { data: { correo, contrasena: "' OR '1'='1" } });
      expect([400, 401]).toContain(respuesta.status());
    }
  });

  test('7. Validación en el servidor: datos fuera de regla y total ignorado', async () => {
    const ctx = await visitante();
    const xss = await registrar(ctx, { correo: correoNuevo('xss'), nombre: '<img src=x onerror=alert(1)>' });
    expect(xss.status()).toBe(400);
    const muchos = await ctx.post('/api/reservas', { data: { id: randomUUID(), experienciaId: 'isla', fecha: '2099-12-25', viajeros: 99 } });
    expect(muchos.status()).toBe(400);
    // El total que manda el navegador no se usa: el servidor lo recalcula con su catálogo.
    const barata = await ctx.post('/api/reservas', { data: { id: randomUUID(), experienciaId: 'isla', fecha: '2099-12-25', viajeros: 2, total: 1 } });
    expect(barata.status()).toBe(201);
    expect((await barata.json()).total).toBeGreaterThan(1);
  });

  test('8. Control de acceso: no se ve ni se borra la reserva de otro cambiando el id', async () => {
    const ana = await cuentaConSesion('ana');
    const beto = await cuentaConSesion('beto');
    const id = randomUUID();
    expect((await ana.ctx.post('/api/reservas', { data: { id, experienciaId: 'isla', fecha: '2099-12-25', viajeros: 2 } })).status()).toBe(201);
    expect((await ana.ctx.get(`/api/reservas/${id}`)).status()).toBe(200);
    expect((await beto.ctx.get(`/api/reservas/${id}`)).status()).toBe(404);
    expect((await beto.ctx.delete(`/api/reservas/${id}`)).status()).toBe(404);
    expect((await ana.ctx.get(`/api/reservas/${id}`)).status()).toBe(200); // sigue ahí
    // El panel de administración: sin sesión 401, con cuenta de turista 403.
    expect((await (await visitante()).get('/api/admin/usuarios')).status()).toBe(401);
    expect((await beto.ctx.get('/api/admin/usuarios')).status()).toBe(403);
  });

  test('9. Subida de archivos: tipo real, tamaño y nombre nuevo', async () => {
    const { ctx } = await cuentaConSesion('foto');
    // Un programa PHP con nombre y tipo de imagen: se rechaza por su contenido.
    const php = await ctx.put('/api/cuenta/foto', { data: Buffer.from('<?php system($_GET["c"]); ?>'), headers: { 'Content-Type': 'image/jpeg', 'X-Nombre': 'foto.jpg.php' } });
    expect(php.status()).toBe(415);
    const grande = await ctx.put('/api/cuenta/foto', { data: Buffer.alloc(3 * 1024 * 1024, 0xff), headers: { 'Content-Type': 'image/jpeg' } });
    expect(grande.status()).toBe(413);
    // PNG de 1×1 válido.
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    expect((await ctx.put('/api/cuenta/foto', { data: png, headers: { 'Content-Type': 'image/png' } })).status()).toBe(204);
    const foto = await ctx.get('/api/cuenta/foto');
    expect(foto.status()).toBe(200);
    expect(foto.headers()['content-type']).toBe('image/png');
    expect(foto.headers()['content-security-policy']).toContain('sandbox');
    // Sin sesión no hay foto que ver.
    expect((await (await visitante()).get('/api/cuenta/foto')).status()).toBe(401);
    // En el volumen el archivo tiene un nombre al azar, no el que mandó el usuario.
    expect(docker('exec', '-T', 'app1', 'ls', '/app/subidas')).toMatch(/[0-9a-f-]{36}\.png/);
  });

  test('10. Bitácora: registra los fallos sin contraseñas ni correos completos', async () => {
    const { correo } = await cuentaConSesion('bitacora');
    const ctx = await visitante();
    await ctx.post('/api/auth/entrar', { data: { correo, contrasena: 'contrasena-secreta-equivocada' } });
    await new Promise((r) => { setTimeout(r, 500); });
    const logs = docker('logs', '--since', '2m', 'app1', 'app2');
    expect(logs).toContain('entrar-fallido');
    expect(logs).not.toContain('contrasena-secreta-equivocada');
    expect(logs).not.toContain(CONTRASENA);
    expect(logs).not.toContain(correo);
  });
});

test.describe('Servidor', () => {
  test('11. HTTP redirige a HTTPS con 301', async () => {
    const ctx = await crearContexto.newContext();
    const respuesta = await ctx.get(`${HTTP}/mis-viajes`, { maxRedirects: 0 });
    expect(respuesta.status()).toBe(301);
    expect(respuesta.headers().location).toMatch(/^https:\/\/.+\/mis-viajes$/);
  });

  test('12. Las cinco cabeceras de seguridad', async () => {
    const ctx = await visitante();
    for (const ruta of ['/', '/api/sesion']) {
      const h = (await ctx.get(ruta)).headers();
      expect(h['content-security-policy']).toContain("script-src 'self'");
      expect(h['strict-transport-security']).toMatch(/max-age=\d+/);
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(h['permissions-policy']).toContain('camera=()');
    }
  });

  test('13. La CSP bloquea un script escrito en la página', async ({ browser }) => {
    const contexto = await browser.newContext({ ignoreHTTPSErrors: true });
    const pagina = await contexto.newPage();
    const avisos = [];
    pagina.on('console', (m) => avisos.push(m.text()));
    await pagina.goto(`${BASE}/demo-csp.html`);
    await expect(pagina.locator('#resultado')).toHaveClass('bloqueado');
    expect(avisos.join('\n')).toContain('Content Security Policy');
  });

  test('14. Depuración apagada: errores genéricos, sin versión del servidor ni credenciales', async () => {
    const ctx = await visitante();
    const respuesta = await ctx.post('/api/reservas', { data: '{"esto no es JSON', headers: { 'Content-Type': 'application/json' } });
    expect(respuesta.status()).toBe(400);
    const texto = await respuesta.text();
    expect(texto).not.toMatch(/at .+\.js:\d+|stack|SyntaxError/);
    expect((await ctx.get('/no-existe.js')).headers().server).toBe('nginx'); // sin número de versión
    expect(docker('exec', '-T', 'app1', 'printenv', 'NODE_ENV').trim()).toBe('production');
    // .env nunca entró al repositorio (ni en el historial).
    expect(execFileSync('git', ['log', '--all', '--format=%h', '--', '.env'], { encoding: 'utf8' }).trim()).toBe('');
  });

  test('Extra. Una petición de otro sitio (CSRF) se rechaza', async () => {
    const ctx = await crearContexto.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, extraHTTPHeaders: { Origin: 'https://sitio-malo.example' } });
    expect((await ctx.post('/api/reservas', { data: { id: randomUUID(), experienciaId: 'isla', fecha: '2099-12-25', viajeros: 1 } })).status()).toBe(403);
  });
});
