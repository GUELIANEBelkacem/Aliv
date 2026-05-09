import { ColorPicker } from './ColorPicker';
import type { ColorFill } from '../lib/types';

interface GradientEditorProps {
  value: ColorFill;
  onChange: (value: ColorFill) => void;
}

const TYPES = [
  { value: 'solid', label: 'Solid' },
  { value: 'linear-gradient', label: 'Linear' },
  { value: 'radial-gradient', label: 'Radial' },
] as const;

export function GradientEditor({ value, onChange }: GradientEditorProps) {
  function setType(type: ColorFill['type']) {
    if (type === 'solid') {
      onChange({ type: 'solid', color: value.type === 'solid' ? value.color : value.stops[0] });
    } else if (type === 'linear-gradient') {
      const stops = value.type === 'solid' ? [value.color, '#999999'] as [string, string] : value.stops;
      onChange({ type: 'linear-gradient', stops, angle: value.type === 'linear-gradient' ? value.angle : 0 });
    } else {
      const stops = value.type === 'solid' ? [value.color, '#999999'] as [string, string] : value.stops;
      onChange({ type: 'radial-gradient', stops });
    }
  }

  return (
    <>
      <div className="qr-field">
        <label>Fill type</label>
        <div className="qr-segmented" role="radiogroup">
          {TYPES.map((t) => (
            <button
              key={t.value}
              role="radio"
              aria-checked={value.type === t.value}
              className={value.type === t.value ? 'is-active' : ''}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {value.type === 'solid' && (
        <ColorPicker
          id="qr-fg-solid"
          label="Color"
          value={value.color}
          onChange={(c) => onChange({ type: 'solid', color: c })}
        />
      )}

      {value.type !== 'solid' && (
        <>
          <ColorPicker
            id="qr-fg-stop1"
            label="Stop 1"
            value={value.stops[0]}
            onChange={(c) => onChange({ ...value, stops: [c, value.stops[1]] })}
          />
          <ColorPicker
            id="qr-fg-stop2"
            label="Stop 2"
            value={value.stops[1]}
            onChange={(c) => onChange({ ...value, stops: [value.stops[0], c] })}
          />
          {value.type === 'linear-gradient' && (
            <div className="qr-field">
              <label htmlFor="qr-grad-angle">Angle: {value.angle}°</label>
              <input
                id="qr-grad-angle"
                type="range"
                min={0}
                max={360}
                step={5}
                value={value.angle}
                onChange={(e) => onChange({ ...value, angle: Number(e.target.value) })}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
