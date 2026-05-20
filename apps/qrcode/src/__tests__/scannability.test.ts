import { describe, expect, it } from 'vitest';
import { assess } from '../lib/scannability';
import { DEFAULT_QR_OPTIONS } from '../lib/types';

describe('assess scannability', () => {
  it('black on white is ok', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#000000' },
      background: { type: 'solid', color: '#ffffff' },
    }).level).toBe('ok');
  });

  it('white on white is fail', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#ffffff' },
      background: { type: 'solid', color: '#ffffff' },
    }).level).toBe('fail');
  });

  it('light grey on white is warn', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#bbbbbb' },
      background: { type: 'solid', color: '#ffffff' },
    }).level).toBe('warn');
  });

  it('uses gradient average for contrast', () => {
    const result = assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'linear-gradient', stops: ['#ffffff', '#ffffff'], angle: 0 },
      background: { type: 'solid', color: '#ffffff' },
    });
    expect(result.level).toBe('fail');
  });

  it('large logo with low EC is warn', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      logo: { src: 'data:image/png;base64,a', size: 'XL', sizeRatio: 0.4, padding: 4, shape: 'square' },
      errorCorrection: 'L',
    }).level).toBe('warn');
  });

  it('large logo with EC=H is ok', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      logo: { src: 'data:image/png;base64,a', size: 'XL', sizeRatio: 0.4, padding: 4, shape: 'square' },
      errorCorrection: 'H',
    }).level).toBe('ok');
  });

  it('eye color matching background is fail', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#000000' },
      background: { type: 'solid', color: '#ffffff' },
      eyeColor: '#ffffff',
    }).level).toBe('fail');
  });

  it('messages are populated for non-ok results', () => {
    const result = assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#ffffff' },
      background: { type: 'solid', color: '#ffffff' },
    });
    expect(result.messages.length).toBeGreaterThan(0);
  });
});
