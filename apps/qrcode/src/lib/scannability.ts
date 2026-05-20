import type { QrOptions } from './types';
import { contrastRatio, averageColor } from './color-utils';

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

  // Unified threshold with App.tsx's LARGE_LOGO_THRESHOLD (REVIEW §3.4). The
  // qr-code-styling rule of thumb is that a logo > 20% of QR area needs H.
  if (opts.logo && opts.logo.sizeRatio > 0.2 && opts.errorCorrection !== 'H') {
    bump('warn');
    messages.push(`Logo covers >20% of the QR but error correction is ${opts.errorCorrection}. Use H for safety.`);
  }

  return { level, messages };
}
