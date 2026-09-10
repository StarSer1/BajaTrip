# Estructura inicial de BajaTrip

Esta organización se basa en los puntos 2 a 5 de `Fundamentacion del Proyecto.pdf`. Los archivos de las pantallas, estilos y scripts están vacíos: todavía no hay implementación, dependencias ni configuración de ejecución. Los archivos `.gitkeep` permiten guardar carpetas vacías en Git.

Se proponen HTML, CSS y JavaScript para organizar la parte del navegador. El lenguaje y el framework del servidor, la base de datos y los proveedores de captcha y notificaciones quedan por definir; el documento no los exige.

## Carpetas principales

```text
BajaTrip/
├── Fundamentacion del Proyecto.pdf
├── README.md
├── docs/
│   ├── estructura.md
│   └── diseno/
├── frontend/
│   ├── index.html
│   ├── service-worker.js
│   ├── pages/
│   │   ├── catalogo.html
│   │   ├── detalle-servicio.html
│   │   ├── sin-conexion.html
│   │   ├── auth/
│   │   ├── turista/
│   │   ├── prestador/
│   │   └── admin/
│   └── assets/
│       ├── css/
│       ├── images/
│       ├── icons/
│       └── js/
│           ├── app.js
│           ├── modules/
│           └── offline/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── shared/
│   └── modules/
├── database/
│   ├── schema/
│   ├── migrations/
│   └── seeds/
└── tests/
    ├── frontend/
    ├── backend/
    └── integracion/
```

## Pantallas y archivos del navegador

Todas las rutas de esta sección parten de `frontend/`.

| Ubicación | Uso previsto |
| --- | --- |
| `index.html` | Inicio de la plataforma. |
| `pages/catalogo.html` | Búsqueda y filtros por municipio y categoría. |
| `pages/detalle-servicio.html` | Descripción, precio, galería responsiva, disponibilidad y reseñas. |
| `pages/auth/registro.html`, `login.html` | Registro de turistas y prestadores con captcha e inicio de sesión. |
| `pages/turista/nueva-reserva.html` | Selección de fecha y número de personas. |
| `pages/turista/mis-reservas.html`, `detalle-reserva.html` | Historial, confirmación y estado actualizado de la reserva. |
| `pages/turista/resena.html` | Formulario para dejar una reseña. |
| `pages/prestador/panel.html`, `mis-servicios.html` | Resumen del prestador y sus publicaciones. |
| `pages/prestador/formulario-servicio.html` | Publicación y edición de servicios con fotos, descripción y precio. |
| `pages/prestador/disponibilidad.html`, `reservas.html` | Disponibilidad por fecha y gestión y confirmación de reservas recibidas. |
| `pages/admin/panel.html`, `prestadores.html` | Resumen administrativo y aprobación de prestadores nuevos. |
| `pages/admin/moderacion.html`, `estadisticas.html` | Moderación y gráficos por municipio, mes y temporada. |
| `pages/sin-conexion.html` | Pantalla para recursos que todavía no estén guardados en el dispositivo. |
| `assets/css/global.css`, `responsive.css` | Estilos comunes y adaptación a tamaños de pantalla. |
| `assets/images/`, `assets/icons/` | Imágenes e iconos de la interfaz. Las fotos subidas por prestadores se gestionarán desde el servidor. |
| `assets/js/app.js` | Inicialización común del navegador. |
| `assets/js/modules/` | Archivos separados para catálogo, galería, autenticación, captcha, reservas, servicios, disponibilidad, reseñas, administración, gráficos y notificaciones. |
| `assets/js/offline/almacenamiento.js` | Catálogo consultado, reservas guardadas y operaciones pendientes en almacenamiento local del navegador. |
| `assets/js/offline/sincronizacion.js` | Envío de reservas pendientes cuando regrese la conexión y manejo de su resultado. |
| `service-worker.js` | Disponibilidad sin conexión de los recursos de la web. |

## Servidor

`backend/config/` alojará la configuración; `middleware/`, la autenticación, los permisos por rol y validaciones comunes; `shared/`, las utilidades compartidas.

Cada carpeta de `backend/modules/` representa una responsabilidad. Cuando se elija la tecnología, dentro de cada módulo se agregarán los archivos de rutas, validación, lógica y acceso a datos necesarios.

| Módulo | Responsabilidad prevista |
| --- | --- |
| `auth` | Registro, inicio de sesión y verificación del captcha en el servidor. |
| `usuarios` | Perfiles y roles de turista, prestador y administrador; acceso público para visitantes. |
| `municipios`, `categorias` | Datos para organizar y filtrar el catálogo de los cinco municipios de BCS. |
| `servicios` | Publicar, consultar y editar servicios turísticos. |
| `archivos` | Validación, carga y referencia de fotografías. |
| `disponibilidad` | Fechas y cupos disponibles para cada servicio. |
| `reservas` | Crear reservas, consultar historial, confirmar y actualizar estados, verificando disponibilidad para evitar sobreventa. |
| `resenas` | Registrar y consultar opiniones de turistas. |
| `notificaciones` | Confirmación al turista, avisos inmediatos al prestador y cambios de estado en tiempo real. El canal de confirmación queda por definir. |
| `administracion` | Aprobar prestadores y moderar contenido. |
| `estadisticas` | Datos agregados de reservas por municipio, mes y temporada. |
| `sincronizacion` | Recibir reservas pendientes, evitar duplicados y resolver conflictos de disponibilidad al recuperar internet. |

Una reserva creada sin conexión se considerará pendiente de sincronización hasta que el servidor valide disponibilidad. Guardarla en el navegador no garantiza su confirmación.

## Datos, diseño y verificación futura

- `database/schema/`: futuro modelo de usuarios, municipios, categorías, servicios, fotos, disponibilidad, reservas, reseñas y notificaciones.
- `database/migrations/`: cambios versionados de la estructura de datos.
- `database/seeds/`: datos iniciales, incluidos los cinco municipios y categorías de servicios.
- `docs/diseno/`: diagramas, modelo de datos y bocetos de pantallas.
- `tests/frontend/`, `tests/backend/` y `tests/integracion/`: espacio para futuras pruebas de interfaz, servidor y flujos completos, especialmente reservas, sincronización y permisos.

## Correspondencia con el documento

| Punto del PDF | Ubicación principal |
| --- | --- |
| 2. Usuarios del sistema | Pantallas públicas y carpetas `auth`, `turista`, `prestador`, `admin`; módulos `usuarios` y `administracion`. |
| 3. Requerimientos funcionales | Pantallas y módulos de catálogo, autenticación, reservas, disponibilidad, fotos, notificaciones, sincronización y estadísticas. |
| 4. Galería de imágenes | Detalle del servicio, módulo `galeria.js` y estilos responsivos. |
| 4. Funcionar sin conexión y datos en el navegador | `service-worker.js` y `assets/js/offline/`. |
| 4. Gráficos | Pantalla administrativa de estadísticas, `graficos.js` y módulo de estadísticas del servidor. |
| 4. Tiempo real | `notificaciones.js` y módulo de notificaciones del servidor. |
| 4. Registro, login y captcha | Pantallas de autenticación, `auth.js`, `captcha.js` y módulo `auth` del servidor. |
| 5. Alcance | Catálogo de cinco municipios, cuentas, reservas, modo sin conexión y panel administrativo. |

Según el alcance del PDF, no se contemplan pagos en línea, aplicación móvil nativa, facturación electrónica ni traducciones.
