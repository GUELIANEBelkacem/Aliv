import { useEffect, useRef } from 'react';
import type { ErrorCorrection } from '../lib/types';

interface EcAutoBumpToastProps {
  /** Increments whenever a new auto-bump should be announced. */
  trigger: number;
  level: ErrorCorrection;
}

const TOAST_LIFETIME_MS = 2400;

/**
 * Tiny transient pill that surfaces when auto-EC raises the level. Fades
 * itself out after ~2.4 s — the user gets the heads-up without a sticky
 * warning sitting on the page.
 *
 * The visible flag is toggled via classList (not React state) so the toast
 * doesn't re-render the surrounding panel each time it appears or hides.
 * `trigger` is the rising-edge counter from the parent; bumping it shows
 * the toast even if `level` is unchanged (e.g. logo removed → re-added).
 */
export function EcAutoBumpToast({ trigger, level }: EcAutoBumpToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 0) return; // initial render, no toast
    const el = ref.current;
    if (!el) return;
    el.classList.add('is-visible');
    const t = setTimeout(() => el.classList.remove('is-visible'), TOAST_LIFETIME_MS);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div
      ref={ref}
      className="qr-ec-toast"
      role="status"
      aria-live="polite"
      data-testid="qr-ec-toast"
    >
      <span className="qr-ec-toast-dot" aria-hidden="true" />
      <span>Auto · EC → <strong>{level}</strong></span>
    </div>
  );
}
