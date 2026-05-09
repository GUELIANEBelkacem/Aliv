import { ColorPicker } from './ColorPicker';
import { GradientEditor } from './GradientEditor';
import type { ColorFill } from '../lib/types';

interface ColorControlsProps {
  foreground: ColorFill;
  background: { type: 'solid'; color: string };
  eyeColor?: string;
  onForegroundChange: (fg: ColorFill) => void;
  onBackgroundChange: (color: string) => void;
  onEyeColorChange: (color: string | undefined) => void;
}

export function ColorControls({
  foreground,
  background,
  eyeColor,
  onForegroundChange,
  onBackgroundChange,
  onEyeColorChange,
}: ColorControlsProps) {
  return (
    <div className="qr-control-group">
      <h3>Colors</h3>
      <GradientEditor value={foreground} onChange={onForegroundChange} />
      <ColorPicker
        id="qr-bg"
        label="Background"
        value={background.color}
        onChange={onBackgroundChange}
      />
      <div className="qr-field">
        <label>
          <input
            type="checkbox"
            checked={eyeColor !== undefined}
            onChange={(e) =>
              onEyeColorChange(e.target.checked ? (foreground.type === 'solid' ? foreground.color : foreground.stops[0]) : undefined)
            }
          />{' '}
          Override eye color
        </label>
        <span className="qr-field-hint">Color the three corner markers separately from the body.</span>
      </div>
      {eyeColor !== undefined && (
        <ColorPicker
          id="qr-eye"
          label="Eye color"
          value={eyeColor}
          onChange={onEyeColorChange}
        />
      )}
    </div>
  );
}
