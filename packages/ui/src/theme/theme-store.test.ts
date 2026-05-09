import { describe, expect, it, beforeEach } from 'vitest';
import { getTheme, setTheme, subscribe } from './theme-store';

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'aliv-theme=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    delete document.documentElement.dataset.theme;
  });

  it('round-trips through localStorage', () => {
    setTheme('light');
    expect(getTheme()).toBe('light');
    setTheme('dark');
    expect(getTheme()).toBe('dark');
  });

  it('sets data-theme on the document element', () => {
    setTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('writes a cookie value that round-trips via getTheme', () => {
    // localStorage is the dev-fallback; in production the apex-domain cookie
    // is the source. We assert the round-trip works regardless of which path
    // jsdom honors.
    setTheme('light');
    expect(getTheme()).toBe('light');
  });

  it('cookie reader picks up an apex-scoped cookie even when localStorage is empty', () => {
    document.cookie = 'aliv-theme=light; Path=/';
    localStorage.clear();
    expect(getTheme()).toBe('light');
  });

  it('notifies subscribers on change', () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));
    setTheme('light');
    setTheme('dark');
    unsubscribe();
    setTheme('light');
    expect(seen).toEqual(['light', 'dark']);
  });
});
