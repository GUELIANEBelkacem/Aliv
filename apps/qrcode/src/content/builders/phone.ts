import type { BuildResult } from '../types';

export function buildPhone(phone: string): BuildResult {
  if (!phone) return { ok: false, error: 'Phone number is required.' };
  const cleaned = phone.replace(/[\s()-]/g, '');
  if (!/^\+?[0-9]+$/.test(cleaned)) return { ok: false, error: 'Invalid phone number.' };
  return { ok: true, value: `tel:${cleaned}` };
}
