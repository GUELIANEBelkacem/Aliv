import { describe, expect, it, vi } from 'vitest';
import { sanitizeFilename, defaultFilename, downloadPng, downloadSvg, copyPngToClipboard } from '../lib/export';

describe('sanitizeFilename', () => {
  it('replaces forbidden filesystem chars with hyphens', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j', 'fb')).toMatch(/^a-b-c-d-e-f-g-h-i-j$/);
  });

  it('collapses runs of hyphens and trims edges', () => {
    expect(sanitizeFilename('---x---', 'fb')).toBe('x');
  });

  it('caps to 30 chars', () => {
    const long = 'a'.repeat(50);
    expect(sanitizeFilename(long, 'fb').length).toBeLessThanOrEqual(30);
  });

  it('falls back when input is empty after sanitization', () => {
    expect(sanitizeFilename('   ', 'fallback')).toBe('fallback');
  });
});

describe('defaultFilename', () => {
  it('derives a filename from content', () => {
    expect(defaultFilename('https://example.com/path')).toMatch(/example/);
  });
});

describe('downloadPng / downloadSvg', () => {
  function fakeQr(data: Blob | string | null): unknown {
    return { getRawData: vi.fn().mockResolvedValue(data) };
  }

  it('downloadPng calls click() with object URL', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await downloadPng(fakeQr(blob) as never, 'test');
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('downloadSvg accepts a string blob', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await downloadSvg(fakeQr('<svg/>') as never, 'test');
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('downloadPng throws when getRawData returns null', async () => {
    await expect(downloadPng(fakeQr(null) as never, 't')).rejects.toThrow();
  });
});

describe('copyPngToClipboard', () => {
  it('returns false when clipboard.write is missing', async () => {
    const orig = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const result = await copyPngToClipboard({ getRawData: vi.fn() } as never);
    expect(result).toBe(false);
    Object.defineProperty(navigator, 'clipboard', { value: orig, configurable: true });
  });

  it('returns true when clipboard.write succeeds', async () => {
    const ClipboardItemMock = function (this: { types: string[] }, _items: Record<string, Blob>) {
      this.types = Object.keys(_items);
    } as unknown as typeof ClipboardItem;
    Object.defineProperty(globalThis, 'ClipboardItem', { value: ClipboardItemMock, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const blob = new Blob(['x'], { type: 'image/png' });
    const result = await copyPngToClipboard({ getRawData: vi.fn().mockResolvedValue(blob) } as never);
    expect(result).toBe(true);
  });
});
