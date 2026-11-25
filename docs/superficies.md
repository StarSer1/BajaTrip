# Superficies de ataque — BajaTrip

Equipo: David Alejandro De Los Santos Cruz, Brandon Israel Nuñez Montoya

Actualizado para la Práctica 6: cada superficie indica la medida que la cubre. El número entre corchetes es el de la [lista de verificación](practica-6/lista-verificacion.md).

## Entradas del sistema y la medida que cubre cada una

| Superficie | Categoría | Medida |
|------------|-----------|--------|
| `POST /api/auth/registro` (nombre, correo, contraseña, captcha) | A07, A04 | Contraseña con bcrypt [1], respuesta igual exista o no el correo [2], Turnstile verificado en el servidor más campo trampa [3], 20 registros por IP cada 15 min, validación [7] |
| `POST /api/auth/entrar` | A07 | Mensaje genérico y hash falso para igualar el tiempo [2], límite de 5 fallos por cuenta y 20 por IP, con 429 [4], token nuevo al entrar [5], `limit_req` en Nginx |
| `POST /api/auth/salir` y la cookie `bt_sesion` | A07 | HttpOnly, Secure y SameSite=Lax; en la base solo va la huella SHA-256; la sesión se borra en el servidor al salir [5] |
| `POST /api/reservas` | A08, A06 | Total recalculado en el servidor; fecha válida, de 1 a 6 viajeros y máximo 20 por cuenta [7]; Origin del mismo sitio (CSRF) |
| `GET /api/reservas/{id}` y `/mis-viajes/reserva/{id}` | A01 | `WHERE id = ? AND usuario_id = ?`; la reserva ajena da el mismo 404 que una inexistente y queda en la bitácora [8, 10] |
| `DELETE /api/reservas/{id}` | A01 | El mismo filtro por dueño [8] |
| `GET /api/admin/usuarios` y `/admin` | A01 | El rol se lee de la base en cada petición: 401 sin sesión, 403 si no es admin; correos enmascarados [8] |
| `PUT /api/cuenta/foto` (foto de perfil) | A05, A06, A08 | Tipo real por los bytes, 2 MB (nodo y Nginx), nombre UUID, fuera de `dist/`, servida solo a su dueño con `nosniff` y `CSP: sandbox` [9] |
| `GET /api/sesion`, `GET /api/auth/yo`, `GET /api/config` | A01 | Solo datos de la propia sesión; la sitekey de Turnstile es pública, el secret no sale del servidor |
| `POST /api/csp-reporte` | A09 | JSON con límite de 10 KB; se guarda recortado en la bitácora [10, 13] |
| `GET /salud` | A02 | Solo dice nodo y si la base contesta, sin versiones ni errores |
| `/api/chat` (WebSocket del chat en vivo, en Cloudflare) | A05 | El Worker limpia y recorta nombre y mensaje, y React los muestra como texto (`{message.text}`), nunca con `innerHTML` [7] |
| Buscador de Inicio y Catálogo (sessionStorage) | A05 | Solo valores de listas cerradas; se muestran como texto [7] |
| Formulario de guías en `/guias` (IndexedDB) | A05 | Vive en el navegador; la salida es texto y la CSP impide ejecutar lo inyectado [7, 13] |
| Favoritos (localStorage) y reservas locales (IndexedDB), editables desde F12 | A08 | El servidor no confía en ellos: recalcula y valida todo lo que llega [7] |
| La dirección: `/catalogo`, `/galeria`, `/mis-viajes`, `/guias`, `#`, `?version=1` | A01 | Las rutas del navegador no dan permisos; los datos se piden a la API, que revisa al dueño [8] |
| Cabeceras `X-Real-IP` y `X-Forwarded-Proto` | A01, A07 | El nodo solo les cree a la IP del balanceador (`PROXIES_CONFIABLES`); los nodos solo escuchan en `127.0.0.1` del equipo [14] |
| Todo el tráfico | A02, A04 | HTTPS con 301 desde http y TLS 1.2/1.3 [11], las cinco cabeceras [12], CSP sin `'unsafe-inline'` [13], `server_tokens off`, `NODE_ENV=production` y `.env` fuera del repositorio [14] |
| Dependencias (`package-lock.json`) | A03 | Archivo lock en el repositorio, `npm audit` en 0, `npm ci --ignore-scripts` en la imagen [14] |

Siguen planeados, sin construir: el panel del prestador (`/api/servicios/{id}`). Cuando exista, usará el mismo filtro por dueño y la misma revisión de rol.

## Las tres más expuestas

| Superficie | Categoría | Qué podría pasar | Medida |
|------------|-----------|------------------|--------|
| `GET/DELETE /api/reservas/{id}` | A01 | Ver o borrar reservas de otro visitante cambiando el id | El servidor solo responde si la reserva es de la cuenta o de la sesión (`WHERE id = ? AND usuario_id = ?`); ajena e inexistente responden igual y quedan en la bitácora |
| `POST /api/auth/entrar` | A07 | Adivinar la contraseña de alguien probando muchas | 5 fallos por cuenta y 20 por IP cada 15 min, contados en MySQL (los comparten los dos nodos); después, 429 aunque la contraseña sea correcta; mismo mensaje exista o no la cuenta |
| `PUT /api/cuenta/foto` | A05 | Subir un programa con nombre de imagen (`foto.jpg.php`) y hacer que el servidor lo ejecute | Se revisa el contenido, no el nombre; se guarda con nombre nuevo fuera del sitio y se entrega con `nosniff` y `sandbox` |
