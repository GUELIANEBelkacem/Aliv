import { describe, expect, it } from 'vitest';
import { isValidHex, hexToRgb, contrastRatio, expandHex, averageColor } from '../lib/color-utils';

describe('isValidHex', () => {
  it('accepts 6-digit hex', () => {
    expect(isValidHex('#abcdef')).toBe(true);
    expect(isValidHex('#123456')).toBe(true);
    expect(isValidHex('#FFFFFF')).toBe(true);
  });

  it('accepts 3-digit hex', () => {
    expect(isValidHex('#abc')).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isValidHex('abcdef')).toBe(false);
    expect(isValidHex('#xyzxyz')).toBe(false);
    expect(isValidHex('#1234')).toBe(false);
    expect(isValidHex('')).toBe(false);
  });
});

describe('expandHex', () => {
  it('expands 3-digit to 6-digit', () => {
    expect(expandHex('#abc')).toBe('#aabbcc');
  });

  it('passes 6-digit through', () => {
    expect(expandHex('#aabbcc')).toBe('#aabbcc');
  });
});

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-digit hex via expansion', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('not-a-hex')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('white on white is 1:1', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });

  it('matches a known WCAG mid value within 0.5', () => {
    // #767676 vs #ffffff is ~4.54 per WCAG.
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThan(4);
    expect(contrastRatio('#767676', '#ffffff')).toBeLessThan(5);
  });
});

describe('averageColor', () => {
  it('averages two hex colors channel-wise', () => {
    expect(averageColor('#000000', '#ffffff')).toBe('#808080');
  });

  it('handles 3-digit input', () => {
    expect(averageColor('#000', '#fff')).toBe('#808080');
  });
});
