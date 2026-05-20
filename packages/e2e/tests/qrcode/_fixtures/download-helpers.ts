import type { Download, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

export async function captureDownload(
  page: Page,
  trigger: () => Promise<void>,
): Promise<{ filename: string; buffer: Buffer }> {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const buffer = await downloadToBuffer(download);
  return { filename: download.suggestedFilename(), buffer };
}

async function downloadToBuffer(download: Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error('download.path() returned null');
  return await readFile(path);
}

/**
 * Parse the width/height fields out of a PNG IHDR chunk.
 * PNG signature (8 bytes) + IHDR length (4) + 'IHDR' (4) + width (4) + height (4).
 */
export function pngDimensions(buffer: Buffer): { width: number; height: number } {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(sig)) {
    throw new Error('Not a PNG buffer (signature mismatch)');
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

export function isPng(buffer: Buffer): boolean {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return buffer.subarray(0, 8).equals(sig);
}

export function isSvg(buffer: Buffer): boolean {
  const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 512)).trim();
  return text.startsWith('<?xml') || text.startsWith('<svg');
}
