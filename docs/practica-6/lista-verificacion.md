# Práctica 6 · Lista de verificación de las 14 medidas

Equipo: Brandon Israel Nuñez Montoya y David Alejandro De Los Santos Cruz.

Todas las medidas están aplicadas en el proyecto, no en un ejercicio aparte, y todas se comprueban en el sistema que corre en Docker: el balanceador con HTTPS, los dos nodos y MySQL. Para cada una anotamos **dónde está**, **cómo se demuestra en vivo** y **la evidencia**. La evidencia está en [`evidencia/`](evidencia/) y en las pruebas automáticas de [`tests/seguridad/seguridad.spec.js`](../../tests/seguridad/seguridad.spec.js). En la columna «Superficie», la clave es la categoría del OWASP Top 10 2025.

## Antes de la demostración

```powershell
npm run build
bash scripts/certificado-local.sh        # solo la primera vez (o si cambia la IP)
docker compose up -d --build
npm run test:seguridad                  # 15 pruebas, una por medida (más CSRF)
```

Sitio: **https://localhost:8443**. `http://localhost:8080` redirige a HTTPS. Para que el navegador muestre el candado sin advertencia, se confía una vez en nuestra CA local: `certutil -user -addstore Root nginx\certs\bajatrip-ca.crt`.

Para ver la bitácora en vivo, en otra terminal: `docker compose logs -f app1 app2`.

---

## Autenticación

### 1. Contraseñas con bcrypt
| | |
|---|---|
| Superficie | `POST /api/auth/registro` · A04 Fallas criptográficas |
| Dónde | [`backend/modules/auth/cuentas.js`](../../backend/modules/auth/cuentas.js): `bcrypt.hash(contrasena, COSTO)` con `COSTO = 12` (línea 11). La columna es `usuarios.contrasena_hash CHAR(60)` en [`database/schema/bajatrip.sql`](../../database/schema/bajatrip.sql). |
| Demostración | Crear una cuenta en `/registro` y consultar la base: `docker compose exec db mysql -ubajatrip -p bajatrip -e "SELECT correo, contrasena_hash FROM usuarios"`. Se ve `$2b$12$…`: algoritmo, costo, sal y hash. La contraseña no aparece. |
| Evidencia | Prueba 1 · `evidencia/base-de-datos.txt` |

### 2. El mensaje de error no revela si el usuario existe
| | |
|---|---|
| Superficie | `POST /api/auth/entrar` y `/api/auth/registro` · A07 Fallas de autenticación |
| Dónde | `ERROR_ENTRAR` en `cuentas.js`: un correo que no existe y una contraseña equivocada reciben el mismo 401 y el mismo texto. Si el correo no existe, se compara contra `HASH_FALSO` para que la respuesta tarde lo mismo. El registro de un correo ya registrado responde igual que uno nuevo (`LISTO_REGISTRO`). |
| Demostración | En `/entrar`, probar con un correo inexistente y luego con uno real y contraseña mal: los dos dicen «Correo o contraseña incorrectos.». |
| Evidencia | Prueba 2 · `evidencia/entrar-error.png` |

### 3. Captcha en el registro
| | |
|---|---|
| Superficie | `/registro` · A07 (creación masiva de cuentas) |
| Dónde | El widget Cloudflare Turnstile está en [`frontend/src/components/Turnstile.jsx`](../../frontend/src/components/Turnstile.jsx). **El servidor lo verifica** en [`backend/modules/auth/captcha.js`](../../backend/modules/auth/captcha.js) (siteverify, con la IP real) y falla cerrado si Cloudflare no contesta. También hay un **campo trampa** `sitio`, oculto para las personas. Las llaves van en `.env`; `.env.example` trae las de prueba de Cloudflare. |
| Demostración | Registrarse sin resolver la verificación: la página no deja. Por API sin token: `400 No pudimos comprobar que eres una persona`. |
| Evidencia | Prueba 3 · `evidencia/registro.png` |

### 4. Límite de intentos
| | |
|---|---|
| Superficie | `POST /api/auth/entrar` · A07 (adivinar contraseñas) |
| Dónde | [`backend/modules/auth/limite.js`](../../backend/modules/auth/limite.js), tabla `intentos`. Son 5 fallos por cuenta y 20 por IP cada 15 minutos. Al pasarse se responde **429** con `Retry-After`, **aunque la contraseña sea correcta**. El contador vive en MySQL: repartir los intentos entre los dos nodos no lo reinicia. Como segunda capa, Nginx aplica `limit_req` en `/api/auth/` ([plantilla](../../nginx/templates/default.conf.template)). |
| Demostración | Equivocarse 5 veces en `/entrar`. El sexto intento dice «Demasiados intentos. Espera 15 minutos…» y en la bitácora aparece `entrar-bloqueado`. |
| Evidencia | Prueba 4 · `evidencia/bitacora.txt` |

