import type { QrOptions } from './types';
import { contrastRatio, averageColor } from './color-utils';
import { isManualEcUnsafe, recommendedEc } from './ec-rules';

export type Severity = 'ok' | 'warn' | 'fail';

export interface ScannabilityResult {
  level: Severity;
  messages: string[];
}

export function assess(opts: QrOptions): ScannabilityResult {
  const messages: string[] = [];
  let level: Severity = 'ok';

  function bump(to: Severity) {
    if (to === 'fail' || (to === 'warn' && level !== 'fail')) level = to;
  }

  const fgColor = opts.foreground.type === 'solid'
    ? opts.foreground.color
    : averageColor(opts.foreground.stops[0], opts.foreground.stops[1]);
  const bgColor = opts.background.color;

  const fgBgContrast = contrastRatio(fgColor, bgColor);
  if (fgBgContrast < 3.0) {
    bump(fgBgContrast < 1.5 ? 'fail' : 'warn');
    messages.push(`Foreground/background contrast is ${fgBgContrast.toFixed(2)}:1 — most scanners need ≥ 3:1.`);
  }

  if (opts.eyeColor) {
    const eyeContrast = contrastRatio(opts.eyeColor, bgColor);
    if (eyeContrast < 3.0) {
      bump(eyeContrast < 1.5 ? 'fail' : 'warn');
      messages.push(`Eye color contrast vs background is ${eyeContrast.toFixed(2)}:1 — corner markers may not be detected.`);
    }
  }

  // Catches "user is in advanced and picked an EC below what the
  // configuration actually needs". In auto mode this never fires because
  // effective EC = recommendedEc by construction. The old sizeRatio > 0.20
  // rule was unstable — it fired on the M label's snapped ratio at EC=M and
  // wasn't really a coverage measure.
  if (isManualEcUnsafe(opts)) {
    const rec = recommendedEc(opts);
    bump('warn');
    messages.push(`Error correction is ${opts.errorCorrection} but this configuration needs ${rec} for reliable scans.`);
  }

  return { level, messages };
}
