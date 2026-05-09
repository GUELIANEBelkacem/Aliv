import type { AppDefinition } from './types';

export const APPS: AppDefinition[] = [
  { id: 'web',      name: 'Aliv',         tagline: 'Privacy-first dev utilities', subdomain: '',        accent: '#4ade80' },
  { id: 'json-xml', name: 'JSON ↔ XML', tagline: 'Convert and validate',      subdomain: 'jsonxml', accent: '#7c8cf5' },
  { id: 'qrcode',   name: 'QR Generator', tagline: 'Customizable QR codes',        subdomain: 'qrcode',  accent: '#22d3ee' },
  { id: 'hashgen',  name: 'Hash',         tagline: 'Multi-algorithm hasher',       subdomain: 'hashgen', accent: '#f59e0b', comingSoon: true },
];

export function appUrl(app: AppDefinition, tld = 'aliv.local'): string {
  return app.subdomain ? `https://${app.subdomain}.${tld}` : `https://${tld}`;
}

export function getApp(id: AppDefinition['id']): AppDefinition {
  const app = APPS.find((a) => a.id === id);
  if (!app) throw new Error(`Unknown app id: ${id}`);
  return app;
}
