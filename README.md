# BajaTrip

Frontend en React para explorar experiencias turísticas de Baja California Sur. Tiene cinco páginas que comparten el mismo layout y se abren desde el menú: **Inicio** (buscador, destinos y experiencias), **Catálogo**, **Galería** (Práctica 1 integrada, con animaciones y variante de movimiento reducido), **Mis viajes** (favoritos y reservas de ejemplo guardados en el navegador) y **Guías** (Práctica 4: catálogo de guías locales en IndexedDB que funciona sin conexión).

## Ejecutar

Para levantar el sistema completo (balanceador con HTTPS, dos nodos y MySQL) desde una computadora limpia, sigue el [manual de instalación](docs/documentacion/3-manual-instalacion.md).

Necesitas Node.js 22.12 o posterior y npm. Desde la raíz del repositorio:

```sh
npm ci
npm run dev
```

Abre la dirección que indique Vite, normalmente `http://localhost:5173`. Ya no se abre el HTML con doble clic ni con Live Server: JSX necesita el servidor de desarrollo. Para probar en un celular conectado a la misma red, utiliza la dirección **Network** que muestra Vite; el equipo debe permitir ese puerto en su firewall.

```sh
npm run build      # Compila el sitio en dist/
npm run preview    # Sirve la compilación localmente
```

El service worker solo se registra en la compilación: para probar el modo sin conexión usa `npm run build` y `npm run preview`, abre `http://localhost:4173/guias` y desactiva la red desde las herramientas del navegador. Los detalles están en el [LEEME de la Práctica 4](LEEME.md).

En producción publica `dist/` y configura el hosting para devolver `index.html` cuando la URL no corresponda a un archivo. React Router utiliza rutas como `/catalogo`. Los enlaces antiguos `/index.html` y `/pages/catalogo.html` se redirigen dentro de la aplicación.

## Balanceo de carga (Práctica 5)

Cada nodo es `backend/server.js`: sirve `dist/`, la API (cuentas, reservas, foto de perfil) y `/salud`, que responde 503 si la base de datos no contesta. La sesión se guarda en MySQL, así que sobrevive al cambio de nodo. Con Docker Desktop y Git Bash:

```sh
cp .env.example .env              # y cambia las dos contraseñas
npm run build
bash scripts/certificado-local.sh # certificado HTTPS local (la primera vez)
docker compose up -d --build
```

Si vienes de la Práctica 5, el esquema de la base cambió: ejecuta una vez `docker compose down -v` antes de `up` (borra las reservas de ejemplo guardadas).

| Contenedor | IP en la red `bajatrip-red` | Puerto en tu equipo |
| --- | --- | --- |
| `balanceador` (Nginx 1.27) | 172.28.0.10 | 8443 (HTTPS) y 8080 (redirige a HTTPS) |
| `app1` (`NODO=1`) | 172.28.0.11 | 127.0.0.1:8001 |
| `app2` (`NODO=2`) | 172.28.0.12 | 127.0.0.1:8002 |
| `db` (MySQL 8.4) | 172.28.0.20 | — |

En `https://localhost:8443/mis-viajes`, **Consultar otra vez** muestra qué nodo respondió y la misma sesión en los dos. En F12 › Red, cada respuesta trae `X-Nodo` (del balanceador) y `X-Servidor` (del nodo).

Para medir, Apache Bench corre dentro de la red de Docker, con las mismas `-n` y `-c` en los dos primeros escenarios:

```sh
docker run --rm --network bajatrip-red httpd:2.4-alpine ab -l -n 1000 -c 20 http://172.28.0.11:3000/   # un nodo solo
docker run --rm --network bajatrip-red httpd:2.4-alpine ab -l -n 1000 -c 20 http://172.28.0.10/        # con balanceador
docker run --rm --network bajatrip-red httpd:2.4-alpine ab -l -n 20000 -c 20 http://172.28.0.10/       # a la mitad: docker compose stop app1
```

