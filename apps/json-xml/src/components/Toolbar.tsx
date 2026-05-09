import type { ConversionDirection, DetectedFormat } from '../types/settings';

interface ToolbarProps {
  direction: ConversionDirection;
  onDirectionChange: (d: ConversionDirection) => void;
  onConvert: () => void;
  onBeautify: () => void;
  onMinify: () => void;
  onToggleSettings: () => void;
  showConvert: boolean;
  detectedFormat: DetectedFormat;
}

const DIRECTIONS: { value: ConversionDirection; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'json-to-xml', label: 'JSON \u2192 XML' },
  { value: 'xml-to-json', label: 'XML \u2192 JSON' },
];

function BrandIcon() {
  return (
    <svg className="brand-icon" width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M10 6C8 6 7 7.5 7 9v4c0 1.5-1 3-3 3 2 0 3 1.5 3 3v4c0 1.5 1 3 3 3" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 6c2 0 3 1.5 3 3v4c0 1.5 1 3 3 3-2 0-3 1.5-3 3v4c0 1.5-1 3-3 3" stroke="#7c8cf5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13 16h6m0 0l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Toolbar({
  direction,
  onDirectionChange,
  onConvert,
  onBeautify,
  onMinify,
  onToggleSettings,
  showConvert,
  detectedFormat,
}: ToolbarProps) {
  const formatLabel = detectedFormat !== 'unknown' ? detectedFormat.toUpperCase() : '';

  return (
    <header className="toolbar">
      {/* Row 1: Brand + Direction + Settings */}
      <div className="toolbar-row">
        <div className="toolbar-left">
          <span className="toolbar-brand">
            <BrandIcon />
            <span>JsonToXML</span>
          </span>
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
        </div>
        <div className="toolbar-right">
          <button className="btn btn-ghost btn-icon" onClick={onToggleSettings} title="Settings" aria-label="Settings">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6.5 1.5h3l.4 1.7a5.5 5.5 0 011.3.7l1.6-.6 1.5 2.6-1.2 1.1a5.5 5.5 0 010 1.5l1.2 1.1-1.5 2.6-1.6-.6a5.5 5.5 0 01-1.3.7l-.4 1.7h-3l-.4-1.7a5.5 5.5 0 01-1.3-.7l-1.6.6-1.5-2.6 1.2-1.1a5.5 5.5 0 010-1.5L1.7 5.9l1.5-2.6 1.6.6a5.5 5.5 0 011.3-.7z" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Actions */}
      <div className="toolbar-row">
        <div className="toolbar-actions">
          {/* Convert button: only visible when input is large (no auto-convert) */}
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
    </header>
  );
}
