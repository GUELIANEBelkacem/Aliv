import type { AppDefinition, AppId } from './types';

export const APPS: AppDefinition[] = [
  { id: 'web',      name: 'Aliv',         tagline: 'Privacy-first dev utilities', subdomain: '',        accent: '#4ade80' },
  { id: 'json-xml', name: 'JSON ↔ XML', tagline: 'Convert and validate',      subdomain: 'jsonxml',  accent: '#7c8cf5' },
  { id: 'qrcode',   name: 'QR Generator', tagline: 'Customizable QR codes',        subdomain: 'qrgen',    accent: '#22d3ee' },
  { id: 'hashgen',  name: 'Hash',         tagline: 'Multi-algorithm hasher',       subdomain: 'hashgen', accent: '#f59e0b', comingSoon: true },
];

const DEV_PORTS: Record<AppId, number> = {
  'web': 5175,
  'json-xml': 5173,
  'qrcode': 5174,
  'hashgen': 5176,
};

function isDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

export function appUrl(app: AppDefinition, tld = 'aliv-kit.app'): string {
  if (isDevHost()) {
    return `http://localhost:${DEV_PORTS[app.id]}`;
  }
  return app.subdomain ? `https://${app.subdomain}.${tld}` : `https://${tld}`;
}

export function getApp(id: AppDefinition['id']): AppDefinition {
  const app = APPS.find((a) => a.id === id);
  if (!app) throw new Error(`Unknown app id: ${id}`);
  return app;
}