### 5. Cookies con HttpOnly, Secure y SameSite
| | |
|---|---|
| Superficie | Cookie `bt_sesion` · A07 |
| Dónde | `cookie()` en [`backend/modules/auth/sesion.js`](../../backend/modules/auth/sesion.js). `Secure` se pone porque el balanceador avisa con `X-Forwarded-Proto: https`, y el nodo solo le cree a la IP del balanceador. Al **entrar** se emite un token nuevo (contra la fijación de sesión). Al **salir** la sesión se borra en el servidor (`DELETE FROM sesiones`), no solo en el navegador. En la base solo queda la huella SHA-256 del token. |
| Demostración | F12 › Aplicación › Cookies › `bt_sesion`, con HttpOnly ✓, Secure ✓ y SameSite Lax. Escribir `document.cookie` en la consola no la muestra. |
| Evidencia | Prueba 5 · `evidencia/cabeceras.txt` (Set-Cookie) |

## Aplicación

### 6. Consultas parametrizadas
| | |
|---|---|
| Superficie | Todas las rutas que tocan la base · A05 Inyección |
| Dónde | Todas usan `pool.execute(sql, [valores])` ([`backend/shared/db.js`](../../backend/shared/db.js)). El dato del usuario nunca se pega en el SQL. El filtro del dueño en `reservas.js` es texto fijo del programa, y su valor va también como parámetro. |
| Demostración | En `/entrar`, escribir `' OR '1'='1' -- @x.mx` como correo: «Escribe un correo válido.» o «Correo o contraseña incorrectos.». Nunca entra. |
| Evidencia | Prueba 6 |

### 7. Validación en el servidor y salida codificada
| | |
|---|---|
| Superficie | Registro, reservas, chat · A05 y A08 |
| Dónde | [`backend/shared/validar.js`](../../backend/shared/validar.js) revisa correo, nombre y contraseña de 8 a 72 bytes. `crearReserva` revisa experiencia, fecha y de 1 a 6 viajeros, y **recalcula el total** con el catálogo del servidor. La salida la muestra React como texto (`{usuario.nombre}`); en todo el frontend no hay `innerHTML` ni `dangerouslySetInnerHTML`. |
| Demostración | Registrarse con el nombre `<img src=x onerror=alert(1)>`: 400. Mandar una reserva con `"total": 1` desde F12: el servidor guarda el total real. |
| Evidencia | Prueba 7 |

### 8. Control de acceso (cambiar el número de la dirección no sirve)
| | |
|---|---|
| Superficie | `GET/DELETE /api/reservas/{id}`, `/mis-viajes/reserva/{id}`, `/api/admin/usuarios` · A01 |
| Dónde | `dueno()` en [`backend/modules/reservas/reservas.js`](../../backend/modules/reservas/reservas.js): toda consulta lleva `WHERE id = ? AND usuario_id = ?`. Una reserva ajena y una inexistente reciben el mismo 404, y el intento queda en la bitácora (`reserva-ajena-o-inexistente`). El panel `/api/admin/usuarios` revisa el rol en el servidor: sin sesión responde 401 y con cuenta de turista 403. |
| Demostración | Con la cuenta A, abrir una reserva en Mis viajes › En tu cuenta y copiar la dirección `/mis-viajes/reserva/<id>`. En otra ventana privada, con la cuenta B, pegar esa dirección: «No encontramos esa reserva.». Escribir `/admin` a mano: «No tienes permiso para ver esto.». |
| Evidencia | Prueba 8 · `evidencia/reserva-propia.png`, `evidencia/reserva-ajena.png`, `evidencia/admin-403.png` |

### 9. Subida de archivos segura
| | |
|---|---|
| Superficie | `PUT /api/cuenta/foto` (foto de perfil) · A05, A06 y A08 |
| Dónde | [`backend/modules/usuarios/foto.js`](../../backend/modules/usuarios/foto.js). El tipo real se revisa **por los bytes del contenido** (JPEG, PNG o WebP); la extensión y el Content-Type no cuentan. El máximo es 2 MB, tanto en el nodo como en Nginx. Se guarda con un **nombre nuevo al azar** (UUID) en el volumen `subidas`, **fuera de `dist/`**, con permisos 600. Solo la ve su dueño, y se entrega con `nosniff` y `CSP: sandbox`. |
| Demostración | En `/cuenta`, subir un archivo de texto renombrado a `foto.jpg`: «Solo se aceptan fotos JPG, PNG o WebP.». Una foto real sí se sube. `docker compose exec app1 ls /app/subidas` muestra el nombre UUID. |
| Evidencia | Prueba 9 · `evidencia/subidas.txt` |

