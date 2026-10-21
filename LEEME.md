# Práctica 4: catálogo de guías locales

Para esta práctica tomamos la entidad de nuestro proyecto que corresponde al personal: las personas guías que acompañan las experiencias de BajaTrip. El catálogo está en la ruta `/guias`; su código se encuentra en `frontend/src/guides/` y el service worker en `frontend/sw.js`. Las notas de las entregas anteriores se trasladaron a [docs/unidad-1](docs/unidad-1/notas-responsividad.md).

**Cómo probarlo:** `npm run build` y `npm run preview`, abrir `http://localhost:4173/guias` y, desde las herramientas del navegador (Red › Sin conexión), desactivar la red. El service worker solo se registra en la versión compilada.

## Esquema de la base

Base `bajatrip-guias`, almacén `guias`, con la clave `id` generada automáticamente.

| Campo | Tipo | Contenido |
| --- | --- | --- |
| `id` | número | Clave autoincremental |
| `name` | texto | Nombre completo |
| `specialty` | texto | Mar y playa, Aventura o Cultura y sabores |
| `municipality` | texto | Uno de los cinco municipios de Baja California Sur |
| `phone` / `email` | texto | Datos de contacto |
| `startDate` | fecha | Fecha de ingreso; de ella sale la antigüedad |
| `photo` | Blob | Fotografía en binario, reducida a 480 px con canvas |
| `languages` | lista | Idiomas que habla (se agrega en la versión 2) |

La **versión 1** crea el almacén y el índice `municipality`. La **versión 2** agrega `languages` con un índice *multiEntry* y, dentro de `onupgradeneeded`, recorre con un cursor los registros existentes para asignarles «Español» sin borrar ninguno. Para ver la migración se elimina la base desde Aplicación › IndexedDB, se abre `/guias?version=1`, se registran algunos guías y después se entra a `/guias`: la página informa cuántos registros se conservaron.

## Por qué indexamos el municipio

En BajaTrip quien viaja elige primero su destino, y cada guía trabaja en un municipio; la pregunta natural es «¿quién me puede acompañar en Loreto?». Con el índice, `getAll('Loreto')` llega directamente a esos registros en lugar de leer todo el almacén y filtrar después. El mismo índice alimenta el gráfico, que responde **¿cuántos guías tenemos en cada municipio?** contando con `count()` los registros reales. El índice de idiomas permite además encontrar, por ejemplo, a quien habla inglés. Debajo del buscador indicamos qué índice resolvió cada consulta.

## Estrategia de caché

Escribimos el service worker sin librerías para poder explicar cada paso. Al compilar, Vite genera la lista de archivos (HTML, JavaScript y CSS) y el service worker los guarda durante la instalación. Después aplica una estrategia distinta según el recurso:

- **Páginas, red primero:** con conexión se recibe el HTML más reciente; sin ella se entrega el `index.html` guardado y React Router muestra la vista solicitada.
- **Archivos compilados, caché primero:** su nombre incluye un hash y nunca cambian, así que no tiene caso consultar la red.
- **Fuentes de Google, copia guardada y actualización en segundo plano:** la página no espera a la red para mostrar el texto.

No guardamos las fotografías de Unsplash del resto del sitio porque son pesadas y no forman parte del catálogo; las fotos de los guías no lo necesitan, ya que viven en IndexedDB. Cada compilación cambia la huella del service worker, de modo que la caché anterior se elimina al activarse la nueva.

## Declaración de uso de IA

Utilizamos asistentes de inteligencia artificial únicamente como apoyo en el diseño de la interfaz y para comprender el funcionamiento de algunos componentes, como los índices de IndexedDB y el ciclo de vida del service worker.
