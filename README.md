# BajaTrip
Proyecto de una plataforma de servicios turísticos en Baja California Sur.

Estructura inicial del proyecto y tarjeta de experiencia turística animada de la práctica 1.

<<<<<<< Updated upstream
Abre `frontend/index.html` en el navegador y selecciona **Explorar experiencias** o **Catálogo**. La tarjeta está integrada en `frontend/pages/catalogo.html`, con estilos propios en `frontend/assets/css/components/tarjeta-experiencia.css` y estilos compartidos en `frontend/assets/css/global.css`.
=======
## Primera página

La portada incluye un diseño adaptable a móvil con buscador por destino y categoría, seis experiencias de ejemplo y un panel de detalles. Abre `frontend/index.html` para probarlo; no requiere instalar dependencias. Los estilos están en `frontend/assets/css/landing.css` y las interacciones en `frontend/assets/js/landing.js`.

Las reservas son una demostración local: permiten elegir fecha y viajeros, pero no guardan ni envían solicitudes ni procesan pagos. Para contratar servicios reales falta conectar prestadores, disponibilidad, precios y un sistema de reservas. Las fotografías son ilustrativas y se cargan desde Unsplash; las fuentes se cargan desde Google Fonts y requieren conexión.

La primera página es `frontend/index.html`. Ahí se encuentra la portada de BajaTrip con:

- el nombre y la identidad del proyecto;
- una introducción a la plataforma y a las experiencias de Baja California Sur;
- el enlace **Explorar experiencias**, que lleva al catálogo;
- el enlace **Catálogo** en la navegación principal.

Desde cualquiera de esos enlaces se llega a `frontend/pages/catalogo.html`, donde está integrada la tarjeta de experiencia de la práctica. No es un archivo independiente: se accede a ella navegando desde la portada del sitio.

Abre `frontend/index.html` en el navegador y selecciona **Explorar experiencias** o **Catálogo**. La tarjeta utiliza los colores y la tipografía definidos en `frontend/assets/css/global.css`, además de sus estilos propios en `frontend/assets/css/components/tarjeta-experiencia.css`.
>>>>>>> Stashed changes

El componente utiliza `article`, `figure`, `figcaption`, encabezados, `dl` y `details`/`summary`. Incluye transformaciones 2D y 3D, transiciones con `:hover` y `:focus`, una animación de tres pasos y una variante de movimiento reducido, sin JavaScript.

Consulta [LEEME.md](LEEME.md) para leer el informe de implementación de la tarjeta, su compatibilidad según Baseline y la justificación de las propiedades animadas.

Consulta [la guía de estructura](docs/estructura.md) para conocer la función de cada carpeta, las pantallas previstas y su relación con los requisitos de `Fundamentacion del Proyecto.pdf`.
