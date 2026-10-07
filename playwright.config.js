import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/frontend',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
