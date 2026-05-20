import { describe, expect, it } from 'vitest';
import {
  computeLogoSizeBuckets,
  labeledBuckets,
  labelToRatio,
  nearestBucketIndex,
  nearestLabel,
  type LogoSizeBucket,
} from '../lib/logo-size';

describe('computeLogoSizeBuckets', () => {
  it('returns at least 2 distinct cell counts for a typical QR + autoBump', () => {
    // Default URL "https://aliv.app" → ~v2 / count=25 at EC=M.
    const buckets = computeLogoSizeBuckets({
      moduleCount: 25,
      userEc: undefined,
      autoBumpThreshold: 0.2,
      range: { min: 0.15, max: 0.35 },
    });
    expect(buckets.length).toBeGreaterThanOrEqual(2);
    // Each bucket must be a distinct cell count.
    const cells = buckets.map((b) => b.cells);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('odd cell counts only (qr-code-styling forces oX to be odd)', () => {
    const buckets = computeLogoSizeBuckets({
      moduleCount: 29,
      userEc: undefined,
      autoBumpThreshold: 0.2,
      range: { min: 0.15, max: 0.35 },
    });
    for (const b of buckets) expect(b.cells % 2).toBe(1);
  });

  it('cell counts strictly increase with bucket index', () => {
    const buckets = computeLogoSizeBuckets({
      moduleCount: 33,
      userEc: undefined,
      autoBumpThreshold: 0.2,
      range: { min: 0.15, max: 0.35 },
    });
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].cells).toBeGreaterThan(buckets[i - 1].cells);
    }
  });

  it('every bucket ratio lies within the requested range', () => {
    const buckets = computeLogoSizeBuckets({
      moduleCount: 25,
      userEc: undefined,
      autoBumpThreshold: 0.2,
      range: { min: 0.15, max: 0.35 },
    });
    for (const b of buckets) {
      expect(b.ratio).toBeGreaterThanOrEqual(0.15);
      expect(b.ratio).toBeLessThanOrEqual(0.35);
    }
  });

  it('returns more buckets when the user has not touched EC (autoBump available)', () => {
    // With autoBump the slider can flip between EC=M (lower mult) and EC=H,
    // exposing a wider range of cell counts than EC=M alone.
    const withAutoBump = computeLogoSizeBuckets({
      moduleCount: 25,
      userEc: undefined,
      autoBumpThreshold: 0.2,
      range: { min: 0.15, max: 0.35 },
    });
    const lockedM = computeLogoSizeBuckets({
      moduleCount: 25,
      userEc: 'M',
      autoBumpThreshold: 0.2,
      range: { min: 0.15, max: 0.35 },
    });
    expect(withAutoBump.length).toBeGreaterThanOrEqual(lockedM.length);
  });

  it('empty list when moduleCount is 0', () => {
    expect(
      computeLogoSizeBuckets({
        moduleCount: 0,
        userEc: 'M',
        autoBumpThreshold: 0.2,
        range: { min: 0.15, max: 0.35 },
      }),
    ).toEqual([]);
  });
});

describe('nearestBucketIndex', () => {
  const buckets = [
    { ratio: 0.16, cells: 3 },
    { ratio: 0.23, cells: 5 },
    { ratio: 0.30, cells: 7 },
  ];

  it('returns 0 for an empty bucket list', () => {
    expect(nearestBucketIndex([], 0.25)).toBe(0);
  });

  it('snaps to the closest bucket by ratio', () => {
    expect(nearestBucketIndex(buckets, 0.15)).toBe(0);
    expect(nearestBucketIndex(buckets, 0.20)).toBe(1);
    expect(nearestBucketIndex(buckets, 0.28)).toBe(2);
  });

  it('ties go to the earlier bucket (lower index)', () => {
    const mid = (buckets[0].ratio + buckets[1].ratio) / 2;
    expect(nearestBucketIndex(buckets, mid)).toBe(0);
  });
});

describe('labeledBuckets', () => {
  it('maps up to 4 buckets to S/M/L/XL', () => {
    const buckets: LogoSizeBucket[] = [
      { ratio: 0.16, cells: 3 },
      { ratio: 0.23, cells: 5 },
      { ratio: 0.30, cells: 7 },
      { ratio: 0.34, cells: 9 },
    ];
    const out = labeledBuckets(buckets);
    expect(out.map((b) => b.label)).toEqual(['S', 'M', 'L', 'XL']);
  });

  it('truncates label list when fewer than 4 buckets exist', () => {
    const buckets: LogoSizeBucket[] = [
      { ratio: 0.18, cells: 3 },
      { ratio: 0.28, cells: 5 },
    ];
    expect(labeledBuckets(buckets).map((b) => b.label)).toEqual(['S', 'M']);
  });

  it('empty in, empty out', () => {
    expect(labeledBuckets([])).toEqual([]);
  });
});

describe('labelToRatio', () => {
  const buckets: LogoSizeBucket[] = [
    { ratio: 0.16, cells: 3 },
    { ratio: 0.23, cells: 5 },
    { ratio: 0.30, cells: 7 },
  ];

  it('resolves the matching index', () => {
    expect(labelToRatio('S', buckets)).toBe(0.16);
    expect(labelToRatio('M', buckets)).toBe(0.23);
    expect(labelToRatio('L', buckets)).toBe(0.30);
  });

  it('falls back to the last bucket when the label is out of range', () => {
    // Only 3 buckets exist (S, M, L); XL falls back to L's ratio.
    expect(labelToRatio('XL', buckets)).toBe(0.30);
  });

  it('returns undefined for an empty bucket list', () => {
    expect(labelToRatio('S', [])).toBeUndefined();
  });
});

describe('nearestLabel', () => {
  const buckets: LogoSizeBucket[] = [
    { ratio: 0.16, cells: 3 },
    { ratio: 0.23, cells: 5 },
    { ratio: 0.30, cells: 7 },
  ];

  it('snaps to S for tiny ratios', () => {
    expect(nearestLabel(buckets, 0.17)).toBe('S');
  });

  it('snaps to L for ratios near the top bucket', () => {
    expect(nearestLabel(buckets, 0.29)).toBe('L');
  });

  it('defaults to M when no buckets exist', () => {
    expect(nearestLabel([], 0.25)).toBe('M');
  });
});
