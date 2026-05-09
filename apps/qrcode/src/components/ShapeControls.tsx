import { SegmentedControl } from '@aliv/ui';
import type { ModuleShape, EyeShape } from '../lib/types';

const MODULE_SHAPES: { value: ModuleShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy R.' },
  { value: 'extra-rounded', label: 'Extra R.' },
];

const EYE_SHAPES: { value: EyeShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'circle', label: 'Circle' },
];

interface ShapeControlsProps {
  moduleShape: ModuleShape;
  eyeFrameShape: EyeShape;
  eyeBallShape: EyeShape;
  onModuleShape: (s: ModuleShape) => void;
  onEyeFrameShape: (s: EyeShape) => void;
  onEyeBallShape: (s: EyeShape) => void;
}

export function ShapeControls({
  moduleShape,
  eyeFrameShape,
  eyeBallShape,
  onModuleShape,
  onEyeFrameShape,
  onEyeBallShape,
}: ShapeControlsProps) {
  return (
    <>
      <div className="qr-field">
        <label>Modules</label>
        <SegmentedControl<ModuleShape>
          value={moduleShape}
          options={MODULE_SHAPES.map((s) => ({
            value: s.value,
            label: <span data-shape={s.value}>{s.label}</span>,
          }))}
          onChange={onModuleShape}
          ariaLabel="Modules"
          full
          size="sm"
        />
      </div>
      <div className="qr-field">
        <label>Eye frame</label>
        <SegmentedControl<EyeShape>
          value={eyeFrameShape}
          options={EYE_SHAPES.map((s) => ({
            value: s.value,
            label: <span data-shape={s.value}>{s.label}</span>,
          }))}
          onChange={onEyeFrameShape}
          ariaLabel="Eye frame"
          full
        />
      </div>
      <div className="qr-field">
        <label>Eye ball</label>
        <SegmentedControl<EyeShape>
          value={eyeBallShape}
          options={EYE_SHAPES.map((s) => ({
            value: s.value,
            label: <span data-shape={s.value}>{s.label}</span>,
          }))}
          onChange={onEyeBallShape}
          ariaLabel="Eye ball"
          full
        />
      </div>
    </>
  );
}
