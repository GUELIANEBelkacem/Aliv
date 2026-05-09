import type { ConversionDirection, DetectedFormat } from '../types/settings';

interface ToolbarProps {
  direction: ConversionDirection;
  onDirectionChange: (d: ConversionDirection) => void;
  onConvert: () => void;
  onBeautify: () => void;
  onMinify: () => void;
  showConvert: boolean;
  detectedFormat: DetectedFormat;
}

const DIRECTIONS: { value: ConversionDirection; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'json-to-xml', label: 'JSON → XML' },
  { value: 'xml-to-json', label: 'XML → JSON' },
];

export function Toolbar({
  direction,
  onDirectionChange,
  onConvert,
  onBeautify,
  onMinify,
  showConvert,
  detectedFormat,
}: ToolbarProps) {
  const formatLabel = detectedFormat !== 'unknown' ? detectedFormat.toUpperCase() : '';

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="direction-toggle" role="radiogroup" aria-label="Conversion direction">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              role="radio"
              aria-checked={direction === d.value}
              className={`direction-btn ${direction === d.value ? 'active' : ''}`}
              onClick={() => onDirectionChange(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          {showConvert && (
            <button
              className="btn btn-primary"
              onClick={onConvert}
              title="Convert (Ctrl+Enter)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 8l8-4v8z" fill="currentColor"/>
              </svg>
              <span>Convert</span>
              <kbd>Ctrl+Enter</kbd>
            </button>
          )}
          <button className="btn btn-secondary" onClick={onBeautify} title={`Beautify ${formatLabel}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2l1.5 3L13 6.5 9.5 8 8 11 6.5 8 3 6.5 6.5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span>Beautify</span>
            {formatLabel && <span className="btn-format-badge">{formatLabel}</span>}
          </button>
          <button className="btn btn-secondary" onClick={onMinify} title={`Minify ${formatLabel}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 5h10M3 8h7M3 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span>Minify</span>
            {formatLabel && <span className="btn-format-badge">{formatLabel}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
