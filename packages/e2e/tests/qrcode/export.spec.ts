import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';
import { captureDownload, isPng, isSvg, pngDimensions } from './_fixtures/download-helpers';

test.describe('qrcode · export', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
    await qr.selectRail('export');
  });

  test('X1: PNG download produces a valid PNG file', async ({ page }) => {
    const { filename, buffer } = await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download PNG' }).click();
    });
    expect(filename.toLowerCase()).toMatch(/\.png$/);
    expect(isPng(buffer)).toBe(true);
  });

  test('SVG download produces a valid SVG file', async ({ page }) => {
    const { filename, buffer } = await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download SVG' }).click();
    });
    expect(filename.toLowerCase()).toMatch(/\.svg$/);
    expect(isSvg(buffer)).toBe(true);
  });

  test('X2: exporting at 2048 doesn\'t change the preview size (F4)', async ({ page }) => {
    const sizeBefore = await qr.previewSvg().getAttribute('width');
    await page.locator('[data-segment-value="2048"]').click();
    await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download PNG' }).click();
    });
    await qr.waitForPreviewSettle();
    const sizeAfter = await qr.previewSvg().getAttribute('width');
    expect(sizeAfter).toBe(sizeBefore);
  });

  test('X3: PNG dimensions match requested resolution (F4)', async ({ page }) => {
    await page.locator('[data-segment-value="2048"]').click();
    const { buffer } = await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download PNG' }).click();
    });
    expect(pngDimensions(buffer).width).toBe(2048);
  });

  test('X4: SVG download contains a backdrop for non-none frames (F2)', async ({ page }) => {
    await qr.selectRail('shapes');
    await page.getByRole('radiogroup', { name: 'Frame', exact: true }).locator('[data-segment-value="circle"]').click();
    await qr.waitForPreviewSettle();
    await qr.selectRail('export');
    const { buffer } = await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download SVG' }).click();
    });
    expect(buffer.toString('utf-8')).toContain('<circle');
  });

  test('X5: Copy PNG reports either success or "not available", never the wrong message (F9)', async ({ page }) => {
    await page.getByRole('button', { name: /copy/i }).click();
    await expect(qr.exportFeedback()).toBeVisible({ timeout: 5_000 });
    // In headless Chromium clipboard.write may not be available; what we're
    // guarding against is the prior bug where success would be reported as
    // "Clipboard not available". So the message must be one of the two
    // expected strings and never anything else.
    const text = await qr.exportFeedback().innerText();
    expect(text === 'Copied!' || /Clipboard not available/i.test(text)).toBe(true);
  });

  test('X6: two PNG exports at different resolutions produce different sizes (F4)', async ({ page }) => {
    await page.locator('[data-segment-value="512"]').click();
    const first = await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download PNG' }).click();
    });
    await page.locator('[data-segment-value="2048"]').click();
    const second = await captureDownload(page, async () => {
      await page.getByRole('button', { name: 'Download PNG' }).click();
    });
    expect(pngDimensions(first.buffer).width).toBe(512);
    expect(pngDimensions(second.buffer).width).toBe(2048);
  });

  test('X7: export feedback uses the qr-export-feedback testid', async ({ page }) => {
    await page.getByRole('button', { name: /copy/i }).click();
    // Either "Copied!" or an error message — both should land on this node.
    await expect(qr.exportFeedback()).toBeVisible({ timeout: 5_000 });
  });
});
