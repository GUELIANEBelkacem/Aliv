import { describe, expect, it } from 'vitest';
import { frameLayout, composeFramedSvg } from '../lib/frame-shapes';

describe('frameLayout', () => {
  it('none: QR fills the whole canvas, no backdrop', () => {
    const layout = frameLayout('none', 280, '#ffffff');
    expect(layout.total).toBe(280);
    expect(layout.qr).toEqual({ x: 0, y: 0, size: 280 });
    expect(layout.backdrop).toBeNull();
  });

  it('square: pads the QR with a small inset and a rect backdrop', () => {
    const layout = frameLayout('square', 280, '#ffffff');
    expect(layout.total).toBe(280);
    expect(layout.qr.size).toBeLessThan(280);
    expect(layout.backdrop).toMatchObject({ kind: 'rect', fill: '#ffffff' });
  });

  it('rounded: larger corner radius than square', () => {
    const square = frameLayout('square', 280, '#fff');
    const rounded = frameLayout('rounded', 280, '#fff');
    if (square.backdrop?.kind !== 'rect' || rounded.backdrop?.kind !== 'rect') throw new Error();
    expect(rounded.backdrop.rx).toBeGreaterThan(square.backdrop.rx);
  });

  it('circle: QR side fits the inscribed square (≤ size / √2)', () => {
    const layout = frameLayout('circle', 280, '#ffffff');
    expect(layout.qr.size).toBeLessThanOrEqual(Math.floor(280 / Math.SQRT2));
    expect(layout.backdrop).toMatchObject({ kind: 'circle', fill: '#ffffff' });
    // Centered
    expect(layout.qr.x).toBe((280 - layout.qr.size) / 2);
    expect(layout.qr.y).toBe(layout.qr.x);
  });
});

describe('composeFramedSvg', () => {
  const qrSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><rect x="10" y="10" width="20" height="20"/></svg>';

  it('wraps the QR in an outer SVG at the total size', () => {
    const layout = frameLayout('circle', 280, '#fff');
    const out = composeFramedSvg(qrSvg, layout);
    expect(out).toMatch(/<svg[^>]*width="280"[^>]*height="280"/);
    expect(out).toContain('<circle');
    expect(out).toContain('<g transform=');
  });

  it('emits a rect backdrop for square / rounded shapes', () => {
    const layout = frameLayout('rounded', 280, '#fafafa');
    const out = composeFramedSvg(qrSvg, layout);
    expect(out).toContain('<rect x="0" y="0"');
    expect(out).toMatch(/fill="#fafafa"/);
  });

  it('no backdrop for the none frame', () => {
    const layout = frameLayout('none', 280, '#fff');
    const out = composeFramedSvg(qrSvg, layout);
    expect(out).not.toContain('<circle');
    // The inner QR's own rects survive, but no leading backdrop rect at (0,0).
    expect(out.indexOf('<g transform=')).toBeLessThan(out.indexOf('<rect x="10"'));
  });

  it('declares xmlns:xlink so qr-code-styling logo references parse', () => {
    // qr-code-styling emits <image xlink:href="data:..."> for embedded logos.
    // Without the xlink namespace on the outer SVG the document is invalid →
    // both SVG download and PNG rasterisation fail.
    const layout = frameLayout('none', 280, '#fff');
    const out = composeFramedSvg(qrSvg, layout);
    expect(out).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });
});
