import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';
import { APP_URLS } from '../../playwright.config';

test.describe('qrcode · smoke', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
  });

  test('S2: preview renders within 2s', async () => {
    await qr.goto();
    await expect(qr.previewCanvasMount().locator('svg, canvas')).toHaveCount(1);
  });

  test('S3: no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await qr.goto();
    await qr.waitForPreviewSettle();
    expect(errors).toEqual([]);
  });

  test('rail switches between Content and Colors', async () => {
    await qr.goto();
    await qr.selectRail('colors');
    await qr.selectRail('content');
  });

  test('S1: <html data-app="qrcode"> is set at first paint (F12)', async ({ page }) => {
    await page.goto(APP_URLS.qrcode, { waitUntil: 'domcontentloaded' });
    const attr = await page.evaluate(() => document.documentElement.dataset.app);
    expect(attr).toBe('qrcode');
  });

  // S4: full keyboard reach through the rail. Depends on focus ring polish in F21.
  test.skip('S4: tabbing through chrome reaches each rail item (F21)', async () => {
    await qr.goto();
    // (filled in by a11y.spec.ts coverage too)
  });
});
