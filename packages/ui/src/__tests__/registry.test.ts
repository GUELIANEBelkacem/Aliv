import { describe, expect, it } from 'vitest';
import { APPS, appUrl, getApp } from '../registry/app-registry';

describe('app registry', () => {
  it('has unique ids', () => {
    const ids = APPS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every app has a valid 7-char hex accent', () => {
    for (const app of APPS) {
      expect(app.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('every app has a non-empty name and tagline', () => {
    for (const app of APPS) {
      expect(app.name.length).toBeGreaterThan(0);
      expect(app.tagline.length).toBeGreaterThan(0);
    }
  });

  it('appUrl returns apex for empty subdomain', () => {
    const apex = APPS.find((a) => a.subdomain === '')!;
    expect(appUrl(apex, 'aliv.test')).toBe('https://aliv.test');
  });

  it('appUrl returns subdomain for non-empty subdomain', () => {
    const sub = APPS.find((a) => a.id === 'json-xml')!;
    expect(appUrl(sub, 'aliv.test')).toBe('https://jsonxml.aliv.test');
  });

  it('getApp throws on unknown id', () => {
    // @ts-expect-error testing runtime error
    expect(() => getApp('does-not-exist')).toThrow();
  });

  it('getApp returns the matching app', () => {
    expect(getApp('qrcode').name).toBe('QR Generator');
  });
});
