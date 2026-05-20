import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { APP_URLS } from '../../../playwright.config';

export type RailId = 'content' | 'colors' | 'shapes' | 'logo' | 'format' | 'export';
export type ContentTypeId =
  | 'text' | 'url' | 'wifi' | 'vcard'
  | 'email' | 'sms' | 'phone' | 'geo' | 'calendar';
export type Resolution = '256' | '512' | '1024' | '2048';

export class QrcodePage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_URLS.qrcode);
    await expect(this.previewCanvasMount()).toBeVisible();
    await expect(this.previewCanvasMount().locator('svg, canvas')).toHaveCount(1, {
      timeout: 5_000,
    });
  }

  // --- Preview ----------------------------------------------------------

  preview(): Locator { return this.page.getByTestId('qr-preview'); }
  frameStage(): Locator { return this.page.getByTestId('qr-frame-stage'); }
  previewCanvasMount(): Locator { return this.page.getByTestId('qr-preview-canvas'); }
  previewSvg(): Locator { return this.previewCanvasMount().locator('svg'); }

  async previewSvgMarkup(): Promise<string> {
    return await this.previewSvg().evaluate((el) => el.outerHTML);
  }

  // --- Rails ------------------------------------------------------------

  rail(id: RailId): Locator { return this.page.locator(`[data-rail-id="${id}"]`); }
  async selectRail(id: RailId): Promise<void> {
    await this.rail(id).click();
    await expect(this.rail(id)).toHaveClass(/is-active/);
  }

  // --- Content tabs -----------------------------------------------------

  contentTab(id: ContentTypeId): Locator {
    return this.page.locator(`[data-content-type="${id}"]`);
  }
  contentTypeTrigger(): Locator {
    return this.page.getByTestId('qr-content-type-trigger');
  }
  async setContentType(id: ContentTypeId): Promise<void> {
    const tab = this.contentTab(id);
    if (!(await tab.isVisible().catch(() => false))) {
      await this.contentTypeTrigger().click();
    }
    await tab.click();
  }
  contentForm(): Locator { return this.page.getByTestId('qr-content-form'); }

  // --- Scannability / export feedback ----------------------------------

  scannabilityNotice(): Locator { return this.page.getByTestId('qr-scannability-notice'); }
  exportFeedback(): Locator { return this.page.getByTestId('qr-export-feedback'); }
  exportResolution(): Locator { return this.page.getByTestId('qr-export-resolution'); }

  // --- Presets / settings drawer ---------------------------------------

  async openSettings(): Promise<void> {
    await this.page.getByRole('button', { name: 'Settings' }).click();
  }
  presetCards(): Locator { return this.page.getByTestId('qr-preset-card'); }
  presetCard(id: string): Locator { return this.page.locator(`[data-preset-id="${id}"]`); }
  async applyPreset(id: string): Promise<void> {
    await this.openSettings();
    await this.presetCard(id).click();
  }

  // --- Logo / FAQ -------------------------------------------------------

  logoDropzone(): Locator { return this.page.getByTestId('qr-logo-dropzone'); }
  logoFileInput(): Locator {
    return this.logoDropzone().locator('xpath=..').locator('input[type="file"]');
  }
  async openFaq(): Promise<void> {
    await this.page.getByRole('button', { name: 'Open FAQ' }).click();
    await expect(this.faqModal()).toBeVisible();
  }
  faqModal(): Locator { return this.page.getByTestId('qr-modal-faq'); }

  // --- Assertions / waits ----------------------------------------------

  /**
   * Resolves when the preview has fully repainted past the 50ms debounce.
   * The QR engine in this app re-renders on a setTimeout-driven debounce;
   * we wait one animation frame plus a small buffer so callers don't have
   * to sprinkle waitForTimeout everywhere.
   */
  async waitForPreviewSettle(): Promise<void> {
    await this.page.waitForTimeout(120);
  }
}
