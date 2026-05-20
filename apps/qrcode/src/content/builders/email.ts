import type { BuildResult } from '../types';

export function buildEmail(to: string, subject?: string, body?: string): BuildResult {
  if (!to) return { ok: false, error: 'Recipient email is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: 'Invalid email address.' };
  }
  // Build the query manually with encodeURIComponent so spaces become %20.
  // URLSearchParams uses + for spaces, which some Mail apps take literally
  // (RFC 6068 requires %20 for mailto). REVIEW §1.5.
  const parts: string[] = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  const query = parts.join('&');
  return { ok: true, value: `mailto:${to}${query ? `?${query}` : ''}` };
}
