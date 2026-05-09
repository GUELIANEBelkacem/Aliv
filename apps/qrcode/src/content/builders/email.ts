import type { BuildResult } from '../types';

export function buildEmail(to: string, subject?: string, body?: string): BuildResult {
  if (!to) return { ok: false, error: 'Recipient email is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: 'Invalid email address.' };
  }
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  return { ok: true, value: `mailto:${to}${query ? `?${query}` : ''}` };
}
