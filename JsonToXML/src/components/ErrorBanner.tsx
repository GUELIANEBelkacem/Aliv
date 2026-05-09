import { useState, useRef } from 'react';
import type { ConversionError } from '../types/settings';

interface ErrorBannerProps {
  error: ConversionError | null;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const prevMsgRef = useRef(error?.message);

  // Reset dismissed when the error message changes (derived state, no effect needed)
  if (error?.message !== prevMsgRef.current) {
    prevMsgRef.current = error?.message;
    if (dismissed) setDismissed(false);
  }

  if (!error || dismissed) return null;

  return (
    <div className="error-banner">
      <svg className="error-banner-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 4v3.5M7 9.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span className="error-banner-msg">{error.message}</span>
      {error.line != null && (
        <span className="error-banner-loc">
          Line {error.line}{error.column != null ? `, Col ${error.column}` : ''}
        </span>
      )}
      <button className="error-banner-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
