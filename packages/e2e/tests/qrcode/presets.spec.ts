import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';

test.describe('qrcode · presets', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
  });

  test('preset card is clickable through the settings drawer', async () => {
    await qr.applyPreset('cyan-brand');
    // The preset apply button stays in the DOM with the qr-preset class.
    await expect(qr.presetCard('cyan-brand')).toHaveClass(/qr-preset/);
  });

  test('P1: applying a preset adds is-current to its card (F13)', async () => {
    await qr.applyPreset('cyan-brand');
    await expect(qr.presetCard('cyan-brand')).toHaveClass(/is-current/);
  });

  test('P2: tweaking a color removes is-current (F13)', async ({ page }) => {
    await qr.applyPreset('cyan-brand');
    await expect(qr.presetCard('cyan-brand')).toHaveClass(/is-current/);
    // Close the drawer, navigate to Colors, change the background.
    await page.keyboard.press('Escape');
    await qr.selectRail('colors');
    await page.getByLabel('Background', { exact: true }).fill('#abcdef');
    await qr.openSettings();
    await expect(qr.presetCard('cyan-brand')).not.toHaveClass(/is-current/);
  });

  test('P3: Reset fully resets state (F14)', async ({ page }) => {
    await qr.applyPreset('cyan-brand');
    await page.keyboard.press('Escape');
    // Type something into the URL field.
    await page.getByLabel('URL', { exact: true }).fill('https://example.test/different');
    await qr.openSettings();
    await page.getByRole('button', { name: /reset/i }).click();
    await page.keyboard.press('Escape');
    await qr.waitForPreviewSettle();
    // URL field is back to the default ('https://aliv.app').
    await expect(page.getByLabel('URL', { exact: true })).toHaveValue('https://aliv.app');
    // No preset is highlighted any more.
    await qr.openSettings();
    await expect(qr.presetCards().locator('.is-current')).toHaveCount(0);
  });

  test('P4: each preset card contains a mini-QR thumbnail (F16)', async () => {
    await qr.openSettings();
    const cards = qr.presetCards();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('.qr-preset-thumb svg, .qr-preset-thumb canvas')).toHaveCount(1);
    }
  });

  // P5 — F15 / §8.8: stale eyeColor is cleared on preset apply. The visible
  // proof is hard to assert from outside; covered by presets unit test.
  test.skip('P5: apply preset clears stale eye color (F15) — covered by unit test', async () => {});
});
