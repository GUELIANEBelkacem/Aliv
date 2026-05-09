import { PRESETS, type Preset } from './presets';

interface PresetGalleryProps {
  onApply: (preset: Preset) => void;
  currentPresetId?: string;
}

export function PresetGallery({ onApply, currentPresetId }: PresetGalleryProps) {
  return (
    <div className="qr-preset-grid">
      {PRESETS.map((preset) => {
        const isCurrent = preset.id === currentPresetId;
        const fg = preset.options.foreground.type === 'solid'
          ? preset.options.foreground.color
          : `linear-gradient(${preset.options.foreground.type === 'linear-gradient' ? `${preset.options.foreground.angle}deg` : '135deg'}, ${preset.options.foreground.stops.join(', ')})`;
        return (
          <button
            key={preset.id}
            className={`qr-preset${isCurrent ? ' is-current' : ''}`}
            onClick={() => onApply(preset)}
            data-preset-id={preset.id}
          >
            <span
              className="qr-preset-swatch"
              style={{
                background: fg,
                borderColor: preset.options.background.color,
              }}
            />
            <span className="qr-preset-name">{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
}
