import { test, expect } from '@playwright/test';
import { APP_URLS } from '../playwright.config';

test.describe('qrcode generator', () => {
  test('renders a QR for default URL content', async ({ page }) => {
    await page.goto(APP_URLS.qrcode);
    const preview = page.getByTestId('qr-preview');
    await expect(preview.locator('canvas, svg')).toHaveCount(1, { timeout: 5_000 });
  });

  test('rail switches to Colors and back to Content', async ({ page }) => {
    await page.goto(APP_URLS.qrcode);
    await page.locator('[data-rail-id="colors"]').click();
    await expect(page.locator('[data-rail-id="colors"]')).toHaveClass(/is-active/);
    await page.locator('[data-rail-id="content"]').click();
    await expect(page.locator('[data-rail-id="content"]')).toHaveClass(/is-active/);
  });

  test('switching content type to Wi-Fi swaps the form', async ({ page }) => {
    await page.goto(APP_URLS.qrcode);
    await page.locator('[data-content-type="wifi"]').click();
    await expect(page.getByLabel('SSID')).toBeVisible();
  });

  test('Colors section reveals the Background input', async ({ page }) => {
    await page.goto(APP_URLS.qrcode);
    await page.locator('[data-rail-id="colors"]').click();
    const bg = page.getByLabel('Background', { exact: true });
    await bg.fill('#ff0000');
    await expect(bg).toHaveValue('#ff0000');
  });

  test('preset gallery applies a preset', async ({ page }) => {
    await page.goto(APP_URLS.qrcode);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.locator('[data-preset-id="cyan-brand"]').click();
    await expect(page.locator('[data-preset-id="cyan-brand"]')).toHaveClass(/is-current|qr-preset/);
  });
});
