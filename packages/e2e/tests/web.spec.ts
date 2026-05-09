import { test, expect } from '@playwright/test';
import { APP_URLS } from '../playwright.config';

test.describe('platform landing', () => {
  test('renders the hero headline', async ({ page }) => {
    await page.goto(APP_URLS.web);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Privacy-first/i);
  });

  test('AppGrid lists every non-platform Aliv app', async ({ page }) => {
    await page.goto(APP_URLS.web);
    const cards = page.locator('[data-app-card]');
    await expect(cards).toHaveCount(3); // json-xml, qrcode, hashgen (web is the platform itself)
  });

  test('live cards open in a new tab', async ({ page }) => {
    await page.goto(APP_URLS.web);
    const card = page.locator('[data-app-id="json-xml"]');
    await expect(card).toHaveAttribute('target', '_blank');
  });

  test('manifesto section is visible', async ({ page }) => {
    await page.goto(APP_URLS.web);
    await expect(page.getByText(/No uploads, ever/i)).toBeVisible();
  });
});
