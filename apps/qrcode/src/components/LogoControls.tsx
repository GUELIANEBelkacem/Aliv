import { LogoUpload } from './LogoUpload';
import type { LogoConfig } from '../lib/types';

interface LogoControlsProps {
  logo: LogoConfig | undefined;
  onChange: (logo: LogoConfig | undefined) => void;
}

const SHAPES = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
] as const;

export function LogoControls({ logo, onChange }: LogoControlsProps) {
  function setSrc(src: string | undefined) {
    if (!src) {
      onChange(undefined);
      return;
    }
    onChange({
      src,
      sizeRatio: logo?.sizeRatio ?? 0.2,
      padding: logo?.padding ?? 4,
      shape: logo?.shape ?? 'square',
    });
  }

  return (
    <div className="qr-control-group">
      <h3>Logo</h3>
      <LogoUpload src={logo?.src} onChange={setSrc} />
      {logo && (
        <>
          <div className="qr-field">
            <label htmlFor="qr-logo-size">Size: {Math.round(logo.sizeRatio * 100)}%</label>
            <input
              id="qr-logo-size"
              type="range"
              min={0.1}
              max={0.45}
              step={0.01}
              value={logo.sizeRatio}
              onChange={(e) => onChange({ ...logo, sizeRatio: Number(e.target.value) })}
            />
          </div>
          <div className="qr-field">
            <label htmlFor="qr-logo-padding">Padding: {logo.padding}px</label>
            <input
              id="qr-logo-padding"
              type="range"
              min={0}
              max={20}
              step={1}
              value={logo.padding}
              onChange={(e) => onChange({ ...logo, padding: Number(e.target.value) })}
            />
          </div>
          <div className="qr-field">
            <label>Shape</label>
            <div className="qr-segmented" role="radiogroup">
              {SHAPES.map((s) => (
                <button
                  key={s.value}
                  role="radio"
                  aria-checked={logo.shape === s.value}
                  className={logo.shape === s.value ? 'is-active' : ''}
                  onClick={() => onChange({ ...logo, shape: s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
