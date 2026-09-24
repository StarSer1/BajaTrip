# Estructura de BajaTrip

El frontend implementado utiliza React, React Router y Vite. La portada y el catálogo son vistas de una aplicación; el backend y la base de datos conservan sus carpetas de planeación. La migración sustituye los HTML y módulos JavaScript vacíos por una estructura preparada para componentes y vistas React.

```text
BajaTrip/
├── package.json / package-lock.json
├── vite.config.js
├── playwright.config.js
├── frontend/
│   ├── index.html                # Entrada mínima; monta src/main.jsx
│   ├── assets/
│   │   ├── css/landing.css        # Variables y estilos compartidos responsivos
│   │   └── images/bahia.svg       # Ilustración del catálogo original
│   └── src/
│       ├── main.jsx               # Montaje de React y carga de estilos
│       ├── App.jsx                # Rutas bajo el Layout común
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── ExperienceCard.jsx
│       │   ├── ExperienceGrid.jsx
│       │   ├── ExperienceSearch.jsx
│       │   ├── ExperienceResults.jsx
│       │   ├── ExperienceDialog.jsx
│       │   └── LandingStory.jsx
│       ├── data/                  # Arreglos de experiencias ilustrativas
│       ├── hooks/useExperiences.js
│       ├── utils/format.js
│       └── pages/                 # HomePage, CatalogPage, NotFoundPage
├── backend/                       # Servidor por implementar
├── database/                      # Esquema, migraciones y datos por implementar
├── tests/frontend/                # Pruebas de comportamiento con Playwright
└── docs/                          # Guía de demostración e informe comparativo
```

## Flujo actual

`main.jsx` monta `App`. Las rutas de `App` comparten `Layout`, que coloca las vistas en `Outlet`. Inicio y catálogo usan el mismo buscador, listado, diálogo y hook. El hook filtra el arreglo de datos; `ExperienceGrid` genera una `ExperienceCard` por elemento. Los cambios de estado actualizan React sin construir HTML con `innerHTML` ni instalar eventos sobre tarjetas recién creadas.

| Ruta | Comportamiento |
| --- | --- |
| `/` | Portada, destinos, filtros, seis ejemplos, historia y pasos. |
| `/catalogo` | Catálogo con búsqueda y la experiencia ilustrada original. |
| `/index.html`, `/pages/catalogo.html` | Compatibilidad con enlaces anteriores mediante redirecciones React. |
| Cualquier ruta no registrada | Vista de página no encontrada dentro del Layout. |

`ExperienceDialog` conserva una simulación local por fecha y viajeros. No crea reservas, no consulta cupos ni realiza cobros. El hosting debe reenviar rutas de aplicación a `index.html`. Las fotografías y fuentes externas requieren conexión.

## Alcance futuro del proyecto

La fundamentación original sigue siendo la referencia del producto. Estas funciones todavía no están implementadas; sus antiguos archivos estaban vacíos. Las futuras pantallas se crearán dentro de `src/pages/` y se registrarán en `App.jsx`, compartiendo componentes y estilos.

| Área | Pantallas y responsabilidades previstas |
| --- | --- |
| Servicios | Detalle, galería, disponibilidad y reseñas de cada servicio. |
| Autenticación | Registro de turista o prestador, login y captcha. |
| Turista | Nueva reserva, historial, detalle, confirmaciones y reseñas. |
| Prestador | Panel, publicación y edición de servicios, disponibilidad y gestión de reservas. |
| Administración | Aprobación de prestadores, moderación y estadísticas por municipio y temporada. |
| Sin conexión | Recursos guardados, solicitudes pendientes y sincronización posterior. |

El lenguaje y framework del servidor siguen por definir. `backend/config`, `middleware` y `shared` alojarán configuración, permisos y utilidades. Los módulos previstos son autenticación, usuarios, municipios, categorías, servicios, archivos, disponibilidad, reservas, reseñas, notificaciones, administración, estadísticas y sincronización. `database/schema`, `migrations` y `seeds` alojarán el modelo y sus cambios versionados.

El servidor deberá validar disponibilidad, evitar duplicados y resolver conflictos. Una solicitud guardada sin conexión será pendiente hasta que el servidor la confirme. Según el alcance original no se incluyen pagos en línea, aplicación móvil nativa, facturación electrónica ni traducciones.

Para ampliar la interfaz durante la evaluación consulta [demostracion-unidad-1.md](demostracion-unidad-1.md). El argumento sobre framework y diseño está en [informe-comparativo.md](informe-comparativo.md).
