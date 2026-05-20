import type { ErrorCorrection, QrOptions } from './types';

// Single source of truth for every EC threshold the app uses.
// Tuned against qr-code-styling's behaviour at sizes 21–41 modules.

export const LOGO_BUMP_H_THRESHOLD   = 0.20;
export const MARGIN_BUMP_Q_THRESHOLD = 0.10;
export const MARGIN_BUMP_H_THRESHOLD = 0.15;
export const MIN_EMBEDDED_LOGO_PX    = 16;

export const EC_RANK: Record<ErrorCorrection, number> = { L: 0, M: 1, Q: 2, H: 3 };

const max = (a: ErrorCorrection, b: ErrorCorrection): ErrorCorrection =>
  EC_RANK[a] >= EC_RANK[b] ? a : b;

export function recommendedEcFromMargin(opts: QrOptions): ErrorCorrection {
  const ratio = opts.margin / opts.size;
  if (ratio > MARGIN_BUMP_H_THRESHOLD) return 'H';
  if (ratio > MARGIN_BUMP_Q_THRESHOLD) return 'Q';
  return 'M';
}

function recommendedEcFromLogo(opts: QrOptions): ErrorCorrection {
  return opts.logo && opts.logo.sizeRatio > LOGO_BUMP_H_THRESHOLD ? 'H' : 'M';
}

// Picks the EC level the app would apply if the user were not overriding it
// manually. Combines margin- and logo-driven contributions; never goes below M.
export function recommendedEc(opts: QrOptions): ErrorCorrection {
  return max(recommendedEcFromMargin(opts), recommendedEcFromLogo(opts));
}

export function isManualEcUnsafe(opts: QrOptions): boolean {
  return EC_RANK[opts.errorCorrection] < EC_RANK[recommendedEc(opts)];
}

// Cap logo padding so the rendered embedded image is at least
// MIN_EMBEDDED_LOGO_PX wide on every axis. Past this point qr-code-styling
// renders a zero/negative-width <image> that slips out of place.
export function safeMaxPadding({ cells, dotSize }: { cells: number; dotSize: number }): number {
  const holePx = cells * dotSize;
  return Math.max(0, Math.floor((holePx - MIN_EMBEDDED_LOGO_PX) / 2));
}
