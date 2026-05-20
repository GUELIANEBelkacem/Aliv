import type { ErrorCorrection, LogoSizeLabel, QrOptions } from './types';
import { LOGO_SIZE_LABELS } from './types';

/**
 * qr-code-styling renders an embedded logo at `oX * dotSize` where
 * `oX = floor(sqrt(maxHiddenDots))` and `maxHiddenDots = floor(sizeRatio
 * × ecMultiplier × moduleCount²)`, with `oX` forced to the nearest lower
 * odd number so the image stays centred on a module boundary.
 *
 * That means a slider with step 0.01 across [0.15, 0.35] silently maps to
 * only 2–4 visually distinct sizes (REVIEW logo-size audit). This module
 * computes the discrete sizeRatios that actually produce a different cell
 * count for the *current* QR + EC, so the slider can snap to them.
 */

const EC_MULTIPLIER: Record<ErrorCorrection, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.30,
};

/** Mirrors qr-code-styling's internal oX computation for a square image. */
function cellsForRatio(ratio: number, ec: ErrorCorrection, moduleCount: number): number {
  const maxHidden = Math.floor(ratio * EC_MULTIPLIER[ec] * moduleCount * moduleCount);
  let oX = Math.floor(Math.sqrt(maxHidden));
  if (oX <= 0) oX = 1;
  if (oX % 2 === 0) oX -= 1;
  return oX;
}

export interface LogoSizeBucket {
  /** The slider value that lands inside this bucket (the median ratio). */
  ratio: number;
  /** How many QR cells the image will visually occupy. */
  cells: number;
}

interface ComputeOpts {
  moduleCount: number;
  /** EC level the user has fixed, or undefined if autoBump is allowed. */
  userEc?: ErrorCorrection;
  /** Threshold above which the app autoBumps EC to H. */
  autoBumpThreshold: number;
  range: { min: number; max: number };
  /** Samples per unit of range. Higher = more precise bucket boundaries. */
  samples?: number;
}

/**
 * Walk the slider range and group consecutive ratios that render at the
 * same cell count. Return one representative ratio per distinct bucket.
 */
export function computeLogoSizeBuckets(opts: ComputeOpts): LogoSizeBucket[] {
  const { moduleCount, userEc, autoBumpThreshold, range, samples = 200 } = opts;
  if (moduleCount <= 0) return [];

  // Map each sample to its rendered cell count, accounting for autoBump.
  const samplesByRatio: { ratio: number; cells: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const ratio = range.min + (i / samples) * (range.max - range.min);
    const ec = userEc ?? (ratio > autoBumpThreshold ? 'H' : 'M');
    const cells = cellsForRatio(ratio, ec, moduleCount);
    if (cells > 0) samplesByRatio.push({ ratio, cells });
  }

  // Group into contiguous runs by cell count, then pick the median ratio
  // of each run so each slider stop sits in the centre of its bucket.
  const buckets: LogoSizeBucket[] = [];
  let runStart = 0;
  for (let i = 1; i <= samplesByRatio.length; i++) {
    const ended = i === samplesByRatio.length
      || samplesByRatio[i].cells !== samplesByRatio[runStart].cells;
    if (!ended) continue;
    const mid = samplesByRatio[Math.floor((runStart + i - 1) / 2)];
    // Dedupe: in the autoBump split, EC=M can produce e.g. 3 cells AND
    // EC=H can also produce 3 cells, just from a different ratio. Same
    // visual result — keep the lower-ratio version (less aggressive EC).
    const existing = buckets.find((b) => b.cells === mid.cells);
    if (!existing) buckets.push({ ratio: round2(mid.ratio), cells: mid.cells });
    runStart = i;
  }
  return buckets.sort((a, b) => a.cells - b.cells);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface LabeledBucket {
  label: LogoSizeLabel;
  bucket: LogoSizeBucket;
}

/**
 * Map the dynamic bucket list to up to 4 user-facing labels (S, M, L, XL).
 * If fewer than 4 distinct buckets are available, fewer labels are returned —
 * we don't show "XL" when it would render the same as "L".
 */
export function labeledBuckets(buckets: LogoSizeBucket[]): LabeledBucket[] {
  return buckets.slice(0, LOGO_SIZE_LABELS.length).map((bucket, i) => ({
    label: LOGO_SIZE_LABELS[i],
    bucket,
  }));
}

/**
 * Resolve a label back to a concrete ratio against the current bucket list.
 * Falls back to the last available bucket when the chosen label is past the
 * end (e.g. user picked XL but only S/M/L exist for this QR).
 */
export function labelToRatio(label: LogoSizeLabel, buckets: LogoSizeBucket[]): number | undefined {
  if (buckets.length === 0) return undefined;
  const idx = Math.min(LOGO_SIZE_LABELS.indexOf(label), buckets.length - 1);
  return buckets[idx]?.ratio;
}

/**
 * Reverse lookup: which label is the current ratio nearest to? Used to keep
 * the segmented control's `value` in sync with whatever ratio the engine is
 * actually rendering.
 */
export function nearestLabel(buckets: LogoSizeBucket[], ratio: number): LogoSizeLabel {
  if (buckets.length === 0) return 'M';
  const idx = nearestBucketIndex(buckets, ratio);
  return LOGO_SIZE_LABELS[Math.min(idx, LOGO_SIZE_LABELS.length - 1)];
}

/** Pick the bucket whose ratio is closest to the current slider value. */
export function nearestBucketIndex(buckets: LogoSizeBucket[], ratio: number): number {
  if (buckets.length === 0) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < buckets.length; i++) {
    const dist = Math.abs(buckets[i].ratio - ratio);
    if (dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  }
  return best;
}

/** Resolve the EC level that will actually be applied for a sizeRatio. */
export function effectiveEcFor(
  options: QrOptions,
  userTouchedEc: boolean,
  autoBumpThreshold: number,
): ErrorCorrection {
  if (userTouchedEc) return options.errorCorrection;
  const bigLogo = !!(options.logo && options.logo.sizeRatio > autoBumpThreshold);
  return bigLogo ? 'H' : options.errorCorrection;
}
