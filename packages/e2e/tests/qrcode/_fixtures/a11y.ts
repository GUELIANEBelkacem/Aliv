import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Run axe-core against the current page. Fails the test if any
 * violation of `serious` or `critical` severity is found. Lower
 * severities are reported as console output but don't fail — keeps
 * the bar reachable while still flagging real bugs.
 *
 * The `disableRules` opt-out is for rules where the AppShell chrome
 * (owned by @aliv/ui) carries known compromises that aren't this
 * spec's job to fix.
 */
export async function expectNoSeriousA11yViolations(
  page: Page,
  opts: { disableRules?: string[] } = {},
): Promise<void> {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  for (const rule of opts.disableRules ?? []) builder.disableRules(rule);
  const results = await builder.analyze();
  const bad = results.violations.filter((v) =>
    v.impact === 'serious' || v.impact === 'critical',
  );
  if (bad.length === 0) return;
  const summary = bad
    .map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`)
    .join('\n');
  expect(bad, `axe-core violations:\n${summary}`).toEqual([]);
}
