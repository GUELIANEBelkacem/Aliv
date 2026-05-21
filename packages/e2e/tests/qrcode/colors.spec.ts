import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';

test.describe('qrcode · colors', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
    await qr.selectRail('colors');
  });

  test('Background input commits a new color', async ({ page }) => {
    const bg = page.getByLabel('Background', { exact: true });
    await bg.fill('#ff0000');
    await expect(bg).toHaveValue('#ff0000');
  });

  // K1 — F1 / §8.1: gradient → solid must leave no <linearGradient> behind.
  test('K1: solid → linear gradient → solid leaves no <linearGradient> (F1)', async ({ page }) => {
    await page.locator('[data-segment-value="linear-gradient"]').click();
    await qr.waitForPreviewSettle();
    expect(await qr.previewSvg().locator('linearGradient').count()).toBeGreaterThan(0);
    await page.locator('[data-segment-value="solid"]').click();
    await qr.waitForPreviewSettle();
    expect(await qr.previewSvg().locator('linearGradient').count()).toBe(0);
  });

  // K2 — symmetric for radial.
  test('K2: solid → radial gradient → solid leaves no <radialGradient> (F1)', async ({ page }) => {
    await page.locator('[data-segment-value="radial-gradient"]').click();
    await qr.waitForPreviewSettle();
    expect(await qr.previewSvg().locator('radialGradient').count()).toBeGreaterThan(0);
    await page.locator('[data-segment-value="solid"]').click();
    await qr.waitForPreviewSettle();
    expect(await qr.previewSvg().locator('radialGradient').count()).toBe(0);
  });

  // K3 — background fill round-trip.
  test.skip('K3: background gradient ↔ solid round-trip is clean (F1)', async () => {
    expect(true).toBe(true);
  });

  // K4 — F21: hex input draft state. Should not commit on every keystroke.
  test.skip('K4: hex input does not commit on every keystroke (F21)', async () => {
    // Type a 5-char prefix; preview foreground should stay at the previous color
    // until the input is blurred or Enter is pressed.
  });

  // K5 — recent colors persist across reload (existing behaviour; lock it in).
  test.skip('K5: recent colors persist across reload', async () => {});
});
