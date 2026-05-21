import { SegmentedControl } from '@aliv/ui';
import { ShapeSelect } from './ShapeSelect';
import { ShapeIcon } from './ShapeIcon';
import type { ModuleShape, EyeShape, FrameShape } from '../lib/types';

const MODULE_SHAPES: { value: ModuleShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
];

const EYE_SHAPES: { value: EyeShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'circle', label: 'Circle' },
];

function withIcons<T extends string>(items: { value: T; label: string }[]) {
  return items.map((s) => ({
    value: s.value,
    label: s.label,
    icon: <ShapeIcon shape={s.value} />,
  }));
}

const FRAME_SHAPES: { value: FrameShape; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
];

interface ShapeControlsProps {
  moduleShape: ModuleShape;
  eyeFrameShape: EyeShape;
  eyeBallShape: EyeShape;
  frameShape: FrameShape;
  onModuleShape: (s: ModuleShape) => void;
  onEyeFrameShape: (s: EyeShape) => void;
  onEyeBallShape: (s: EyeShape) => void;
  onFrameShape: (s: FrameShape) => void;
}

export function ShapeControls({
  moduleShape,
  eyeFrameShape,
  eyeBallShape,
  frameShape,
  onModuleShape,
  onEyeFrameShape,
  onEyeBallShape,
  onFrameShape,
}: ShapeControlsProps) {
  return (
    <>
      <div className="qr-field">
        <label>Frame</label>
        <SegmentedControl<FrameShape>
          value={frameShape}
          options={FRAME_SHAPES.map((s) => ({ value: s.value, label: s.label }))}
          onChange={onFrameShape}
          ariaLabel="Frame"
          full
        />
        <span className="qr-field-hint">The card behind the QR + the accent ring around it.</span>
      </div>
      <ShapeSelect<ModuleShape>
        label="Modules"
        value={moduleShape}
        options={withIcons(MODULE_SHAPES)}
        onChange={onModuleShape}
      />
      <ShapeSelect<EyeShape>
        label="Eye frame"
        value={eyeFrameShape}
        options={withIcons(EYE_SHAPES)}
        onChange={onEyeFrameShape}
      />
      <ShapeSelect<EyeShape>
        label="Eye ball"
        value={eyeBallShape}
        options={withIcons(EYE_SHAPES)}
        onChange={onEyeBallShape}
      />
    </>
  );
}
