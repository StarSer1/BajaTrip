import { useEffect, useState } from 'react';

// Reduce la fotografía con canvas y la devuelve como Blob JPEG para guardarla dentro de
// IndexedDB: el registro conserva la imagen aunque se borre o se mueva el archivo original.
export async function preparePhoto(file, maxSize = 480) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff'; // Fondo para las imágenes con transparencia.
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen'))), 'image/jpeg', 0.85));
}

// Convierte un Blob en una URL temporal para <img> y la libera cuando ya no se usa.
export function useObjectUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return undefined; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
