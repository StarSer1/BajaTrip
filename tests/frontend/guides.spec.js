import { test, expect } from '@playwright/test';

// El modo sin conexión se prueba con la compilación (npm run preview), que es la que registra el service worker.
const PREVIEW = 'http://127.0.0.1:4174';
const photo = {
  name: 'guia.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
};

async function register(page, { name, specialty = 'Aventura', municipality = 'La Paz', languages = [] }) {
  const form = page.locator('.guide-form');
  await form.getByLabel('Nombre completo').fill(name);
  await form.getByLabel('Especialidad').selectOption(specialty);
  await form.getByLabel('Municipio').selectOption(municipality);
  await form.getByLabel('Teléfono').fill('612 123 4567');
  await form.getByLabel('Correo electrónico').fill('guia@example.com');
  await form.getByLabel('Fecha de ingreso').fill('2021-03-15');
  for (const language of languages) await form.getByLabel(language).check();
  await form.getByLabel('Fotografía').setInputFiles(photo);
  await form.getByRole('button', { name: 'Registrar guía' }).click();
  await expect(page.locator('.guides-panel .result')).toHaveText(`Registramos a ${name}.`);
}

const chartRow = (page, municipality) => page.locator('.guides-chart__table tbody tr', { hasText: municipality });
const searchForm = (page) => page.getByRole('search', { name: 'Buscar guías' });

test('alta, consulta, búsqueda por índice, modificación y baja con confirmación', async ({ page }) => {
  await page.goto('/guias');
  await expect(page.getByText('Aún no hay guías registrados')).toBeVisible();
  await expect(page.getByText('versión 2 del esquema')).toBeVisible();

  await register(page, { name: 'Ana López', specialty: 'Mar y playa', languages: ['Inglés'] });
  await register(page, { name: 'Bruno Castro', municipality: 'Los Cabos' });
  await expect(page.locator('.guide-card')).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Ana López' })).toContainText('Español, Inglés');
  await page.getByText('Ver los datos en una tabla').click();
  await expect(chartRow(page, 'La Paz')).toContainText('1');
  await expect(chartRow(page, 'Los Cabos')).toContainText('1');

  await searchForm(page).getByLabel('Municipio').selectOption('La Paz');
  await searchForm(page).getByRole('button', { name: 'Buscar guías' }).click();
  await expect(page.locator('.guides-count')).toContainText('1 guía en La Paz · consulta resuelta con el índice «municipality»');
  await expect(page.locator('.guide-card')).toHaveCount(1);
  await searchForm(page).getByLabel('Municipio').selectOption('');
  await searchForm(page).getByLabel('Idioma').selectOption('Inglés');
  await searchForm(page).getByRole('button', { name: 'Buscar guías' }).click();
  await expect(page.locator('.guides-count')).toContainText('índice «languages»');
  await expect(page.getByRole('article', { name: 'Ana López' })).toBeVisible();
  await searchForm(page).getByRole('button', { name: 'Mostrar todos' }).click();
  await expect(page.locator('.guide-card')).toHaveCount(2);

  await page.getByRole('button', { name: 'Modificar a Bruno Castro' }).click();
  await expect(page.getByRole('heading', { name: 'Modificar a Bruno Castro' })).toBeVisible();
  await expect(page.locator('.guide-form').getByLabel('Nombre completo')).toBeFocused();
  await page.locator('.guide-form').getByLabel('Municipio').selectOption('Loreto');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.guides-panel .result')).toHaveText('Guardamos los cambios de Bruno Castro.');
  await expect(page.getByRole('article', { name: 'Bruno Castro' })).toContainText('Aventura · Loreto');
  await expect(chartRow(page, 'Loreto')).toContainText('1');
  await expect(chartRow(page, 'Los Cabos')).toContainText('0');

  const remove = page.getByRole('button', { name: 'Dar de baja a Ana López' });
  await remove.click();
  const dialog = page.getByRole('dialog', { name: '¿Dar de baja a Ana López?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(remove).toBeFocused();
  await remove.click();
  await page.getByRole('button', { name: 'Sí, dar de baja' }).click();
  await expect(page.locator('.guides-count')).toContainText('Dimos de baja a Ana López.');
  await expect(page.locator('.guide-card')).toHaveCount(1);

  await page.reload();
  const card = page.getByRole('article', { name: 'Bruno Castro' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('img', { name: 'Fotografía de Bruno Castro' })).toHaveAttribute('src', /^blob:/);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('la versión 2 migra los registros de la versión 1 sin perderlos', async ({ page }) => {
  await page.goto('/guias?version=1');
  await expect(page.getByText('versión 1 del esquema')).toBeVisible();
  await expect(page.locator('.guide-form').getByText('Idiomas que habla')).toHaveCount(0);
  await register(page, { name: 'Carla Ruiz', municipality: 'Mulegé' });
  await expect(page.getByRole('article', { name: 'Carla Ruiz' })).toContainText('Sin registrar');

  await page.getByRole('link', { name: 'abre el catálogo normal' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Actualizamos la base' }))
    .toContainText('de la versión 1 a la 2 y conservamos 1 registro');
  await expect(page.getByText('versión 2 del esquema')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Carla Ruiz' })).toContainText('Español');

  await page.goto('/guias?version=1');
  await expect(page.getByRole('alert')).toContainText('ya está en una versión más reciente');
});

test('sin conexión: abre, lista, busca y da de alta con el service worker', async ({ page, context }) => {
  await page.goto(`${PREVIEW}/guias`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await register(page, { name: 'Diego Peña', municipality: 'Comondú' });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Guías locales', level: 1 })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Diego Peña' })).toBeVisible();
  await register(page, { name: 'Elena Soto', municipality: 'Loreto' });
  await searchForm(page).getByLabel('Municipio').selectOption('Loreto');
  await searchForm(page).getByRole('button', { name: 'Buscar guías' }).click();
  await expect(page.locator('.guide-card')).toHaveCount(1);
  await expect(page.getByRole('article', { name: 'Elena Soto' })).toBeVisible();
  await page.getByText('Ver los datos en una tabla').click();
  await expect(chartRow(page, 'Loreto')).toContainText('1');
  await page.goto(`${PREVIEW}/catalogo`);
  await expect(page.getByRole('heading', { name: 'Catálogo de experiencias' })).toBeVisible();
  await context.setOffline(false);
});
