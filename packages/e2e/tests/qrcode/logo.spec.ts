import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';
import { SAMPLE_PNG, SAMPLE_SVG, MALICIOUS_SVG } from './_fixtures/sample-logos';

test.describe('qrcode · logo', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
    await qr.selectRail('logo');
  });

  test('logo rail reveals the dropzone', async () => {
    await expect(qr.logoDropzone()).toBeVisible();
  });

  test('L1: drop zone activates with Enter (F7)', async ({ page }) => {
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser'),
      qr.logoDropzone().press('Enter'),
    ]);
    await fc.setFiles({ ...SAMPLE_PNG });
  });

  test('L2: drop zone activates with Space (F7)', async ({ page }) => {
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser'),
      qr.logoDropzone().press(' '),
    ]);
    await fc.setFiles({ ...SAMPLE_PNG });
  });

  test('L3: uploading sample PNG embeds an <image> in the preview (F1)', async ({ page }) => {
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser'),
      qr.logoDropzone().click(),
    ]);
    await fc.setFiles({ ...SAMPLE_PNG });
    await qr.waitForPreviewSettle();
    await expect(qr.previewSvg().locator('image')).toHaveCount(1);
  });

  // L4 — F19 / §3.4: a logo above the reconciled threshold should bump EC to H.
  test.skip('L4: logo > 20% bumps EC to H and shows banner (F19)', async () => {});

  // L5 — manual EC choice still shows the autoBump banner as a hint.
  test.skip('L5: manual EC=L keeps the autoBump banner visible (F19)', async () => {});

  test('L6: malicious SVG (script tag) is rejected', async ({ page }) => {
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser'),
      qr.logoDropzone().click(),
    ]);
    await fc.setFiles({ ...MALICIOUS_SVG });
    // The form shows an error and the preview does not gain an <image>.
    await expect(page.getByText(/script/i)).toBeVisible();
    await qr.waitForPreviewSettle();
    expect(await qr.previewSvg().locator('image').count()).toBe(0);
  });

  test('L7: clean SVG logo embeds an <image> in the preview (F1)', async ({ page }) => {
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser'),
      qr.logoDropzone().click(),
    ]);
    await fc.setFiles({ ...SAMPLE_SVG });
    await qr.waitForPreviewSettle();
    await expect(qr.previewSvg().locator('image')).toHaveCount(1);
  });
});
