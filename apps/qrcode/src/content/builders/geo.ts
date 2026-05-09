import type { BuildResult } from '../types';

export function buildGeo(lat: number, lon: number, label?: string): BuildResult {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: 'Latitude must be between -90 and 90.' };
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { ok: false, error: 'Longitude must be between -180 and 180.' };
  }
  const base = `geo:${lat},${lon}`;
  if (label) {
    const params = new URLSearchParams({ q: label });
    return { ok: true, value: `${base}?${params.toString()}` };
  }
  return { ok: true, value: base };
}
