# BajaTrip

Frontend en React para explorar experiencias turísticas de Baja California Sur. La portada conserva su diseño, filtros por destino y categoría, detalles desplegables, animaciones y simulación de reserva por fecha y viajeros. El catálogo comparte el layout y la tarjeta de experiencia.

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
| Filtros y selección de viajeros | `frontend/src/hooks/useExperiences.js` |
| Vistas y rutas | `frontend/src/pages/` y `frontend/src/App.jsx` |

Consulta la [guía de demostración de las prácticas 2 y 3](docs/demostracion-unidad-1.md), el [informe comparativo de media cuartilla](docs/informe-comparativo.md), la [estructura del proyecto](docs/estructura.md) y las [notas de responsividad y animación](LEEME.md).

## Verificación

```sh
npx playwright install chromium
npm test
```

Las pruebas recorren búsqueda combinada, categorías, destinos sin resultados, reinicio, viajeros, cálculo de precio, fechas inválidas y válidas, cierre del diálogo, catálogo, rutas antiguas, cambios de variables, movimiento reducido y anchos de 320 a 1440 px.

Las reservas siguen siendo una demostración local: no se guardan ni envían solicitudes y no se realizan cobros. Autenticación, paneles, backend y modo sin conexión siguen pendientes; los antiguos archivos vacíos no representaban funciones implementadas. Las fotografías de Unsplash y las fuentes de Google requieren conexión.

La configuración usa [React con una herramienta de compilación](https://react.dev/learn/build-a-react-app-from-scratch) y [Vite](https://vite.dev/guide/). Las versiones resueltas se guardan en `package-lock.json`.
