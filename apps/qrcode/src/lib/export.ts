import QRCodeStyling from 'qr-code-styling';
import { toStylingOptions } from './qr-engine';
import { frameLayout, composeFramedSvg, type FrameLayout } from './frame-shapes';
import type { QrOptions } from './types';

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
  return sanitizeFilename(content, `aliv-qrcode-${Date.now()}`);
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

// Each export builds a fresh QRCodeStyling instance from the source options so
// the live preview is never mutated by a resolution change (REVIEW §1.1). The
// frame is then composed on top so the file matches what users see (§8.4).
function buildExportInstance(options: QrOptions, qrSize: number): QRCodeStyling {
  const styling = toStylingOptions({ ...options, size: qrSize });
  return new QRCodeStyling(styling);
}

async function getQrSvgString(options: QrOptions, qrSize: number): Promise<string> {
  const qr = buildExportInstance(options, qrSize);
  const data = await qr.getRawData('svg');
  if (!data) throw new Error('Could not generate SVG.');
  if (typeof data === 'string') return data;
  if (data instanceof Blob) return await data.text();
  return new TextDecoder().decode(data as unknown as ArrayBuffer);
}

async function composeForExport(options: QrOptions, totalSize: number): Promise<{ svg: string; layout: FrameLayout }> {
  const layout = frameLayout(options.frameShape, totalSize, options.background.color);
  const qrSvg = await getQrSvgString(options, layout.qr.size);
  return { svg: composeFramedSvg(qrSvg, layout), layout };
}

function rasterizeSvgToPng(svg: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) reject(new Error('Canvas toBlob failed.'));
        else resolve(blob);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG → PNG rasterisation failed.'));
    };
    img.src = url;
  });
}

export async function exportPng(
  options: QrOptions,
  resolution: number,
  filename: string,
): Promise<void> {
  const { svg } = await composeForExport(options, resolution);
  const blob = await rasterizeSvgToPng(svg, resolution, resolution);
  triggerDownload(blob, `${filename}.png`);
}

export async function exportSvg(options: QrOptions, filename: string): Promise<void> {
  const { svg } = await composeForExport(options, options.size);
  triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${filename}.svg`);
}

export async function copyPngFromOptions(options: QrOptions): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) return false;
  const ClipboardItemCtor = (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  if (!ClipboardItemCtor) return false;
  try {
    const { svg } = await composeForExport(options, options.size);
    const blob = await rasterizeSvgToPng(svg, options.size, options.size);
    await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}
