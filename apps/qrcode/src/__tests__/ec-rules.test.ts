import { describe, expect, it } from 'vitest';
import {
  recommendedEc,
  recommendedEcFromMargin,
  isManualEcUnsafe,
  safeMaxPadding,
  EC_RANK,
} from '../lib/ec-rules';
import { DEFAULT_QR_OPTIONS, type QrOptions, type LogoConfig, type LogoSizeLabel } from '../lib/types';

function opts(overrides: Partial<QrOptions> = {}): QrOptions {
  return { ...DEFAULT_QR_OPTIONS, ...overrides };
}

function logo(size: LogoSizeLabel = 'M', ratio = 0.23): LogoConfig {
  return { src: 'data:image/png;base64,xxx', size, sizeRatio: ratio, padding: 0, shape: 'square' };
}

describe('recommendedEcFromMargin', () => {
  it('returns M for the default margin (12 / 280 ≈ 4 %)', () => {
    expect(recommendedEcFromMargin(opts({ margin: 12 }))).toBe('M');
  });

  it('bumps to Q just above 10 % of size', () => {
    expect(recommendedEcFromMargin(opts({ margin: 29 }))).toBe('Q'); // 29/280 ≈ 10.4 %
  });

  it('bumps to H just above 15 % of size', () => {
    expect(recommendedEcFromMargin(opts({ margin: 43 }))).toBe('H'); // 43/280 ≈ 15.4 %
  });

  it('boundary cases use strict greater-than', () => {
    // exactly 10% should NOT bump (10% is the boundary)
    expect(recommendedEcFromMargin(opts({ margin: 28, size: 280 }))).toBe('M');
    // exactly 15% should NOT bump to H
    expect(recommendedEcFromMargin(opts({ margin: 42, size: 280 }))).toBe('Q');
  });
});

describe('recommendedEc', () => {
  it('M baseline with no logo, default margin', () => {
    expect(recommendedEc(opts())).toBe('M');
  });

  it('label drives auto-EC: S/M → M, L/XL → H', () => {
    // Label-based, not ratio-based — the label is the user's intent and is
    // stable across engine re-renders. S/M sit inside EC=M's budget; L/XL
    // need EC=H.
    expect(recommendedEc(opts({ logo: logo('S', 0.16) }))).toBe('M');
    expect(recommendedEc(opts({ logo: logo('M', 0.20) }))).toBe('M');
    expect(recommendedEc(opts({ logo: logo('L', 0.30) }))).toBe('H');
    expect(recommendedEc(opts({ logo: logo('XL', 0.35) }))).toBe('H');
  });

  it('H from margin alone even with no logo', () => {
    expect(recommendedEc(opts({ margin: 50 }))).toBe('H'); // 50/280 ≈ 17.9 %
  });

  it('margin Q wins over S logo', () => {
    // S logo asks for M; margin > 10% asks for Q. max() picks Q.
    expect(recommendedEc(opts({ margin: 30, logo: logo('S') }))).toBe('Q');
  });

  it('L logo wins over margin Q', () => {
    expect(recommendedEc(opts({ margin: 30, logo: logo('L') }))).toBe('H');
  });
});

describe('isManualEcUnsafe', () => {
  it('flags L when recommended is H', () => {
    expect(isManualEcUnsafe(opts({ errorCorrection: 'L', logo: logo('L') }))).toBe(true);
  });

  it('does not flag H when recommended is H', () => {
    expect(isManualEcUnsafe(opts({ errorCorrection: 'H', logo: logo('L') }))).toBe(false);
  });

  it('does not flag M when recommended is M', () => {
    expect(isManualEcUnsafe(opts())).toBe(false);
  });

  it('flags M when margin forces Q', () => {
    expect(isManualEcUnsafe(opts({ errorCorrection: 'M', margin: 30 }))).toBe(true);
  });

  it('does NOT flag L on a baseline page (no logo, no big margin)', () => {
    // Picking L below the M baseline is the user's prerogative — there's no
    // safety risk to flag. Only fire when the recommendation was bumped
    // above baseline by an actual trigger.
    expect(isManualEcUnsafe(opts({ errorCorrection: 'L' }))).toBe(false);
  });
});

describe('safeMaxPadding', () => {
  it('0 for a hole smaller than the minimum image floor', () => {
    expect(safeMaxPadding({ cells: 3, dotSize: 5 })).toBe(0); // hole 15 px < 16 px floor
  });

  it('grows with hole size', () => {
    expect(safeMaxPadding({ cells: 3, dotSize: 11.2 })).toBe(8);  // (33.6-16)/2 = 8.8 → 8
    expect(safeMaxPadding({ cells: 5, dotSize: 11.2 })).toBe(20); // (56-16)/2 = 20 exactly
    expect(safeMaxPadding({ cells: 9, dotSize: 11.2 })).toBe(42); // (100.8-16)/2 = 42.4 → 42
  });

  it('inscribed (smaller) QR shrinks the cap', () => {
    // circle frame: ~194 px / 25 modules = 7.76 dotSize
    expect(safeMaxPadding({ cells: 3, dotSize: 7.76 })).toBe(3); // (23.3-16)/2 = 3.6 → 3
  });
});

describe('EC_RANK', () => {
  it('orders L < M < Q < H', () => {
    expect(EC_RANK.L).toBeLessThan(EC_RANK.M);
    expect(EC_RANK.M).toBeLessThan(EC_RANK.Q);
    expect(EC_RANK.Q).toBeLessThan(EC_RANK.H);
  });
});
