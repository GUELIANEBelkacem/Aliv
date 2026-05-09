import type { BuildResult, WifiAuth } from '../types';

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export function buildWifi(ssid: string, password: string, auth: WifiAuth, hidden: boolean): BuildResult {
  if (!ssid) return { ok: false, error: 'SSID is required.' };
  if (auth !== 'nopass' && !password) return { ok: false, error: 'Password is required for WPA/WEP.' };
  const parts = [
    `T:${auth}`,
    `S:${escapeWifi(ssid)}`,
  ];
  if (auth !== 'nopass') parts.push(`P:${escapeWifi(password)}`);
  if (hidden) parts.push('H:true');
  return { ok: true, value: `WIFI:${parts.join(';')};;` };
}
