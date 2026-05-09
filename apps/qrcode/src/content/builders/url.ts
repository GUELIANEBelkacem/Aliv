import type { BuildResult } from '../types';

export function buildUrl(url: string): BuildResult {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, error: 'URL is required.' };
  if (/^mailto:/i.test(trimmed)) return { ok: false, error: 'Use the Email tab for mailto: links.' };
  if (/^tel:/i.test(trimmed)) return { ok: false, error: 'Use the Phone tab for tel: links.' };
  if (/^[a-z][a-z0-9+\-.]*:/i.test(trimmed)) return { ok: true, value: trimmed };
  return { ok: true, value: `https://${trimmed}` };
}
