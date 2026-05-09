import type { BuildResult } from '../types';

export function buildSms(phone: string, body?: string): BuildResult {
  if (!phone) return { ok: false, error: 'Phone number is required.' };
  const cleaned = phone.replace(/[\s()-]/g, '');
  if (!/^\+?[0-9]+$/.test(cleaned)) return { ok: false, error: 'Invalid phone number.' };
  const params = new URLSearchParams();
  if (body) params.set('body', body);
  const query = params.toString();
  return { ok: true, value: `sms:${cleaned}${query ? `?${query}` : ''}` };
}
