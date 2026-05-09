import type QRCodeStyling from 'qr-code-styling';

export function sanitizeFilename(input: string, fallback: string): string {
  const cleaned = input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 30)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || fallback;
}

export function defaultFilename(content: string): string {
  const base = sanitizeFilename(content, `aliv-qrcode-${Date.now()}`);
  return base;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPng(qr: QRCodeStyling, filename: string): Promise<void> {
  const data = await qr.getRawData('png');
  if (!data) throw new Error('Could not generate PNG.');
  const blob = data instanceof Blob ? data : new Blob([data as unknown as ArrayBuffer], { type: 'image/png' });
  triggerDownload(blob, `${filename}.png`);
}

export async function downloadSvg(qr: QRCodeStyling, filename: string): Promise<void> {
  const data = await qr.getRawData('svg');
  if (!data) throw new Error('Could not generate SVG.');
  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: 'image/svg+xml' });
  } else {
    blob = new Blob([data as unknown as ArrayBuffer], { type: 'image/svg+xml' });
  }
  triggerDownload(blob, `${filename}.svg`);
}

export async function copyPngToClipboard(qr: QRCodeStyling): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) return false;
  const data = await qr.getRawData('png');
  if (!data) return false;
  const blob = data instanceof Blob ? data : new Blob([data as unknown as ArrayBuffer], { type: 'image/png' });
  try {
    const ClipboardItemCtor = (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
    if (!ClipboardItemCtor) return false;
    await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}
