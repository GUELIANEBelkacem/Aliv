import { useEffect, useRef } from 'react';
import { PRESETS, type Preset } from './presets';
import { createQr } from '../lib/qr-engine';
import type { QrOptions } from '../lib/types';

interface PresetGalleryProps {
  onApply: (preset: Preset) => void;
  currentPresetId?: string;
}

function PresetThumbnail({ preset }: { preset: Preset }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const opts: QrOptions = {
      ...preset.options,
      data: 'Aliv',
      size: 64,
    };
    const qr = createQr(opts);
    qr.append(node);
    return () => { node.innerHTML = ''; };
  }, [preset]);

  return <span className="qr-preset-thumb" ref={ref} aria-hidden="true" />;
}

export function PresetGallery({ onApply, currentPresetId }: PresetGalleryProps) {
  return (
    <div className="qr-preset-grid">
      {PRESETS.map((preset) => {
        const isCurrent = preset.id === currentPresetId;
        return (
          <button
            key={preset.id}
            className={`qr-preset${isCurrent ? ' is-current' : ''}`}
            onClick={() => onApply(preset)}
            data-preset-id={preset.id}
            data-testid="qr-preset-card"
          >
            <PresetThumbnail preset={preset} />
            <span className="qr-preset-name">{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
}
