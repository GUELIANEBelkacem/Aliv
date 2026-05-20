import { describe, expect, it } from 'vitest';
import { sanitizeFilename, defaultFilename } from '../lib/export';

describe('sanitizeFilename', () => {
  it('replaces forbidden filesystem chars with hyphens', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j', 'fb')).toMatch(/^a-b-c-d-e-f-g-h-i-j$/);
  });

  it('collapses runs of hyphens and trims edges', () => {
    expect(sanitizeFilename('---x---', 'fb')).toBe('x');
  });

  it('caps to 30 chars', () => {
    const long = 'a'.repeat(50);
    expect(sanitizeFilename(long, 'fb').length).toBeLessThanOrEqual(30);
  });

  it('falls back when input is empty after sanitization', () => {
    expect(sanitizeFilename('   ', 'fallback')).toBe('fallback');
  });
});

describe('defaultFilename', () => {
  it('derives a filename from content', () => {
    expect(defaultFilename('https://example.com/path')).toMatch(/example/);
  });
});
