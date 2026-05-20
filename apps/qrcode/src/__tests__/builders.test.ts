import { describe, expect, it } from 'vitest';
import {
  buildText, buildUrl, buildWifi, buildVCard, buildEmail, buildSms, buildPhone, buildGeo, buildCalendar, buildContent,
} from '../content/builders';

describe('buildText', () => {
  it('passes input through', () => {
    expect(buildText('hello').value).toBe('hello');
  });

  it('accepts empty string', () => {
    expect(buildText('').ok).toBe(true);
  });
});

describe('buildUrl', () => {
  it('prepends https:// when missing scheme', () => {
    expect(buildUrl('example.com').value).toBe('https://example.com');
  });

  it('passes http:// through', () => {
    expect(buildUrl('http://example.com').value).toBe('http://example.com');
  });

  it('passes https:// through', () => {
    expect(buildUrl('https://example.com/path?q=1').value).toBe('https://example.com/path?q=1');
  });

  it('rejects empty url', () => {
    expect(buildUrl('  ').ok).toBe(false);
  });

  it('rejects mailto: with helpful error', () => {
    const r = buildUrl('mailto:test@example.com');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Email tab/);
  });

  it('rejects tel: with helpful error', () => {
    const r = buildUrl('tel:+15551234');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Phone tab/);
  });

  it('passes other valid schemes through (e.g. ftp)', () => {
    expect(buildUrl('ftp://files.example.com').value).toBe('ftp://files.example.com');
  });
});

describe('buildWifi', () => {
  it('builds a basic WPA payload', () => {
    expect(buildWifi('Home', 'pass', 'WPA', false).value).toBe('WIFI:T:WPA;S:Home;P:pass;;');
  });

  it('omits password for nopass auth', () => {
    expect(buildWifi('Open', '', 'nopass', false).value).toBe('WIFI:T:nopass;S:Open;;');
  });

  it('appends H:true when hidden', () => {
    expect(buildWifi('Hidden', 'pass', 'WPA', true).value).toBe('WIFI:T:WPA;S:Hidden;P:pass;H:true;;');
  });

  it('escapes backslash, semicolon, comma, colon, quote in SSID', () => {
    const r = buildWifi('Net;w:o\\rk,"', 'pass', 'WPA', false);
    expect(r.value).toContain('S:Net\\;w\\:o\\\\rk\\,\\"');
  });

  it('escapes special chars in password', () => {
    const r = buildWifi('Net', 'p;s,s', 'WPA', false);
    expect(r.value).toContain('P:p\\;s\\,s');
  });

  it('rejects missing SSID', () => {
    expect(buildWifi('', 'pass', 'WPA', false).ok).toBe(false);
  });

  it('rejects missing password for WPA', () => {
    expect(buildWifi('Net', '', 'WPA', false).ok).toBe(false);
  });

  it('rejects missing password for WEP', () => {
    expect(buildWifi('Net', '', 'WEP', false).ok).toBe(false);
  });

  it('accepts missing password for nopass', () => {
    expect(buildWifi('Net', '', 'nopass', false).ok).toBe(true);
  });
});

