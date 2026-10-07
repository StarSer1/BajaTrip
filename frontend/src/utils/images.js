// Unsplash entrega cada fotografía al ancho pedido; srcset ofrece varias resoluciones
// y el navegador descarga la más adecuada para la pantalla.
export const photoUrl = (id, width) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
export const photoSrcSet = (id, widths) => widths.map((width) => `${photoUrl(id, width)} ${width}w`).join(', ');
