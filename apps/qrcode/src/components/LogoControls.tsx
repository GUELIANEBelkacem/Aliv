import { Slider, SegmentedControl } from '@aliv/ui';
import { LogoUpload } from './LogoUpload';
import type { LogoConfig } from '../lib/types';

interface LogoControlsProps {
  logo: LogoConfig | undefined;
  onChange: (logo: LogoConfig | undefined) => void;
}

const SHAPES = [
  { value: 'square' as const, label: 'Square' },
  { value: 'rounded' as const, label: 'Rounded' },
  { value: 'circle' as const, label: 'Circle' },
];

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
    <>
      <LogoUpload src={logo?.src} onChange={setSrc} />
      {logo && (
        <>
          <Slider
            label="Size"
            value={logo.sizeRatio}
            min={0.1}
            max={0.45}
            step={0.01}
            onChange={(v) => onChange({ ...logo, sizeRatio: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Padding"
            value={logo.padding}
            min={0}
            max={20}
            step={1}
            onChange={(v) => onChange({ ...logo, padding: v })}
            format={(v) => `${v} px`}
          />
          <div className="qr-field">
            <label>Shape</label>
            <SegmentedControl
              value={logo.shape}
              options={SHAPES}
              onChange={(shape) => onChange({ ...logo, shape })}
              ariaLabel="Logo shape"
              full
            />
          </div>
        </>
      )}
    </>
  );
}
