# BajaTrip

BajaTrip es una plataforma web para descubrir servicios y experiencias turísticas de Baja California Sur. El proyecto está pensado para conectar a turistas con prestadores locales mediante un catálogo organizado por municipio y categoría, y posteriormente permitir consultar disponibilidad, reservar y dejar reseñas.

## Primera página

La primera página es `frontend/index.html`. Ahí se encuentra la portada de BajaTrip con:

- el nombre y la identidad del proyecto;
- una introducción a la plataforma y a las experiencias de Baja California Sur;
- el enlace **Explorar experiencias**, que lleva al catálogo;
- el enlace **Catálogo** en la navegación principal.

Desde cualquiera de esos enlaces se llega a `frontend/pages/catalogo.html`, donde está integrada la tarjeta de experiencia de la práctica. No es un archivo independiente: se accede a ella navegando desde la portada del sitio.

Abre `frontend/index.html` en el navegador y selecciona **Explorar experiencias** o **Catálogo**. La tarjeta utiliza los colores y la tipografía definidos en `frontend/assets/css/global.css`, además de sus estilos propios en `frontend/assets/css/components/tarjeta-experiencia.css`.

El componente utiliza `article`, `figure`, `figcaption`, encabezados, `dl` y `details`/`summary`. Incluye transformaciones 2D y 3D, transiciones con `:hover` y `:focus`, una animación de tres pasos y una variante de movimiento reducido, sin JavaScript.

Consulta [LEEME.md](LEEME.md) para leer el informe de implementación de la tarjeta, su compatibilidad según Baseline y la justificación de las propiedades animadas.

Consulta [la guía de estructura](docs/estructura.md) para conocer la función de cada carpeta, las pantallas previstas y su relación con los requisitos de `Fundamentacion del Proyecto.pdf`.
