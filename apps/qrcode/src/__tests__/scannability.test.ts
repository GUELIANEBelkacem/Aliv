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

  it('reports the worst gradient stop, not the average', () => {
    // Gradient from white to black on white background. The *average*
    // (#808080) has ~3.95:1 contrast and would have passed the old check,
    // but the white stop is literally invisible against the background.
    // The fix is to take the worst-of-stops contrast.
    const result = assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'linear-gradient', stops: ['#ffffff', '#000000'], angle: 0 },
      background: { type: 'solid', color: '#ffffff' },
    });
    expect(result.level).toBe('fail');
    expect(result.messages[0]).toMatch(/gradient stop/i);
  });

  it('flags a gradient-derived eye colour even without explicit eyeColor', () => {
    // qr-engine paints the eye in `stops[0]` when no eyeColor is set.
    // Gradient white → dark blue, no eyeColor: eye renders white-on-white
    // (invisible). Previously the eye check was gated behind
    // `if (opts.eyeColor)` and missed this entirely.
    const result = assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'linear-gradient', stops: ['#ffffff', '#000040'], angle: 0 },
      background: { type: 'solid', color: '#ffffff' },
    });
    expect(result.level).toBe('fail');
    expect(result.messages.some((m) => /eye-marker/i.test(m))).toBe(true);
  });

  it('inherits eye colour from a solid foreground when eyeColor is unset', () => {
    // Solid black foreground, no eyeColor → eye should inherit black and pass.
    const result = assess({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#000000' },
      background: { type: 'solid', color: '#ffffff' },
    });
    expect(result.level).toBe('ok');
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

  it('large padding (>15 %) with EC below H is warn', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      margin: 50, // 50/280 ≈ 17.9 %
      errorCorrection: 'M',
    }).level).toBe('warn');
  });

  it('moderate padding (>10 %) with EC=M is warn (recommends Q)', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      margin: 30, // 30/280 ≈ 10.7 %
      errorCorrection: 'M',
    }).level).toBe('warn');
  });

  it('large padding with EC=H is ok', () => {
    expect(assess({
      ...DEFAULT_QR_OPTIONS,
      margin: 50,
      errorCorrection: 'H',
    }).level).toBe('ok');
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
