import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';

test.describe('qrcode · frame & shape', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
  });

  test('frame stage exposes a data-frame attribute', async () => {
    await qr.selectRail('shapes');
    const attr = await qr.frameStage().getAttribute('data-frame');
    expect(attr).not.toBeNull();
  });

  // FS1 — F2 / §8.3 + §8.4: frame shape must reshape the actual QR (preview SVG path),
  // and the QR module bbox must stay inside the frame path bbox.
  test.skip('FS1: each frame shape updates the preview SVG <path> (F2)', async () => {});

  // FS2 — F2 / F18: a "None" frame yields a square QR with no surrounding path.
  test.skip('FS2: "None" frame removes the surrounding path (F2)', async () => {});

  // FS3 — module shape changes change the preview module element.
  test.skip('FS3: module shape options change the rendered modules', async () => {});

  // FS4 — eye frame and eye ball shapes change the corner-marker subtree.
  test.skip('FS4: eye frame / eye ball shapes apply', async () => {});

  test('FS5: data-shape attributes have been cleaned up (F11)', async ({ page }) => {
    await qr.selectRail('shapes');
    expect(await page.locator('[data-shape]').count()).toBe(0);
  });

  test('FS6: switching to circle frame inscribes the QR (F2)', async ({ page }) => {
    await qr.selectRail('shapes');
    await page.getByRole('radiogroup', { name: 'Frame', exact: true }).locator('[data-segment-value="circle"]').click();
    await qr.waitForPreviewSettle();
    await expect(qr.frameStage()).toHaveAttribute('data-frame', 'circle');
    await expect(qr.frameStage().locator('.qr-frame-backdrop')).toHaveCount(1);
  });

  test('FS7: switching to None frame removes the backdrop (F2)', async ({ page }) => {
    await qr.selectRail('shapes');
    await page.getByRole('radiogroup', { name: 'Frame', exact: true }).locator('[data-segment-value="none"]').click();
    await qr.waitForPreviewSettle();
    await expect(qr.frameStage()).toHaveAttribute('data-frame', 'none');
    await expect(qr.frameStage().locator('.qr-frame-backdrop')).toHaveCount(0);
  });
});
