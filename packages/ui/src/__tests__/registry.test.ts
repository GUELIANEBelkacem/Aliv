import { describe, expect, it, beforeEach, afterEach } from 'vitest';
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

  it('getApp throws on unknown id', () => {
    // @ts-expect-error testing runtime error
    expect(() => getApp('does-not-exist')).toThrow();
  });

  it('getApp returns the matching app', () => {
    expect(getApp('qrcode').name).toBe('QR Generator');
  });
});

describe('appUrl', () => {
  const originalLocation = window.location;

  function setHostname(hostname: string) {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('on a localhost dev host', () => {
    beforeEach(() => setHostname('localhost'));

    it('routes json-xml to its dev port', () => {
      expect(appUrl(getApp('json-xml'))).toBe('http://localhost:5173');
    });

    it('routes qrcode to its dev port', () => {
      expect(appUrl(getApp('qrcode'))).toBe('http://localhost:5174');
    });

    it('routes the platform landing to its dev port (subdomain="")', () => {
      expect(appUrl(getApp('web'))).toBe('http://localhost:5175');
    });

    it('treats 127.0.0.1 as a dev host', () => {
      setHostname('127.0.0.1');
      expect(appUrl(getApp('qrcode'))).toBe('http://localhost:5174');
    });
  });

  describe('on a production host', () => {
    beforeEach(() => setHostname('aliv.test'));

    it('returns the apex URL for an empty subdomain', () => {
      const apex = APPS.find((a) => a.subdomain === '')!;
      expect(appUrl(apex, 'aliv.test')).toBe('https://aliv.test');
    });

    it('returns the subdomain URL for a non-empty subdomain', () => {
      const sub = APPS.find((a) => a.id === 'json-xml')!;
      expect(appUrl(sub, 'aliv.test')).toBe('https://jsonxml.aliv.test');
    });
  });
});
