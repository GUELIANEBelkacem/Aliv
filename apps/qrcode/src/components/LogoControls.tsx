import { useEffect, useState } from 'react';
import { Slider, SegmentedControl } from '@aliv/ui';
import { LogoUpload } from './LogoUpload';
import { clipLogoToShape } from '../lib/logo-utils';
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
  // Track the original (unclipped) source separately so re-clipping on shape
  // change re-runs from the clean image, not from a previously-clipped one.
  const [original, setOriginal] = useState<string | undefined>(logo?.src);

  useEffect(() => {
    if (!logo || !original) return;
    let cancelled = false;
    clipLogoToShape(original, logo.shape).then((src) => {
      if (cancelled || src === logo.src) return;
      onChange({ ...logo, src });
    }).catch(() => { /* ignore — keep last good src */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo?.shape, original]);

  function setSrc(src: string | undefined) {
    if (!src) {
      setOriginal(undefined);
      onChange(undefined);
      return;
    }
    setOriginal(src);
    onChange({
      src,
      sizeRatio: logo?.sizeRatio ?? 0.25,
      padding: logo?.padding ?? 6,
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
            min={0.15}
            max={0.35}
            step={0.01}
            onChange={(v) => onChange({ ...logo, sizeRatio: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Padding"
            value={logo.padding}
            min={0}
            max={16}
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
            <span className="qr-field-hint">Clips the logo to the chosen frame before embedding.</span>
          </div>
        </>
      )}
    </>
  );
}
