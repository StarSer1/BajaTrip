import { test, expect } from '@playwright/test';

test('buscador, destinos, categorías y estado sin resultados', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(6);
  await page.getByLabel('¿A dónde vamos?').selectOption('La Paz');
  await page.getByLabel('¿Qué te gustaría hacer?', { exact: false }).selectOption('Mar y playa');
  await page.getByRole('button', { name: 'Explorar experiencias', exact: true }).click();
  await expect(page.locator('#count')).toHaveText('2 experiencias en La Paz');
  await page.getByRole('button', { name: 'Aventura', exact: true }).click();
  await expect(page.getByText('Tu próxima aventura está por llegar')).toBeVisible();
  await page.getByRole('button', { name: 'Ver todas las experiencias' }).click();
  await expect(page.locator('.card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Loreto', exact: true }).click();
  await expect(page.locator('#count')).toHaveText('1 experiencias en Loreto');
  await expect(page.locator('#activity')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Comondú', exact: true }).click();
  await expect(page.locator('.card')).toHaveCount(0);
});

test('detalles, viajeros, fecha válida y cierre accesible', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Viajeros', { exact: false }).selectOption('3');
  const trigger = page.getByRole('button', { name: 'Ver detalles de Un día en Espíritu Santo', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('$5,400 MXN');
  await page.getByRole('button', { name: 'Probar reserva de ejemplo' }).click();
  await expect(dialog.locator('.result')).toBeEmpty();
  await page.getByLabel('Fecha de tu aventura').fill('2020-01-01');
  await page.getByRole('button', { name: 'Probar reserva de ejemplo' }).click();
  await expect(dialog.locator('.result')).toBeEmpty();
  await page.getByLabel('Fecha de tu aventura').fill('2099-12-25');
  await page.getByRole('button', { name: 'Probar reserva de ejemplo' }).click();
  await expect(dialog.getByRole('status')).toContainText('3 personas. No se envió ninguna solicitud.');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByRole('dialog').locator('.result')).toBeEmpty();
  await page.getByRole('button', { name: 'Cerrar detalles' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('navegación, catálogo, enlaces antiguos y contenido original', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explorar experiencias en el catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('heading', { name: 'Catálogo de experiencias', exact: true })).toBeVisible();
  await expect(page.locator('main .card')).toHaveCount(6);
  await page.getByRole('link', { name: 'Galería', exact: true }).click();
  await expect(page).toHaveURL(/\/galeria$/);
  const original = page.getByRole('article', { name: 'Un día junto al mar en La Paz', exact: true });
  await original.locator('summary').click();
  await expect(original.getByText('El itinerario, el precio y la disponibilidad se mostrarán cuando el prestador publique el servicio.')).toBeVisible();
  await page.reload();
  await expect(page.locator('main .card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Destinos', exact: true }).click();
  await expect(page).toHaveURL(/\/#destinos$/);
  await expect(page.locator('#destinos')).toBeInViewport();
  await page.goto('/pages/catalogo.html');
  await expect(page).toHaveURL(/\/catalogo$/);
  await page.goto('/index.html');
  await expect(page.getByRole('heading', { name: 'BAJA SUR', exact: true })).toBeVisible();
  await page.goto('/no-existe');
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
});

test('layout responsivo, variables compartidas y movimiento reducido', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const header = await page.locator('.site-header').boundingBox();
    const title = await page.locator('#titulo-inicio').boundingBox();
    expect(header.y + header.height).toBeLessThanOrEqual(title.y);
  }
  expect(await page.locator('.tarjeta-experiencia__contenido').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await page.addStyleTag({ content: ':root { --color-marca: #7a4a9e; --radio-tarjeta: 30px; --separacion-tarjetas: 40px; }' });
  await expect(page.locator('.search .button')).toHaveCSS('background-color', 'rgb(122, 74, 158)');
  await expect(page.locator('.card').first()).toHaveCSS('border-radius', '30px');
  await expect(page.locator('.grid')).toHaveCSS('column-gap', '40px');
  await page.getByRole('link', { name: 'Explorar experiencias en el catálogo' }).click();
  await expect(page.locator('.search .button')).toHaveCSS('background-color', 'rgb(122, 74, 158)');
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('la aplicación arranca sin errores de React', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error' && /React|Warning:|Invalid|Uncaught/.test(message.text())) errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(6);
  await page.getByRole('link', { name: 'Explorar experiencias en el catálogo' }).click();
  await expect(page.locator('.card')).toHaveCount(6);
  for (const name of ['Galería', 'Mis viajes']) await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mis viajes', level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('el menú llega a las cuatro páginas sin desbordar en tres anchos', async ({ page }) => {
  const pages = [['Inicio', 'BAJA SUR'], ['Catálogo', 'Catálogo de experiencias'], ['Galería', 'Galería'], ['Mis viajes', 'Mis viajes']];
  await page.goto('/');
  for (const [link, heading] of pages) {
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: link, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: link, exact: true })).toHaveAttribute('aria-current', 'page');
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});

test('galería: ampliación accesible y variante de movimiento reducido', async ({ page }) => {
  await page.goto('/galeria');
  await expect(page.locator('.gallery img')).toHaveCount(6);
  expect(await page.locator('.gallery__figure').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('entrada-experiencia');
  const trigger = page.getByRole('button', { name: 'Ampliar fotografía: El Arco desde el mar' });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'El Arco desde el mar' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.gallery__figure').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await trigger.focus();
  expect(await trigger.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
});

test('favoritos en localStorage sobreviven a cerrar la página', async ({ page }) => {
  await page.goto('/');
  const save = page.getByRole('button', { name: 'Guardar Kayak en el mar de Cortés en favoritos' });
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /^Mis viajes\s*, 1 favorito$/ })).toBeVisible();
  await page.goto('/mis-viajes');
  await page.reload();
  await expect(page.getByRole('article', { name: 'Kayak en el mar de Cortés' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bajatrip:favoritos'))).toBe('["kayak"]');
  await page.getByRole('button', { name: 'Guardar Kayak en el mar de Cortés en favoritos' }).click();
  await expect(page.getByText('Aún no guardas favoritos')).toBeVisible();
});

test('la búsqueda en sessionStorage se conserva al recargar y al cambiar de vista', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('¿A dónde vamos?').selectOption('La Paz');
  await page.getByLabel('Viajeros', { exact: false }).selectOption('4');
  await page.getByRole('button', { name: 'Explorar experiencias', exact: true }).click();
  await page.reload();
  await expect(page.locator('#count')).toHaveText('2 experiencias en La Paz');
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page.locator('#travelers')).toHaveValue('4');
  await expect(page.locator('#count')).toHaveText('2 experiencias en La Paz');
});

test('las reservas de ejemplo se guardan en IndexedDB y se pueden eliminar', async ({ page }) => {
  await page.goto('/catalogo');
  await page.getByRole('button', { name: 'Ver detalles de Balandra, sin prisa', exact: true }).click();
  await page.getByLabel('Fecha de tu aventura').fill('2099-03-14');
  await page.getByRole('button', { name: 'Probar reserva de ejemplo' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('La guardamos en Mis viajes');
  await page.getByRole('dialog').getByRole('link', { name: 'Ver Mis viajes' }).click();
  await expect(page.getByRole('heading', { name: 'Mis viajes', level: 1 })).toBeVisible();
  await page.reload();
  const item = page.locator('.trip-list li');
  await expect(item).toHaveCount(1);
  await expect(item).toContainText('14 de marzo de 2099');
  await expect(item).toContainText('$1,700 MXN');
  await page.getByRole('button', { name: /Eliminar reserva de ejemplo: Balandra/ }).click();
  await expect(page.getByText('Sin reservas de ejemplo')).toBeVisible();
});
