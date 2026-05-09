import { useEffect } from 'react';

export interface Shortcut {
  keys: string;
  handler: (event: KeyboardEvent) => void;
  whenInInput?: boolean;
  description?: string;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (el as HTMLElement).isContentEditable
  );
}

function matches(event: KeyboardEvent, keys: string): boolean {
  const parts = keys.toLowerCase().split('+').map((p) => p.trim());
  const key = parts[parts.length - 1];
  const wantsCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('mod');
  const wantsShift = parts.includes('shift');
  const wantsAlt = parts.includes('alt');

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

  if (wantsCtrl !== ctrlOrCmd) return false;
  if (wantsShift !== event.shiftKey) return false;
  if (wantsAlt !== event.altKey) return false;

  const eventKey = event.key.toLowerCase();
  if (key === 'enter') return eventKey === 'enter';
  if (key === 'esc' || key === 'escape') return eventKey === 'escape';
  if (key === '?') return event.key === '?' || (event.shiftKey && event.key === '/');
  if (key === ',') return event.key === ',';
  return eventKey === key;
}

export function useShortcuts(shortcuts: Shortcut[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const inInput = isInputFocused();
      for (const shortcut of shortcuts) {
        if (inInput && !shortcut.whenInInput) continue;
        if (matches(event, shortcut.keys)) {
          event.preventDefault();
          shortcut.handler(event);
          return;
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts, enabled]);
}
