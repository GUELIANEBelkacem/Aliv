export const ALLOWED_LOGO_MIMES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export interface LogoLoadResult {
  ok: boolean;
  dataUrl?: string;
  error?: string;
}

export async function loadLogoFile(file: File): Promise<LogoLoadResult> {
  if (!ALLOWED_LOGO_MIMES.includes(file.type)) {
    return { ok: false, error: 'Unsupported file type. Use PNG, SVG, JPEG, or WebP.' };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: 'Logo too large (max 2 MB).' };
  }
  const dataUrl = await readAsDataUrl(file);
  if (file.type === 'image/svg+xml') {
    const text = await readAsText(file);
    if (/<script|<foreignObject|xlink:href\s*=\s*["']https?:/i.test(text)) {
      return { ok: false, error: 'SVG contains scripts or external references.' };
    }
  }
  return { ok: true, dataUrl };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Clips a logo to a square / rounded / circle frame by drawing it to a canvas
 * with a clip path. qr-code-styling itself can't clip the embedded image, so
 * we pre-process the source.
 */
export async function clipLogoToShape(
  src: string,
  shape: 'square' | 'rounded' | 'circle',
  bg?: string,
): Promise<string> {
  if (shape === 'square' && !bg) return src;
  const img = await loadImage(src);
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }

  ctx.save();
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
  } else if (shape === 'rounded') {
    const r = size * 0.22;
    pathRoundedRect(ctx, 0, 0, size, size, r);
    ctx.clip();
  }

  // Cover-fit (preserve aspect ratio, fill the canvas).
  const ratio = Math.max(size / img.width, size / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  const dx = (size - w) / 2;
  const dy = (size - h) / 2;
  ctx.drawImage(img, dx, dy, w, h);
  ctx.restore();
  return canvas.toDataURL('image/png');
}

function pathRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
