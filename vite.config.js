import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Genera dist/sw.js a partir de frontend/sw.js con la lista de archivos de esta compilación.
// La huella se calcula con el contenido de esos archivos: si cambia cualquiera, cambia sw.js
// y el navegador instala la versión nueva de la caché.
function serviceWorker() {
  return {
    name: 'bajatrip-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const names = Object.keys(bundle).filter((file) => !file.endsWith('.map')).sort();
      const hash = createHash('sha256');
      names.forEach((file) => hash.update(file).update(bundle[file].code ?? bundle[file].source));
      const version = hash.digest('hex').slice(0, 10);
      const files = names.map((file) => `/${file}`);
      const source = readFileSync('frontend/sw.js', 'utf8')
        .replace('__PRECACHE__', JSON.stringify(files))
        .replace('__VERSION__', version);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  root: 'frontend',
  plugins: [react(), serviceWorker()],
  build: { outDir: '../dist', emptyOutDir: true },
  // En desarrollo, el chat se conecta al Worker local (npm run dev:worker, puerto 8787).
  server: { proxy: { '/api': { target: 'http://localhost:8787', ws: true } } },
});