Para el segundo algoritmo, quita el `#` de `least_conn;` en `nginx/templates/default.conf.template` y ejecuta `docker compose restart balanceador` (la plantilla se vuelve a procesar al arrancar). Después de apagar un nodo, `docker compose start app1` lo reincorpora.

En tres computadoras, cada nodo ejecuta `npm ci`, `npm run build` y `node backend/server.js` con las variables `NODO`, `DB_HOST`, `DB_PASSWORD` y `PROXIES_CONFIABLES` (la IP del balanceador). En PowerShell se definen así: `$env:NODO="1"`. En `nginx/templates/default.conf.template` se cambian las IP por las de los nodos. La base y su usuario `bajatrip` se crean una vez en la computadora con MySQL; las tablas las crea el primer nodo que arranca (`database/schema/bajatrip.sql`).

## Seguridad (Práctica 6)

Las 14 medidas, con dónde está cada una y cómo se demuestra, están en la [lista de verificación](docs/practica-6/lista-verificacion.md). Las superficies con su medida, en [docs/superficies.md](docs/superficies.md).

- **HTTPS.** `https://localhost:8443`; `http://localhost:8080` responde 301 hacia HTTPS. Para que el navegador confíe en el certificado local, importa una vez la CA que creó el script (PowerShell): `certutil -user -addstore Root nginxcertsajatrip-ca.crt`. Para entrar desde otra computadora de la red, genera el certificado con tu IP: `bash scripts/certificado-local.sh 192.168.1.50`.
- **Cuentas.** `/registro` (con captcha Cloudflare Turnstile), `/entrar`, `/cuenta` (foto de perfil y cerrar sesión). Las llaves de Turnstile van en `.env`; las de `.env.example` son las de prueba de Cloudflare y siempre pasan. Para el sitio real, crea un widget en el panel de Cloudflare y pega su sitekey y su secret.
- **Administrador.** No se puede crear desde la página: `docker compose exec app1 node backend/scripts/admin.js correo@ejemplo.com`.
- **Bitácora.** `docker compose logs -f app1 app2`. Una línea JSON por evento, sin contraseñas ni correos completos.
- **Reiniciar el límite de intentos** (por ejemplo, antes de una demostración): `docker compose exec db mysql -ubajatrip -p bajatrip -e "DELETE FROM intentos"`.

### Con dominio propio (Let's Encrypt)

En un servidor con dominio y los puertos 80 y 443 abiertos, en `.env`: `DOMINIO=midominio.mx`, `HTTP_PUERTO=80`, `HTTPS_PUERTO=443`. Después (cambia el dominio y el correo):

```sh
bash scripts/certificado-local.sh                    # certificado temporal para que Nginx arranque
docker compose up -d --build
docker compose --profile publico run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot -d midominio.mx --email tu-correo@ejemplo.com --agree-tos --no-eff-email
```

Luego cambia en `.env` `CERTIFICADO=/etc/letsencrypt/live/midominio.mx/fullchain.pem`, `LLAVE=/etc/letsencrypt/live/midominio.mx/privkey.pem` y `HSTS_MAX_AGE=31536000`, y ejecuta `docker compose --profile publico up -d`. El contenedor `certbot` revisa la renovación cada 12 horas y Nginx vuelve a leer el certificado cada 6.

La versión en Cloudflare (`npm run deploy`) ya se sirve por HTTPS y lleva las mismas cabeceras (`frontend/public/_headers`). Ahí no hay backend: las cuentas solo funcionan en el servidor con Docker.

## Dónde trabajar