### 10. Bitácora sin contraseñas ni datos personales
| | |
|---|---|
| Superficie | Todo el backend · A09 Registro y alertas |
| Dónde | `bitacora()` y `enmascararCorreo()` en [`backend/shared/http.js`](../../backend/shared/http.js): una línea JSON por evento. Se registran: `entrar-fallido`, `entrar-bloqueado`, `registro-trampa`, `captcha-rechazado`, `reserva-ajena-o-inexistente`, `admin-denegado`, `archivo-rechazado`, `origen-rechazado`, `csp-bloqueo` y `error-interno`. El correo va enmascarado (`d***@gmail.com`), la sesión solo con 8 caracteres de su huella, y nunca van contraseñas ni tokens. |
| Demostración | `docker compose logs app1 app2`, después de un intento fallido. |
| Evidencia | Prueba 10 · `evidencia/bitacora.txt` |

## Servidor

### 11. HTTPS con redirección
| | |
|---|---|
| Superficie | Todo el sitio · A04 |
| Dónde | [`nginx/templates/default.conf.template`](../../nginx/templates/default.conf.template): el puerto 80 hace `return 301 https://…`, y el 443 usa `ssl_protocols TLSv1.2 TLSv1.3`. TLS termina en el balanceador; el tramo interno va por la red privada `bajatrip-red`. En local usamos un certificado firmado por nuestra CA ([`scripts/certificado-local.sh`](../../scripts/certificado-local.sh)). Con dominio propio está el perfil `publico` de [`docker-compose.yml`](../../docker-compose.yml): Let's Encrypt con certbot y renovación automática cada 12 h. |
| Demostración | `curl.exe -I http://localhost:8080/catalogo` responde `301` con `Location: https://localhost:8443/catalogo`. El candado del navegador muestra el certificado. |
| Evidencia | Prueba 11 · `evidencia/cabeceras.txt` |

### 12. Las cinco cabeceras de seguridad
| | |
|---|---|
| Superficie | Todas las respuestas · A02 Configuración incorrecta |
| Dónde | En la misma plantilla, con `always`: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` (además `X-Frame-Options`). La versión de Cloudflare tiene las mismas en [`frontend/public/_headers`](../../frontend/public/_headers). |
| Demostración | F12 › Red › cualquier petición › Encabezados de respuesta, o `curl.exe -skI https://localhost:8443/`. |
| Evidencia | Prueba 12 · `evidencia/cabeceras.txt` |

### 13. CSP bloqueando un script
| | |
|---|---|
| Superficie | Cualquier página donde se lograra inyectar HTML · A05 |
| Dónde | `script-src 'self' https://challenges.cloudflare.com`: sin `'unsafe-inline'`. La página [`frontend/public/demo-csp.html`](../../frontend/public/demo-csp.html) trae un `<script>` escrito en el HTML, igual que uno inyectado. `report-uri /api/csp-reporte` manda cada bloqueo a la bitácora (`csp-bloqueo`). |
| Demostración | Abrir `https://localhost:8443/demo-csp.html`: el recuadro verde dice que el script no se ejecutó, y la consola muestra *Refused to execute inline script…*. |
| Evidencia | Prueba 13 · `evidencia/demo-csp.png` |

### 14. Depuración apagada y sin credenciales en el repositorio
| | |
|---|---|
| Superficie | Configuración · A02 y A03 |
| Dónde | La imagen arranca con `NODE_ENV=production` ([`Dockerfile`](../../Dockerfile)). Un error inesperado responde un mensaje genérico; el detalle va solo a la bitácora y nunca la pila (`server.js`). Nginx tiene `server_tokens off`. Las contraseñas y llaves van en `.env`, que está en `.gitignore`; `git log --all -- .env` no devuelve nada. Los certificados y llaves privadas (`nginx/certs/`) también están ignorados. `npm audit`: 0 vulnerabilidades, después de `npm audit fix` y con `package-lock.json` en el repositorio. Los nodos solo escuchan en `127.0.0.1` del equipo: desde la red solo se llega por el balanceador. |
| Demostración | `curl.exe -skI https://localhost:8443/` muestra `Server: nginx` sin versión. Mandar JSON roto a `/api/reservas` responde `Los datos no tienen un formato válido.`, sin pila. |
| Evidencia | Prueba 14 · `evidencia/cabeceras.txt` |

### Extra: CSRF
Las peticiones POST, PUT y DELETE con un `Origin` de otro sitio se rechazan con 403 (`mismoOrigen()` en `server.js`), además de `SameSite=Lax` y de exigir `application/json`. Lo comprueba la prueba «Extra».

## Resultado de las pruebas

`npm run test:seguridad`: **15 de 15 pasan** (salida completa en `evidencia/pruebas.txt`). Las pruebas que ya tenía el frontend (`npm test`, 26) siguen pasando.
