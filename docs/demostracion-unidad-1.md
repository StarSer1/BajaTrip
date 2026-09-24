# Demostración de las prácticas 2 y 3 (3–5 minutos)

Arranca `npm run dev` antes de exponer. Mantén abiertas la portada y `/catalogo`, el editor y este guion. La vista que solicite el docente se construye durante la demostración; este ejemplo explica el procedimiento y no pretende adivinarla.

## 1. Variables y cambio visible (45 segundos)

Abre `frontend/assets/css/landing.css`. El primer bloque `:root` contiene paleta (`--color-*`), espaciado (`--espacio-*`), tipografía (`--fuente-*`, `--texto-*`) y medidas compartidas.

Cambia `--color-marca: #174f47` a `#7a4a9e` y guarda: cambian el botón del buscador y el filtro seleccionado tanto en inicio como en catálogo. El estado hover tiene su propia variable. También puedes cambiar `--radio-tarjeta: 13px` a `30px`: todas las tarjetas y sus imágenes heredan el nuevo radio. Restaura el valor después. `--separacion-tarjetas` controla la separación horizontal y, en móvil, la separación vertical con un ajuste de 6px.

## 2. Layout, componente y datos (60 segundos)

- `Layout.jsx` contiene encabezado, menú, `<main><Outlet /></main>` y pie. `Outlet` es donde React Router coloca cada vista.
- `App.jsx` registra inicio y catálogo como rutas hijas de ese layout. Una nueva ruta hija recibe la misma estructura.
- `ExperienceCard.jsx` recibe `experience`; `ExperienceGrid.jsx` recorre `experiences.map(...)` con `key={experience.id}`. No hay una tarjeta escrita a mano por producto.
- `data/experiences.js` contiene los seis ejemplos. `useExperiences.js` mantiene filtros y viajeros; `ExperienceDialog.jsx` muestra detalles y simulación.

## 3. Crear la vista solicitada (1–2 minutos)

Traduce la petición a una selección de datos: destino, categoría, duración o precio. Crea un archivo en `frontend/src/pages/`. Por ejemplo, si pidieran salidas cortas:

```jsx
import { tours } from '../data/experiences.js';
import ExperienceGrid from '../components/ExperienceGrid.jsx';

export default function SalidasCortasPage() {
  const experiences = tours.filter((tour) => tour.duration <= 3);
  return (
    <div className="wrap section page-content">
      <header className="page-intro">
        <p className="eyebrow">BAJA A TU RITMO</p>
        <h1>Salidas de hasta tres horas</h1>
      </header>
      <ExperienceGrid experiences={experiences} />
    </div>
  );
}
```

Importa la vista en `App.jsx` y agrega la ruta **dentro** de `<Route element={<Layout />}>`:

```jsx
import SalidasCortasPage from './pages/SalidasCortasPage.jsx';
// Dentro de la ruta del Layout:
<Route path="salidas-cortas" element={<SalidasCortasPage />} />
```

Abre `/salidas-cortas`. Ya tiene encabezado, menú, pie, tarjetas y responsividad. Para incorporarla al menú agrega un `<Link to="/salidas-cortas">Salidas cortas</Link>` en `Layout.jsx`. Adapta filtro y título a la petición real. Las tarjetas conservan su descripción desplegable; si necesitas buscador y reserva de ejemplo, reutiliza `useExperiences`, `ExperienceSearch` y `ExperienceResults`, como en `CatalogPage.jsx`.

## 4. Responsividad y comportamiento (45 segundos)

Abre el sitio en el teléfono con la URL Network del servidor, o reduce el navegador a 390 px. Muestra cómo navegación, buscador, cuadrícula y pie se adaptan. Prueba un destino sin ejemplos (Comondú), restaura los resultados y abre un detalle. Selecciona viajeros y fecha para mostrar la simulación, que no envía una reserva real.

El informe está en [informe-comparativo.md](informe-comparativo.md). El HTML de clase se utilizó como referencia conceptual; la implementación está dentro del proyecto React.
