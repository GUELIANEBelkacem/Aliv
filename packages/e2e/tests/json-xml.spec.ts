import { test, expect } from '@playwright/test';
import { APP_URLS } from '../playwright.config';

test.describe('json-xml conversion', () => {
  test('paste JSON via the editor produces XML output', async ({ page }) => {
    await page.goto(APP_URLS.jsonXml);
    // The CodeMirror editor: focus the input panel and type. CM exposes a
    // contenteditable .cm-content under each panel; the first one is input.
    const inputPanel = page.locator('.cm-content').first();
    await inputPanel.click();
    // Replace existing sample by selecting all and typing.
    await page.keyboard.press('Control+a');
    await page.keyboard.type('{"a":1}');
    // Output should appear in the second editor.
    const output = page.locator('.cm-content').nth(1);
    await expect(output).toContainText('<a>1</a>', { timeout: 5_000 });
  });

  test('Format badge shows JSON when input is JSON', async ({ page }) => {
    await page.goto(APP_URLS.jsonXml);
    await expect(page.locator('.panel-format.json').first()).toBeVisible();
  });
});
