import { test, expect } from '@playwright/test';
import { APP_URLS } from '../playwright.config';

const apps = [
  { url: APP_URLS.jsonXml, name: 'JSON ↔ XML', appId: 'json-xml' },
  { url: APP_URLS.qrcode, name: 'QR Generator', appId: 'qrcode' },
  { url: APP_URLS.web, name: 'Aliv', appId: 'web' },
];

for (const app of apps) {
  test.describe(`AppShell on ${app.name}`, () => {
    test('renders the app name in the header', async ({ page }) => {
      await page.goto(app.url);
      await expect(page.locator('.aliv-app-name')).toContainText(app.name);
    });

    test('sets data-app on the html element', async ({ page }) => {
      await page.goto(app.url);
      await expect(page.locator('html')).toHaveAttribute('data-app', app.appId);
    });

    test('app switcher opens and lists every Aliv app', async ({ page }) => {
      await page.goto(app.url);
      await page.getByRole('button', { name: 'App switcher' }).click();
      const tiles = page.locator('[data-tile]');
      await expect(tiles).toHaveCount(4);
    });

    test('theme toggle flips data-theme', async ({ page }) => {
      await page.goto(app.url);
      const before = await page.locator('html').getAttribute('data-theme');
      await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
      const after = await page.locator('html').getAttribute('data-theme');
      expect(after).not.toBe(before);
    });
  });
}
