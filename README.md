# BajaTrip

Frontend en React para explorar experiencias turísticas de Baja California Sur. Tiene cuatro páginas que comparten el mismo layout y se abren desde el menú: **Inicio** (buscador, destinos y experiencias), **Catálogo**, **Galería** (Práctica 1 integrada, con animaciones y variante de movimiento reducido) y **Mis viajes** (favoritos y reservas de ejemplo guardados en el navegador).

## Ejecutar

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

En producción publica `dist/` y configura el hosting para devolver `index.html` cuando la URL no corresponda a un archivo. React Router utiliza rutas como `/catalogo`. Los enlaces antiguos `/index.html` y `/pages/catalogo.html` se redirigen dentro de la aplicación.

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
| Reservas de ejemplo (IndexedDB) | `frontend/src/storage/reservations.js` |
| Aviso sin conexión (`navigator.onLine`) | `frontend/src/hooks/useOnline.js` |
| Galería y ampliación de fotos | `frontend/src/pages/GalleryPage.jsx` y `components/PhotoDialog.jsx` |
| Imágenes adaptativas (`srcset`) | `frontend/src/utils/images.js` |
| Vistas y rutas | `frontend/src/pages/` y `frontend/src/App.jsx` |

Consulta el [Avance 1: dónde está cada entregable y la auditoría de accesibilidad](docs/avance-1.md), la [Tarea 3: catálogo de componentes de HTML5](docs/tarea-3/tarea-3-catalogo-componentes-html5.pdf) ([guion de la exposición](docs/tarea-3/exposicion.md)), el [informe comparativo](docs/informe-comparativo.md) y las [notas de responsividad y animación](LEEME.md).

Para regenerar el PDF de la Tarea 3 después de editar `docs/tarea-3/catalogo-componentes-html5.html`, ejecuta `npm run pdf:tarea3`.

## Verificación

```sh
npx playwright install chromium
npm test
```

Las pruebas recorren búsqueda combinada, categorías, destinos sin resultados, reinicio, viajeros, cálculo de precio, fechas inválidas y válidas, cierre del diálogo, las cuatro páginas desde el menú, la galería con y sin movimiento reducido, favoritos en localStorage, búsqueda en sessionStorage, reservas en IndexedDB, rutas antiguas, cambios de variables y anchos de 320 a 1440 px.

Las reservas siguen siendo una demostración local: se guardan solo en el navegador (IndexedDB), no se envían solicitudes y no se realizan cobros. Autenticación, paneles, backend y modo sin conexión siguen pendientes; los antiguos archivos vacíos no representaban funciones implementadas. Las fotografías de Unsplash y las fuentes de Google requieren conexión.

La configuración usa [React con una herramienta de compilación](https://react.dev/learn/build-a-react-app-from-scratch) y [Vite](https://vite.dev/guide/). Las versiones resueltas se guardan en `package-lock.json`.
