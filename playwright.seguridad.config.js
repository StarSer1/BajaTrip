import { defineConfig, devices } from '@playwright/test';

// Pruebas de la Práctica 6 contra el sistema completo en Docker (no levanta servidor propio).
// Antes: docker compose up -d --build. Ejecutar: npm run test:seguridad
export default defineConfig({
  testDir: './tests/seguridad',
  // En serie: varias pruebas leen la bitácora y el límite de intentos es compartido.
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], ignoreHTTPSErrors: true },
});
