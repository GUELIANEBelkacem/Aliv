import { describe, expect, it } from 'vitest';
import { toStylingOptions } from '../lib/qr-engine';
import { DEFAULT_QR_OPTIONS } from '../lib/types';

describe('toStylingOptions', () => {
  it('passes data through', () => {
    const opts = toStylingOptions({ ...DEFAULT_QR_OPTIONS, data: 'hello' });
    expect(opts.data).toBe('hello');
  });

  it('falls back to a single space when data is empty', () => {
    const opts = toStylingOptions({ ...DEFAULT_QR_OPTIONS, data: '' });
    expect(opts.data).toBe(' ');
  });

  it('maps every error correction level through', () => {
    for (const level of ['L', 'M', 'Q', 'H'] as const) {
      const opts = toStylingOptions({ ...DEFAULT_QR_OPTIONS, errorCorrection: level });
      expect(opts.qrOptions?.errorCorrectionLevel).toBe(level);
    }
  });

  it('maps a solid foreground to dotsOptions.color', () => {
    const opts = toStylingOptions({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#ff0000' },
    });
    expect(opts.dotsOptions?.color).toBe('#ff0000');
    expect(opts.dotsOptions?.gradient).toBeUndefined();
  });

  it('maps a linear gradient with angle to a rotation in radians', () => {
    const opts = toStylingOptions({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'linear-gradient', stops: ['#000', '#fff'], angle: 90 },
    });
    expect(opts.dotsOptions?.gradient?.type).toBe('linear');
    expect(opts.dotsOptions?.gradient?.rotation).toBeCloseTo(Math.PI / 2, 5);
    expect(opts.dotsOptions?.gradient?.colorStops?.[0].color).toBe('#000');
  });

  it('maps a radial gradient', () => {
    const opts = toStylingOptions({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'radial-gradient', stops: ['#000', '#fff'] },
    });
    expect(opts.dotsOptions?.gradient?.type).toBe('radial');
  });

  it('maps each module shape', () => {
    const shapes = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'] as const;
    for (const moduleShape of shapes) {
      const opts = toStylingOptions({ ...DEFAULT_QR_OPTIONS, moduleShape });
      expect(opts.dotsOptions?.type).toBeDefined();
    }
  });

  it('uses eyeColor override when provided', () => {
    const opts = toStylingOptions({ ...DEFAULT_QR_OPTIONS, eyeColor: '#abcdef' });
    expect(opts.cornersSquareOptions?.color).toBe('#abcdef');
    expect(opts.cornersDotOptions?.color).toBe('#abcdef');
  });

  it('falls back to foreground color when no eyeColor override', () => {
    const opts = toStylingOptions({
      ...DEFAULT_QR_OPTIONS,
      foreground: { type: 'solid', color: '#123456' },
    });
    expect(opts.cornersSquareOptions?.color).toBe('#123456');
  });

  it('attaches a logo image when provided', () => {
    const opts = toStylingOptions({
      ...DEFAULT_QR_OPTIONS,
      logo: { src: 'data:image/png;base64,abc', size: 'M', sizeRatio: 0.2, padding: 4, shape: 'square' },
    });
    expect(opts.image).toBe('data:image/png;base64,abc');
    expect(opts.imageOptions?.imageSize).toBe(0.2);
    expect(opts.imageOptions?.margin).toBe(4);
  });

  it('omits image when logo is unset', () => {
    const opts = toStylingOptions(DEFAULT_QR_OPTIONS);
    expect(opts.image).toBeUndefined();
  });

  it('passes size and margin through', () => {
    const opts = toStylingOptions({ ...DEFAULT_QR_OPTIONS, size: 320, margin: 8 });
    expect(opts.width).toBe(320);
    expect(opts.height).toBe(320);
    expect(opts.margin).toBe(8);
  });
});
