# 5. Bitácora de aportaciones

| Integrante | Usuario en Git | Commits | Líneas agregadas / eliminadas* |
| --- | --- | --- | --- |
| Brandon Israel Nuñez Montoya | `wrok` | 22 (incluye 2 de fusión) | 4 353 / 1 259 |
| David Alejandro De Los Santos Cruz | `StarSer` | 10 | 1 817 / 560 |

\* Sin `package-lock.json`, archivos binarios (PDF, imágenes) ni commits de fusión. Se obtiene con:

```powershell
git shortlog -sn --all
git log --author=wrok --no-merges --numstat --format=
```

El historial completo es la fuente: `git log --format="%h %ad %an %s" --date=short`. Esta bitácora lo resume por entrega y lo cita commit por commit, para que se pueda comparar.

## Por entrega

### Unidad 1 · Diseño avanzado (septiembre)

| Fecha | Commit | Autor | Qué se hizo |
| --- | --- | --- | --- |
| 03/09 | `a131a77` | David | Creación del repositorio |
| 03/09 | `5592092` | David | *Fundamentación del Proyecto* (PDF) |
| 09/09 | `6ce75e5` | David | Estructura de carpetas del proyecto: `frontend/`, `backend/modules/…`, `database/`, `docs/`, `tests/` (63 archivos) |
| 09/09 | `a4de028` | David | Tarjeta de experiencia y HTML semántico: `index.html`, `catalogo.html`, `global.css`, `docs/estructura.md` |
| 09/09 | `8428d32`, `fec80d0` | Brandon | Pruebas de estilos de la tarjeta (`tarjeta-experiencia.css`) y LEEME |
| 09/09 | `6e712fc` | Brandon | Tarjeta con animaciones terminada |
| 10/09 | `741b64f`, `d434809` | Brandon | Ajustes del LEEME; interacción de contenidos |
| 11/09 | `f578f3a` | Brandon | Diseño de la pantalla inicial (`landing.css`, `landing.js`) |
| 16–17/09 | `9741387`, `5c7c9d4`, `a8b6140` | Brandon | Diseño y semántica de la página de inicio (más de 1 000 líneas de CSS y HTML) |
| 23/09 | `d951d53`, `2cafc8f` | Brandon | Mejoras y avance de la segunda entrega (catálogo) |
| 23/09 | `329e9e7` | David | Cambio de propiedades CSS/JS y corrección del LEEME |

### Unidad 2 · HTML5 avanzado y React (septiembre–octubre)

| Fecha | Commit | Autor | Qué se hizo |
| --- | --- | --- | --- |
| 23/09 | `91a2853` | Brandon | **Migración a React** con Vite y React Router: componentes, páginas, hooks, datos (67 archivos) |
| 23/09 | `7ad873e` | Brandon | Informe |
| 06/10 | `05ffea4` | David | **Auditorías Lighthouse** (`docs/auditoria/`), **Tarea 3** (PDF del catálogo de componentes HTML5), pruebas de Playwright del catálogo y funcionamiento local (rama `Pruebas`) |
| 07/10 | `79ae753` | Brandon | Fusión de la rama `Pruebas` en `main` |
| 13/10 | `2c3079c` | Brandon | **Práctica 4**: catálogo de guías en IndexedDB con migración v1→v2, gráfico, service worker y pruebas |
| 13/10 | `8206c77` | David | Enlace al video explicativo de la Práctica 4 |
| 20/10 | `aa71ebc`, `0907823`, `1ed6607` | Brandon | Configuración de Wrangler para Cloudflare (se revirtió y se volvió a probar) |
| 20/10 | `b473753`, `e3d0da4` | David | Adaptación de `main`: limpieza del HTML/CSS anterior a React |
| 21/10 | `38e1f5f` | Brandon | **Chat en vivo**: Worker con Durable Object (`backend/worker/`), `ChatWidget` y `useChat` |

### Unidad 3 · Balanceo y seguridad (octubre–noviembre)

| Fecha | Commit | Autor | Qué se hizo |
| --- | --- | --- | --- |
| 27/10 | `2e658ed` | Brandon | Elección de algoritmos de balanceo (`docs/balanceo.md`) |
| 27/10 | `dc919eb` | Brandon | Fusión con `origin/main` |
| 03/11 | `e5418f3` | David | **Backend de la Práctica 5**: `backend/server.js`, módulos de sesión y reservas, MySQL, `docker-compose.yml`, `Dockerfile`, Nginx, esquema de la base, `docs/superficies.md` y sincronización de reservas en el frontend (28 archivos) |
| 05/11 | `1153339` | Brandon | **Informe de la Práctica 5**: mediciones con Apache Bench, 19 capturas y PDF |

### Entrega final (25 de noviembre)

| Fecha | Commit | Autor | Qué se hizo |
| --- | --- | --- | --- |
| 24/11 | `8abde55` | StarSer | **Práctica 6**: cuentas con bcrypt, límite de intentos, captcha, control de acceso, subida segura de la foto, HTTPS con Nginx, cabeceras y CSP, pruebas `tests/seguridad/`, lista de verificación y evidencia (`docs/practica-6/`) |
| 24/11 | `8abde55` | StarSer | **Tarea 4** (`docs/tarea-4/`) y **Tarea 5** (`docs/tarea-5/`) |
| 24/11 | `8abde55` | StarSer | **Documentación técnica** (`docs/documentacion/`) |
| 25/11 | *(este commit)* | Brandon | **Correcciones para la presentación**: generación del certificado local para el balanceador, actualización de las tablas `sesiones` y `reservas` en una base que venía de la Práctica 5 (el inicio de sesión fallaba con 503), arreglo del aviso «Las contraseñas no coinciden» que se quedaba fijo en `/registro` (`RegisterPage.jsx`) y preparación de la demo |

> Para el equipo: después de subir la entrega final, cambien *(por registrar)* por el hash corto de cada commit (`git log --oneline -3`) y pongan el autor real, para que esta tabla coincida con el historial. En la elaboración de esta entrega se usó un asistente de IA, como se declara en el [LEEME](../../LEEME.md#declaración-de-uso-de-ia-práctica-6).

## Resumen por integrante

**Brandon Israel Nuñez Montoya (`wrok`)**: diseño visual y semántica de la página de inicio y del catálogo; tarjeta con animaciones; migración a React; Práctica 4 (guías en IndexedDB y service worker); despliegue en Cloudflare y chat en vivo; análisis de balanceo (`docs/balanceo.md`); informe y mediciones de la Práctica 5; correcciones previas a la presentación final (certificado local, esquema de la base y formulario de registro).

**David Alejandro De Los Santos Cruz (`StarSer`)**: creación del repositorio y estructura de carpetas; fundamentación del proyecto; primera tarjeta y HTML semántico; auditorías Lighthouse, Tarea 3 y pruebas del catálogo; limpieza de `main` tras la migración; backend de la Práctica 5 (servidor Node, sesión en MySQL, reservas, Docker Compose y Nginx); inventario de superficies de ataque.
