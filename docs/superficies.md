# Superficies de ataque — BajaTrip

Equipo: David Alejandro De Los Santos Cruz, Brandon Israel Nuñez Montoya

## Entradas del sistema

- `POST /api/reservas` (reserva de ejemplo: experiencia, fecha y viajeros en JSON)
- `GET /api/reservas` (reservas de la sesión)
- `DELETE /api/reservas/{id}`
- `GET /api/sesion` y la cookie `bt_sesion`
- `GET /salud`
- `/api/chat` (WebSocket del chat en vivo: nombre y mensaje que ven todos los conectados)
- Buscador de Inicio y Catálogo (destino, actividad y viajeros; se guarda en sessionStorage)
- Formulario de guías locales en `/guias` (nombre, teléfono, correo, fecha, idiomas y fotografía; se guarda en IndexedDB)
- Favoritos en localStorage y reservas en IndexedDB (el usuario puede editarlos desde F12)
- La dirección: `/catalogo`, `/galeria`, `/mis-viajes`, `/guias`, el `#` y `?version=1`
- Cabeceras `X-Real-IP` y `X-Forwarded-Proto` que agrega el balanceador
- Planeadas: `/login`, `/registro`, panel del prestador (`/api/servicios/{id}`), fotos de prestadores (`/api/archivos`) y panel de administración

## Las tres más expuestas

| Superficie | Categoría | Qué podría pasar | Medida |
|------------|-----------|------------------|--------|
| `DELETE /api/reservas/{id}` | A01 | Borrar o ver reservas de otro visitante cambiando el id | El servidor solo borra si la reserva es de la sesión (`WHERE id = ? AND sesion_id = ?`); ajena e inexistente responden igual y quedan en la bitácora |
| `POST /api/reservas` | A08 | Guardar una reserva con total de $1 editando IndexedDB o la petición | El servidor ignora el total que llega y lo recalcula con su catálogo (precio × viajeros); valida fecha, de 1 a 6 viajeros y máximo 20 reservas por sesión |
| `/api/chat` | A05 | Un mensaje con `<img onerror=…>` se ejecuta en la pantalla de todos los conectados | El Worker limpia y recorta nombre y mensaje, y React los muestra como texto (`{message.text}`), nunca con `innerHTML` |
