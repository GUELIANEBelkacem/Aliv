import type { BuildResult } from '../types';

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function nowDtStamp(): string {
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function randomUid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${crypto.randomUUID()}@aliv`;
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@aliv`;
}

interface CalendarData {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export function buildCalendar(data: CalendarData): BuildResult {
  if (!data.title) return { ok: false, error: 'Title is required.' };
  const start = toIcsDate(data.start);
  const end = toIcsDate(data.end);
  if (!start) return { ok: false, error: 'Invalid start date.' };
  if (!end) return { ok: false, error: 'Invalid end date.' };
  if (new Date(data.end).getTime() < new Date(data.start).getTime()) {
    return { ok: false, error: 'End date must be after start date.' };
  }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aliv//qrcode//EN',
    'BEGIN:VEVENT',
    `UID:${randomUid()}`,
    `DTSTAMP:${nowDtStamp()}`,
    `SUMMARY:${escapeIcs(data.title)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
  ];
  if (data.description) lines.push(`DESCRIPTION:${escapeIcs(data.description)}`);
  if (data.location) lines.push(`LOCATION:${escapeIcs(data.location)}`);
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  return { ok: true, value: lines.join('\r\n') };
}
