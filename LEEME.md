# BajaTrip: experiencias y diseño responsivo

Desarrollamos la página de inicio de BajaTrip para mostrar experiencias turísticas de Baja California Sur. Podemos filtrarlas por destino y categoría, desplegar su descripción y consultar sus detalles. Incluimos una simulación para elegir fecha y viajeros; todavía no guardamos reservas ni realizamos cobros.

Abrimos `frontend/index.html` para probarla. Los estilos están en `frontend/assets/css/landing.css` y los datos e interacciones en `frontend/assets/js/landing.js`. Las fotografías y fuentes externas requieren internet.

## Propiedades que utilizamos

- **`@media`:** ajustamos márgenes y navegación para pantallas pequeñas, conservando los enlaces y permitiendo que los controles ocupen varias filas.
- **`@container`:** declaramos `.story` como contenedor `historia` de tipo `inline-size`. Su contenido `.story-layout` pasa a dos columnas a partir de `48rem` disponibles; con menos espacio apila imagen y texto.
- **`rem` y `px`:** usamos `rem` en los tamaños de texto para respetar el tamaño base del usuario. Conservamos píxeles en bordes y algunas medidas visuales.
- **`clamp()`:** los títulos crecen entre un mínimo y un máximo. Usamos `vw` para responder al ancho de la ventana y `cqi` al ancho del contenedor.
- **`auto-fit` y `minmax()`:** las cuadrículas calculan cuántas columnas caben. Las experiencias parten de `20rem`, limitados al espacio disponible; las tarjetas mantienen un ancho máximo al filtrar pocos resultados.
- **`srcset` y `sizes`:** ofrecemos varias resoluciones de imagen. Con `sizes="auto, ..."` y `loading="lazy"`, el navegador considera el ancho real; incluimos tamaños de respaldo.
- **`width`, `height` y `aspect-ratio`:** reservamos espacio antes de cargar las fotos y mantenemos las tarjetas en proporción 4:3. `object-fit: cover` evita deformarlas.
- **`dvh`:** la portada ocupa como mínimo la altura visible y puede crecer con el contenido. El diálogo también limita su altura con esta unidad; dejamos `vh` como respaldo.

## Semántica y movimiento

Organizamos la página con `header`, `nav`, `main`, `section` y `footer`. Cada experiencia es un `article` con encabezado, `figure`, `figcaption` y datos en `dl`. Usamos `details` y `summary` para desplegar información con teclado, y `dialog` para los detalles.

Conservamos las transiciones y animaciones de las tarjetas. El giro usa `transform`, `perspective`, `transform-style` y `backface-visibility`. La entrada tiene tres pasos con `@keyframes` y conserva su estado final con `animation-fill-mode: both`. Animamos `transform` y `opacity`, mostramos el foco y desactivamos el movimiento con `prefers-reduced-motion` en el inicio.

Consultamos [MDN sobre contenedores](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) y el [estándar HTML sobre imágenes](https://html.spec.whatwg.org/multipage/images.html). Nos apoyamos en IA para revisar el código, ajustar la responsividad y redactar este resumen.
