import { describe, expect, it } from 'vitest';
import { computeLogoSizeBuckets, nearestBucketIndex } from '../lib/logo-size';

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
