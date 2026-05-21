import type { QrOptions } from './types';
import { contrastRatio } from './color-utils';
import { EC_LABEL, isManualEcUnsafe, recommendedEc } from './ec-rules';

export type Severity = 'ok' | 'warn' | 'fail';

export interface ScannabilityResult {
  level: Severity;
  messages: string[];
}

/** Every foreground colour the engine will actually paint — one value for
 *  solid fills, both stops for a gradient. The fg contrast check now
 *  surfaces the *worst* of these so a bad stop can't hide behind a good
 *  average. */
function foregroundColors(opts: QrOptions): string[] {
  return opts.foreground.type === 'solid'
    ? [opts.foreground.color]
    : [opts.foreground.stops[0], opts.foreground.stops[1]];
}

/** The colour the engine will actually paint the corner finder pattern in.
 *  Matches qr-engine.ts: explicit eyeColor wins, otherwise the solid
 *  foreground colour, otherwise gradient stops[0]. */
function effectiveEyeColor(opts: QrOptions): string {
  if (opts.eyeColor) return opts.eyeColor;
  return opts.foreground.type === 'solid'
    ? opts.foreground.color
    : opts.foreground.stops[0];
}

export function assess(opts: QrOptions): ScannabilityResult {
  const messages: string[] = [];
  let level: Severity = 'ok';

  function bump(to: Severity) {
    if (to === 'fail' || (to === 'warn' && level !== 'fail')) level = to;
  }

  const bgColor = opts.background.color;

  // Foreground: check every stop the gradient passes through (or the solid
  // value) and report on the worst. Averaging both stops could mask a stop
  // with terrible contrast.
  const fgColors = foregroundColors(opts);
  const fgContrasts = fgColors.map((c) => contrastRatio(c, bgColor));
  const worstFgContrast = Math.min(...fgContrasts);
  if (worstFgContrast < 3.0) {
    bump(worstFgContrast < 1.5 ? 'fail' : 'warn');
    const where = fgColors.length > 1
      ? 'One gradient stop sits at'
      : 'Foreground / background contrast is';
    messages.push(
      `${where} ${worstFgContrast.toFixed(2)}:1. Scanners compare brightness, not hue — a colourful design can still read as low-contrast. Aim for ≥ 3:1.`,
    );
  }

  // Eye marker: always check, whether eyeColor is explicit or inherited
  // from the foreground. Previously the gate `if (opts.eyeColor)` skipped
  // gradient-derived eye colours, leaving a real blind spot.
  const eyeColor = effectiveEyeColor(opts);
  const eyeContrast = contrastRatio(eyeColor, bgColor);
  if (eyeContrast < 3.0) {
    bump(eyeContrast < 1.5 ? 'fail' : 'warn');
    messages.push(
      `Eye-marker contrast vs background is ${eyeContrast.toFixed(2)}:1. Scanners read brightness (not hue), so a bright colour on white can still read as low-contrast — try a darker shade.`,
    );
  }

  if (isManualEcUnsafe(opts)) {
    const rec = recommendedEc(opts);
    bump('warn');
    messages.push(`Error correction is ${EC_LABEL[opts.errorCorrection]} but this design usually needs ${EC_LABEL[rec]} to scan reliably.`);
  }

  return { level, messages };
}
