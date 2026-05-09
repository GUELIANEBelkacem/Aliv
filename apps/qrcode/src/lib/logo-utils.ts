export const ALLOWED_LOGO_MIMES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

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
