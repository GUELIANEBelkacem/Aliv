import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';

test.describe('qrcode · content types', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
  });

  test('C1.wifi: switching to Wi-Fi reveals SSID input', async ({ page }) => {
    await qr.setContentType('wifi');
    await expect(page.getByLabel('SSID', { exact: true })).toBeVisible();
  });

  test('C1.email: switching to Email reveals To input', async ({ page }) => {
    await qr.setContentType('email');
    await expect(page.getByLabel('To', { exact: true })).toBeVisible();
  });

  test('C1.vcard: switching to vCard reveals First name input', async ({ page }) => {
    await qr.setContentType('vcard');
    await expect(page.getByLabel('First name', { exact: true })).toBeVisible();
  });

  test('C1.geo: switching to Geo reveals Latitude input', async ({ page }) => {
    await qr.setContentType('geo');
    await expect(page.getByLabel('Latitude', { exact: true })).toBeVisible();
  });

  test('C1.calendar: switching to Event reveals Title input', async ({ page }) => {
    await qr.setContentType('calendar');
    await expect(page.getByLabel('Title', { exact: true })).toBeVisible();
  });

  test('C4: Wi-Fi auth uses the shared segmented control (F3)', async ({ page }) => {
    await qr.setContentType('wifi');
    const authGroup = page.getByRole('radiogroup', { name: 'Auth' });
    await expect(authGroup).toBeVisible();
    // The hand-rolled qr-segmented class is gone; the shared control emits
    // role="radio" buttons with data-segment-value attributes.
    await expect(authGroup.locator('[data-segment-value="WPA"]')).toBeVisible();
    await expect(authGroup.locator('[data-segment-value="WEP"]')).toBeVisible();
    await expect(authGroup.locator('[data-segment-value="nopass"]')).toBeVisible();
  });

  test('C3: clearing required Wi-Fi SSID removes scannable badge (F10)', async ({ page }) => {
    await qr.setContentType('wifi');
    await page.getByLabel('SSID', { exact: true }).fill('');
    await qr.waitForPreviewSettle();
    // The preview meta now reads "Preview only — fix the error..." and the
    // notice (if visible) carries the data-severity attribute, not "scannable".
    await expect(qr.preview()).toHaveAttribute('data-valid', 'false');
  });

  // C5 — F5 / §1.3: calendar payload should contain a VCALENDAR envelope.
  // Requires a DEV-only data attribute mirroring the encoded string, added later.
  test.skip('C5: calendar payload contains VCALENDAR envelope (F5)', async () => {
    await qr.setContentType('calendar');
    const encoded = await qr.previewCanvasMount().getAttribute('data-qr-data');
    expect(encoded).toContain('BEGIN:VCALENDAR');
  });

  // C6 — F8 / §1.5: email body should use %20 for spaces, never `+`.
  test.skip('C6: email body uses %20 for spaces (F8)', async ({ page }) => {
    await qr.setContentType('email');
    await page.getByLabel('Body').fill('Hello world & Co.');
    await qr.waitForPreviewSettle();
    const encoded = await qr.previewCanvasMount().getAttribute('data-qr-data');
    expect(encoded).toMatch(/body=Hello%20world/);
    expect(encoded).not.toMatch(/body=Hello\+world/);
  });

  test('C7: calendar end-before-start shows error (F22)', async ({ page }) => {
    await qr.setContentType('calendar');
    await page.getByLabel('Title', { exact: true }).fill('Test event');
    await page.getByLabel('Starts', { exact: true }).fill('2026-06-10T15:00');
    await page.getByLabel('Ends', { exact: true }).fill('2026-06-10T14:00');
    await qr.waitForPreviewSettle();
    await expect(qr.preview()).toHaveAttribute('data-valid', 'false');
    await expect(page.getByText(/end date must be after/i)).toBeVisible();
  });

  test('C8: URL rejects javascript: scheme (F22)', async ({ page }) => {
    await qr.setContentType('url');
    await page.getByLabel('URL', { exact: true }).fill('javascript:alert(1)');
    await qr.waitForPreviewSettle();
    await expect(qr.preview()).toHaveAttribute('data-valid', 'false');
  });

  test('C9: empty SSID has aria-invalid (F22)', async ({ page }) => {
    await qr.setContentType('wifi');
    const ssid = page.getByLabel('SSID', { exact: true });
    await ssid.fill('');
    await expect(ssid).toHaveAttribute('aria-invalid', 'true');
  });
});
