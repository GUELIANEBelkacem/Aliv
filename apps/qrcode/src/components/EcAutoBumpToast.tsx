import { useEffect, useRef } from 'react';
import { EC_LABEL } from '../lib/ec-rules';
import type { ErrorCorrection } from '../lib/types';

export type EcChangeDirection = 'up' | 'down';

interface EcAutoBumpToastProps {
  /** Increments whenever a new auto-change should be announced. */
  trigger: number;
  level: ErrorCorrection;
  direction: EcChangeDirection;
}

const TOAST_LIFETIME_MS = 2400;

/**
 * Tiny transient pill that surfaces when auto adjusts the protection level
 * (either up or down). Fades itself out after ~2.4 s so the user gets the
 * heads-up without a sticky warning sitting on the page.
 *
 * The visible flag is toggled via classList (not React state) so the toast
 * doesn't re-render the surrounding panel each time it appears or hides.
 */
export function EcAutoBumpToast({ trigger, level, direction }: EcAutoBumpToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 0) return; // initial render, no toast
    const el = ref.current;
    if (!el) return;
    el.classList.add('is-visible');
    const t = setTimeout(() => el.classList.remove('is-visible'), TOAST_LIFETIME_MS);
    return () => clearTimeout(t);
  }, [trigger]);

  const verb = direction === 'up' ? 'raised' : 'lowered';

  return (
    <div
      ref={ref}
      className="qr-ec-toast"
      role="status"
      aria-live="polite"
      data-testid="qr-ec-toast"
    >
      <span className="qr-ec-toast-dot" aria-hidden="true" />
      <span>
        Auto · Protection {verb} to <strong>{EC_LABEL[level]}</strong>
      </span>
    </div>
  );
}
