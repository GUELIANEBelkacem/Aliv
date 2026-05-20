import type { FrameShape } from './types';

export interface FrameLayout {
  /** Total canvas side (matches options.size). */
  total: number;
  /** Position + side of the inscribed QR square. */
  qr: { x: number; y: number; size: number };
  /** Backdrop shape behind the QR, or null for 'none'. */
  backdrop:
    | { kind: 'rect'; rx: number; fill: string }
    | { kind: 'circle'; fill: string }
    | null;
}

/**
 * Resolve where the QR data area sits inside a frame of the chosen shape and
 * what backdrop to paint behind it. The QR stays square; the frame contains
 * (or thinly borders) it. For 'circle', the QR side shrinks to the inscribed
 * square (≈ size / √2) so the corners don't poke out of the disc.
 */
export function frameLayout(
  shape: FrameShape,
  size: number,
  bgColor: string,
): FrameLayout {
  if (shape === 'none') {
    return { total: size, qr: { x: 0, y: 0, size }, backdrop: null };
  }
  if (shape === 'circle') {
    const inner = Math.floor(size / Math.SQRT2) - 4;
    const xy = (size - inner) / 2;
    return {
      total: size,
      qr: { x: xy, y: xy, size: inner },
      backdrop: { kind: 'circle', fill: bgColor },
    };
  }
  const padding = Math.round(size * 0.06);
  const inner = size - 2 * padding;
  const rx = shape === 'rounded' ? Math.round(size * 0.12) : Math.round(size * 0.02);
  return {
    total: size,
    qr: { x: padding, y: padding, size: inner },
    backdrop: { kind: 'rect', rx, fill: bgColor },
  };
}

/**
 * Compose an outer SVG that wraps the QR's own SVG with the chosen frame.
 * Used by export so the file matches what the user sees in the preview
 * (REVIEW §8.4).
 */
export function composeFramedSvg(qrSvg: string, layout: FrameLayout): string {
  const inner = qrSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
  const widthMatch = qrSvg.match(/<svg[^>]*\bwidth="([^"]+)"/);
  const heightMatch = qrSvg.match(/<svg[^>]*\bheight="([^"]+)"/);
  const viewBox = viewBoxMatch?.[1]
    ?? `0 0 ${widthMatch?.[1] ?? layout.qr.size} ${heightMatch?.[1] ?? layout.qr.size}`;
  const [vbX, vbY, vbW] = viewBox.split(/\s+/).map(Number);
  const scale = layout.qr.size / vbW;
  const tx = layout.qr.x - vbX * scale;
  const ty = layout.qr.y - vbY * scale;

  let backdrop = '';
  if (layout.backdrop?.kind === 'circle') {
    const c = layout.total / 2;
    backdrop = `<circle cx="${c}" cy="${c}" r="${c}" fill="${layout.backdrop.fill}"/>`;
  } else if (layout.backdrop?.kind === 'rect') {
    backdrop = `<rect x="0" y="0" width="${layout.total}" height="${layout.total}" rx="${layout.backdrop.rx}" ry="${layout.backdrop.rx}" fill="${layout.backdrop.fill}"/>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.total}" height="${layout.total}" viewBox="0 0 ${layout.total} ${layout.total}">`
    + backdrop
    + `<g transform="translate(${tx},${ty}) scale(${scale})">${inner}</g>`
    + `</svg>`
  );
}
