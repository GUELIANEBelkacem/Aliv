import { describe, expect, it } from 'vitest';
import {
  recommendedEc,
  recommendedEcFromMargin,
  isManualEcUnsafe,
  safeMaxPadding,
  EC_RANK,
} from '../lib/ec-rules';
import { DEFAULT_QR_OPTIONS, type QrOptions, type LogoConfig } from '../lib/types';

function opts(overrides: Partial<QrOptions> = {}): QrOptions {
  return { ...DEFAULT_QR_OPTIONS, ...overrides };
}

function logo(ratio: number): LogoConfig {
  return { src: 'data:image/png;base64,xxx', size: 'M', sizeRatio: ratio, padding: 0, shape: 'square' };
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

  it('H when the logo crosses the 20 % bump line', () => {
    expect(recommendedEc(opts({ logo: logo(0.25) }))).toBe('H');
  });

  it('H from margin alone even with no logo', () => {
    expect(recommendedEc(opts({ margin: 50 }))).toBe('H'); // 50/280 ≈ 17.9 %
  });

  it('logo H wins over margin Q', () => {
    expect(recommendedEc(opts({ margin: 30, logo: logo(0.25) }))).toBe('H');
  });

  it('logo at 0.20 exactly does not bump (strict >)', () => {
    expect(recommendedEc(opts({ logo: logo(0.20) }))).toBe('M');
  });
});

describe('isManualEcUnsafe', () => {
  it('flags L when recommended is H', () => {
    expect(isManualEcUnsafe(opts({ errorCorrection: 'L', logo: logo(0.30) }))).toBe(true);
  });

  it('does not flag H when recommended is H', () => {
    expect(isManualEcUnsafe(opts({ errorCorrection: 'H', logo: logo(0.30) }))).toBe(false);
  });

  it('does not flag M when recommended is M', () => {
    expect(isManualEcUnsafe(opts())).toBe(false);
  });

  it('flags M when margin forces Q', () => {
    expect(isManualEcUnsafe(opts({ errorCorrection: 'M', margin: 30 }))).toBe(true);
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
