import type { BuildResult } from '../types';

function escapeVcard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

interface VCardData {
  firstName: string;
  lastName: string;
  org?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
  address?: string;
}

export function buildVCard(data: VCardData): BuildResult {
  if (!data.firstName && !data.lastName) {
    return { ok: false, error: 'First or last name is required.' };
  }
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  const fn = `${data.firstName} ${data.lastName}`.trim();
  lines.push(`N:${escapeVcard(data.lastName)};${escapeVcard(data.firstName)};;;`);
  lines.push(`FN:${escapeVcard(fn)}`);
  if (data.org) lines.push(`ORG:${escapeVcard(data.org)}`);
  if (data.title) lines.push(`TITLE:${escapeVcard(data.title)}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${escapeVcard(data.phone)}`);
  if (data.email) lines.push(`EMAIL:${escapeVcard(data.email)}`);
  if (data.url) lines.push(`URL:${escapeVcard(data.url)}`);
  if (data.address) lines.push(`ADR;TYPE=HOME:;;${escapeVcard(data.address)};;;;`);
  lines.push('END:VCARD');
  return { ok: true, value: lines.join('\r\n') };
}