| Pieza | Archivo |
| --- | --- |
| Paleta, espaciado, tipografía y responsividad | `frontend/assets/css/landing.css` (variables al principio) |
| Encabezado, navegación y pie compartidos | `frontend/src/components/Layout.jsx` |
| Tarjeta reutilizable | `frontend/src/components/ExperienceCard.jsx` |
| Lista generada con `map` y claves estables | `frontend/src/components/ExperienceGrid.jsx` |
| Arreglo de las seis experiencias | `frontend/src/data/experiences.js` |
| Experiencia ilustrada del catálogo original | `frontend/src/data/catalogExamples.js` |
| Filtros y selección de viajeros (se conservan en sessionStorage) | `frontend/src/hooks/useExperiences.js` y `useSessionState.js` |
| Favoritos (localStorage) | `frontend/src/hooks/useFavorites.js` y `components/FavoriteButton.jsx` |
| Reservas de ejemplo (IndexedDB y copia en el servidor) | `frontend/src/storage/reservations.js` y `servidor.js` |
| Backend: API, sesión, `/salud` y archivos estáticos | `backend/server.js` y `backend/modules/` |
| Cuentas: bcrypt, límite de intentos, captcha, cookies | `backend/modules/auth/` |
| Foto de perfil (subida segura) | `backend/modules/usuarios/foto.js` |
| Validación en el servidor | `backend/shared/validar.js` |
| Páginas de cuenta y captcha | `frontend/src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `AccountPage.jsx`, `components/Turnstile.jsx` |
| Balanceador con HTTPS y cabeceras, contenedores y esquema de la base | `nginx/templates/default.conf.template`, `docker-compose.yml`, `Dockerfile` y `database/schema/` |
| Certificado local | `scripts/certificado-local.sh` |
| Aviso sin conexión (`navigator.onLine`) | `frontend/src/hooks/useOnline.js` |
| Galería y ampliación de fotos | `frontend/src/pages/GalleryPage.jsx` y `components/PhotoDialog.jsx` |
| Imágenes adaptativas (`srcset`) | `frontend/src/utils/images.js` |
| Catálogo de guías: IndexedDB, versiones del esquema, formulario, gráfico y baja con confirmación | `frontend/src/guides/` |
| Service worker y su lista de precarga | `frontend/sw.js` y `vite.config.js` |
| Vistas y rutas | `frontend/src/pages/` y `frontend/src/App.jsx` |

Consulta la [auditoría de accesibilidad](docs/auditoria/), la [Tarea 3: catálogo de componentes de HTML5](docs/tarea-3/tarea-3-catalogo-componentes-html5.pdf), las [notas de responsividad y animación](docs/unidad-1/notas-responsividad.md), la [elección de algoritmos de balanceo de carga](docs/balanceo.md), las [superficies de ataque](docs/superficies.md), la [lista de verificación de la Práctica 6](docs/practica-6/lista-verificacion.md), la [documentación técnica](docs/documentacion/README.md) (modelo de datos, despliegue, manuales de instalación y de usuario, bitácora) y el [LEEME](LEEME.md).

## Verificación

```sh
npx playwright install chromium
npm test                # frontend
npm run test:seguridad  # Práctica 6, contra el sistema en Docker (docker compose up -d antes)
```

Las pruebas recorren el catálogo de guías (alta, consulta, búsqueda por índice, modificación, baja con confirmación, migración de la versión 1 a la 2 y uso sin conexión con el service worker sobre la compilación), búsqueda combinada, categorías, destinos sin resultados, reinicio, viajeros, cálculo de precio, fechas inválidas y válidas, cierre del diálogo, las cinco páginas desde el menú, la galería con y sin movimiento reducido, favoritos en localStorage, búsqueda en sessionStorage, reservas en IndexedDB, rutas antiguas, cambios de variables y anchos de 320 a 1440 px.

Las reservas siguen siendo una demostración: se guardan en el navegador (IndexedDB) y, cuando el sitio corre con el backend, también en la base de datos. No se envían a los prestadores ni se realizan cobros. El panel del prestador sigue pendiente. Las fotografías de Unsplash requieren conexión; las fuentes de Google quedan guardadas por el service worker después de la primera visita.

La configuración usa [React con una herramienta de compilación](https://react.dev/learn/build-a-react-app-from-scratch) y [Vite](https://vite.dev/guide/). Las versiones resueltas se guardan en `package-lock.json`.
