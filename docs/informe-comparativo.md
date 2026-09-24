# Informe comparativo — Unidad 1

Al migrar BajaTrip a React dejamos de generar tarjetas con cadenas de HTML y actualizar manualmente la cuadrícula. Un arreglo alimenta `ExperienceCard` mediante `map`, y React sincroniza la interfaz con el estado de los filtros. Nosotros seguimos definiendo componentes y reglas de negocio. `Layout` evita duplicar encabezado y pie. React es una biblioteca de interfaz: añadimos React Router para las rutas y Vite para compilar.

No cambian el contenido, la semántica, la accesibilidad ni la responsividad: dependen de las necesidades del usuario y del navegador. Nosotros definimos variables CSS, distribución y movimiento reducido. Cambiar de tecnología tampoco crea reservas reales; estas requieren validar disponibilidad y guardar solicitudes en un servidor.

Para tres años de mantenimiento por otro equipo, priorizamos el sistema de diseño documentado: sus reglas evitan estilos contradictorios y permiten crear vistas coherentes. La paleta, las escalas y los criterios de accesibilidad pueden sobrevivir a otro cambio tecnológico. El framework también necesita actualizaciones y pruebas, pero no corrige decisiones visuales inconsistentes. Por eso acompañamos el diseño reutilizable con componentes sencillos y dependencias controladas.
