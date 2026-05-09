import { useState, useCallback } from 'react';
import type { ConversionError, DetectedFormat } from '../types/settings';

interface StatusBarProps {
  error: ConversionError | null;
  detectedFormat: DetectedFormat;
  inputLength: number;
  conversionTime: number | null;
  pending?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatusBar({ error, detectedFormat, inputLength, conversionTime, pending }: StatusBarProps) {
  const [errorExpanded, setErrorExpanded] = useState(false);

  const toggleError = useCallback(() => {
    setErrorExpanded((v) => !v);
  }, []);

  return (
    <footer className="status-bar">
      <div className="status-left">
        {error ? (
          <span
            className={`status-error ${errorExpanded ? 'expanded' : ''}`}
            title={error.message}
            onClick={toggleError}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 4v3.5M7 9.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error.message}
            {error.line != null && (
              <span className="error-location"> Ln {error.line}{error.column != null ? `, Col ${error.column}` : ''}</span>
            )}
          </span>
        ) : pending ? (
          <span className="status-pending">
            <span className="pending-dot" />
            Converting...
          </span>
        ) : conversionTime !== null ? (
          <span className="status-ok">Converted in {conversionTime}ms</span>
        ) : (
          <span className="status-ok">Ready</span>
        )}
      </div>
      <div className="status-right">
        <span className={`format-badge ${detectedFormat}`}>
          {detectedFormat === 'unknown' ? 'Unknown' : detectedFormat.toUpperCase()}
        </span>
        <span className="size-badge">{formatSize(inputLength)}</span>
      </div>
    </footer>
  );
}
