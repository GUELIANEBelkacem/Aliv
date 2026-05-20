import { test, expect } from '@playwright/test';
import { QrcodePage } from './_fixtures/qrcode-page';

test.describe('qrcode · shortcuts & modal', () => {
  let qr: QrcodePage;

  test.beforeEach(async ({ page }) => {
    qr = new QrcodePage(page);
    await qr.goto();
  });

  test('FAQ launcher opens and closes', async ({ page }) => {
    await qr.openFaq();
    await page.keyboard.press('Escape');
    await expect(qr.faqModal()).toBeHidden();
  });

  test('K1: Alt+1 switches to Content rail (F6)', async ({ page }) => {
    await qr.selectRail('colors');
    await page.keyboard.press('Alt+1');
    await expect(qr.rail('content')).toHaveClass(/is-active/);
  });

  test('K2: Alt+2 switches to Colors rail (F6)', async ({ page }) => {
    await page.keyboard.press('Alt+2');
    await expect(qr.rail('colors')).toHaveClass(/is-active/);
  });

  test('K3: Alt+3..6 switch to Shapes, Logo, Format, Export rails (F6)', async ({ page }) => {
    await page.keyboard.press('Alt+3');
    await expect(qr.rail('shapes')).toHaveClass(/is-active/);
    await page.keyboard.press('Alt+4');
    await expect(qr.rail('logo')).toHaveClass(/is-active/);
    await page.keyboard.press('Alt+5');
    await expect(qr.rail('format')).toHaveClass(/is-active/);
    await page.keyboard.press('Alt+6');
    await expect(qr.rail('export')).toHaveClass(/is-active/);
  });

  test('K4: Ctrl+2 no longer switches rails (F6)', async ({ page }) => {
    await qr.selectRail('content');
    await page.keyboard.press('Control+2');
    await expect(qr.rail('content')).toHaveClass(/is-active/);
  });

  test('K6: body scroll is locked while FAQ modal is open (F21)', async ({ page }) => {
    const before = await page.evaluate(() => getComputedStyle(document.body).overflow);
    await qr.openFaq();
    const open = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(open).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(qr.faqModal()).toBeHidden();
    const after = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(after).toBe(before);
  });

  test('K7: Tab inside FAQ modal stays in the modal (F21)', async ({ page }) => {
    await qr.openFaq();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="qr-modal-faq"]');
        return modal?.contains(document.activeElement) ?? false;
      });
      expect(inside).toBe(true);
    }
  });

  test('K8: Escape inside FAQ modal restores focus to the launcher (F21)', async ({ page }) => {
    await qr.openFaq();
    await page.keyboard.press('Escape');
    const onLauncher = await page.evaluate(() => {
      return document.activeElement?.getAttribute('aria-label') === 'Open FAQ';
    });
    expect(onLauncher).toBe(true);
  });
});
