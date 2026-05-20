import { SegmentedControl } from '@aliv/ui';
import type { ModuleShape, EyeShape, FrameShape } from '../lib/types';

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
          options={FRAME_SHAPES.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
          onChange={onFrameShape}
          ariaLabel="Frame"
          full
        />
        <span className="qr-field-hint">The card behind the QR + the accent ring around it.</span>
      </div>
      <div className="qr-field">
        <label>Modules</label>
        <SegmentedControl<ModuleShape>
          value={moduleShape}
          options={MODULE_SHAPES.map((s) => ({
            value: s.value,
            label: s.label,
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
            label: s.label,
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
            label: s.label,
          }))}
          onChange={onEyeBallShape}
          ariaLabel="Eye ball"
          full
        />
      </div>
    </>
  );
}