describe('buildVCard', () => {
  it('builds a minimal vCard', () => {
    const r = buildVCard({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(r.value).toContain('BEGIN:VCARD');
    expect(r.value).toContain('VERSION:3.0');
    expect(r.value).toContain('FN:Ada Lovelace');
    expect(r.value).toContain('N:Lovelace;Ada;;;');
    expect(r.value).toContain('END:VCARD');
  });

  it('uses CRLF line breaks', () => {
    const r = buildVCard({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(r.value).toContain('\r\n');
  });

  it('includes optional fields', () => {
    const r = buildVCard({
      firstName: 'Ada', lastName: 'Lovelace',
      org: 'Difference Engine Co.', title: 'Programmer',
      phone: '+15551234', email: 'ada@example.com', url: 'https://ada.example.com',
      address: '1 Test St, London',
    });
    expect(r.value).toContain('ORG:Difference Engine Co.');
    expect(r.value).toContain('TEL;TYPE=CELL:+15551234');
    expect(r.value).toContain('EMAIL:ada@example.com');
    expect(r.value).toContain('URL:https://ada.example.com');
  });

  it('escapes special chars per RFC 6350', () => {
    const r = buildVCard({ firstName: 'A,B', lastName: 'C;D', org: 'Test\\Co' });
    expect(r.value).toContain('FN:A\\,B C\\;D');
    expect(r.value).toContain('ORG:Test\\\\Co');
  });

  it('rejects when both names empty', () => {
    expect(buildVCard({ firstName: '', lastName: '' }).ok).toBe(false);
  });
});

describe('buildEmail', () => {
  it('builds basic mailto', () => {
    expect(buildEmail('a@b.com').value).toBe('mailto:a@b.com');
  });

  it('encodes spaces as %20 (RFC 6068, not URLSearchParams + form-encoding)', () => {
    const r = buildEmail('a@b.com', 'Hi there', 'Body w/ space');
    expect(r.value).toContain('subject=Hi%20there');
    expect(r.value).toContain('body=Body%20w%2F%20space');
    expect(r.value).not.toMatch(/[+]/);
  });

  it('rejects missing recipient', () => {
    expect(buildEmail('').ok).toBe(false);
  });

  it('rejects malformed addresses', () => {
    expect(buildEmail('not-an-email').ok).toBe(false);
    expect(buildEmail('@example.com').ok).toBe(false);
  });
});

describe('buildSms', () => {
  it('strips formatting from phone', () => {
    expect(buildSms('+1 (555) 123-4567').value).toBe('sms:+15551234567');
  });

  it('appends body', () => {
    expect(buildSms('+15551234567', 'hello there').value).toContain('body=hello+there');
  });

  it('rejects letters in phone', () => {
    expect(buildSms('555abc').ok).toBe(false);
  });
});

describe('buildPhone', () => {
  it('strips formatting', () => {
    expect(buildPhone('+1 (555) 123-4567').value).toBe('tel:+15551234567');
  });

  it('passes plain digits', () => {
    expect(buildPhone('5551234567').value).toBe('tel:5551234567');
  });

  it('rejects empty', () => {
    expect(buildPhone('').ok).toBe(false);
  });
});

describe('buildGeo', () => {
  it('builds basic geo:', () => {
    expect(buildGeo(48.8566, 2.3522).value).toBe('geo:48.8566,2.3522');
  });

  it('appends label', () => {
    expect(buildGeo(48.8566, 2.3522, 'Paris').value).toContain('q=Paris');
  });

  it('rejects out-of-range latitude', () => {
    expect(buildGeo(91, 0).ok).toBe(false);
    expect(buildGeo(-91, 0).ok).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    expect(buildGeo(0, 181).ok).toBe(false);
    expect(buildGeo(0, -181).ok).toBe(false);
  });
});

describe('buildCalendar', () => {
  it('builds a VEVENT', () => {
    const r = buildCalendar({
      title: 'Demo',
      start: '2026-06-01T10:00:00Z',
      end: '2026-06-01T11:00:00Z',
    });
    expect(r.value).toContain('BEGIN:VEVENT');
    expect(r.value).toContain('SUMMARY:Demo');
    expect(r.value).toContain('DTSTART:20260601T100000Z');
    expect(r.value).toContain('DTEND:20260601T110000Z');
    expect(r.value).toContain('END:VEVENT');
  });

  it('rejects missing title', () => {
    expect(buildCalendar({ title: '', start: '2026-06-01T10:00Z', end: '2026-06-01T11:00Z' }).ok).toBe(false);
  });

  it('rejects invalid start date', () => {
    expect(buildCalendar({ title: 'X', start: 'not-a-date', end: '2026-06-01T11:00Z' }).ok).toBe(false);
  });

  it('escapes commas in description', () => {
    const r = buildCalendar({
      title: 'Demo',
      description: 'Bring a, b and c',
      start: '2026-06-01T10:00:00Z',
      end: '2026-06-01T11:00:00Z',
    });
    expect(r.value).toContain('DESCRIPTION:Bring a\\, b and c');
  });
});

describe('buildContent dispatcher', () => {
  it('routes text', () => {
    expect(buildContent({ type: 'text', text: 'x' }).value).toBe('x');
  });

  it('routes url', () => {
    expect(buildContent({ type: 'url', url: 'example.com' }).value).toBe('https://example.com');
  });

  it('routes wifi', () => {
    expect(buildContent({ type: 'wifi', ssid: 'X', password: 'Y', auth: 'WPA', hidden: false }).value).toContain('WIFI:T:WPA;S:X;P:Y;;');
  });

  it('routes phone', () => {
    expect(buildContent({ type: 'phone', phone: '+15551234' }).value).toBe('tel:+15551234');
  });
});
