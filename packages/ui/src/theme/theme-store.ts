export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'aliv-theme';
const COOKIE_NAME = 'aliv-theme';

type Listener = (theme: Theme) => void;
const listeners = new Set<Listener>();

function readCookie(): Theme | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.slice(COOKIE_NAME.length + 1);
  return value === 'light' || value === 'dark' ? value : null;
}

function writeCookie(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const apex = host.match(/\.([^.]+\.[^.]+)$/)?.[1];
  const domain = apex ? `; Domain=.${apex}` : '';
  document.cookie = `${COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${domain}`;
}

export function getTheme(): Theme {
  const cookieTheme = readCookie();
  if (cookieTheme) return cookieTheme;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function setTheme(theme: Theme): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  writeCookie(theme);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
  listeners.forEach((l) => l(theme));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
