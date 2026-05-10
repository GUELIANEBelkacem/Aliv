import { SegmentedControl } from '@aliv/ui';
import { ColorPicker } from './ColorPicker';
import { Slider } from '@aliv/ui';
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

type FillType = ColorFill['type'];

export function GradientEditor({ value, onChange }: GradientEditorProps) {
  function setType(type: FillType) {
    if (type === 'solid') {
      const color = value.type === 'solid' ? value.color : value.stops[0];
      onChange({ type: 'solid', color });
    } else if (type === 'linear-gradient') {
      const stops: [string, string] = value.type === 'solid'
        ? [value.color, '#999999']
        : value.stops;
      const angle = value.type === 'linear-gradient' ? value.angle : 0;
      onChange({ type: 'linear-gradient', stops, angle });
    } else {
      const stops: [string, string] = value.type === 'solid'
        ? [value.color, '#999999']
        : value.stops;
      onChange({ type: 'radial-gradient', stops });
    }
  }

  return (
    <>
      <div className="qr-field">
        <label>Fill type</label>
        <SegmentedControl<FillType>
          value={value.type}
          options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
          onChange={setType}
          ariaLabel="Fill type"
          full
        />
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
            <Slider
              label="Angle"
              value={value.angle}
              min={0}
              max={360}
              step={5}
              onChange={(angle) => onChange({ ...value, angle })}
              format={(v) => `${v}°`}
            />
          )}
        </>
      )}
    </>
  );
}
