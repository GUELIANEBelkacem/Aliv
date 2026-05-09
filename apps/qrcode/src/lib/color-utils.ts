export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value) || /^#[0-9a-fA-F]{3}$/.test(value);
}

export function expandHex(value: string): string {
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return '#' + value.slice(1).split('').map((c) => c + c).join('');
  }
  return value;
}

export function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  const v = expandHex(value);
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(v);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return 0;
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const [light, dark] = lA > lB ? [lA, lB] : [lB, lA];
  return (light + 0.05) / (dark + 0.05);
}

export function averageColor(a: string, b: string): string {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return a;
  const r = Math.round((rgbA.r + rgbB.r) / 2);
  const g = Math.round((rgbA.g + rgbB.g) / 2);
  const bb = Math.round((rgbA.b + rgbB.b) / 2);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(bb)}`;
}
