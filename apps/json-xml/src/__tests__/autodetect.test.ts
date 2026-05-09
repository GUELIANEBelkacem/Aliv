import { describe, it, expect } from 'vitest';
import { detectFormat } from '../hooks/useAutoDetect';

// ─── 6. detectFormat ────────────────────────────────────────────────

describe('detectFormat', () => {
  it('AD-1: starts with {', () => {
    expect(detectFormat('{"a":1}')).toBe('json');
  });

  it('AD-2: starts with [', () => {
    expect(detectFormat('[1,2]')).toBe('json');
  });

  it('AD-3: starts with <', () => {
    expect(detectFormat('<root/>')).toBe('xml');
  });

  it('AD-4: leading whitespace + {', () => {
    expect(detectFormat('  \n {"a":1}')).toBe('json');
  });

  it('AD-5: leading whitespace + <', () => {
    expect(detectFormat('  \n <root/>')).toBe('xml');
  });

  it('AD-6: starts with letter', () => {
    expect(detectFormat('hello')).toBe('unknown');
  });

  it('AD-7: starts with digit', () => {
    expect(detectFormat('123')).toBe('unknown');
  });

  it('AD-8: empty string', () => {
    expect(detectFormat('')).toBe('unknown');
  });

  it('AD-9: whitespace only', () => {
    expect(detectFormat('   ')).toBe('unknown');
  });

  it('AD-10: starts with quote (string literal)', () => {
    expect(detectFormat('"hello"')).toBe('unknown');
  });
});
