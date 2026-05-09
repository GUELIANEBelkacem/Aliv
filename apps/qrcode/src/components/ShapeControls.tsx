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

function GridPicker<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="qr-field">
      <label>{label}</label>
      <div className="qr-segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? 'is-active' : ''}
            onClick={() => onChange(o.value)}
            data-shape={o.value}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
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
    <div className="qr-control-group">
      <h3>Shapes</h3>
      <GridPicker label="Modules" options={MODULE_SHAPES} value={moduleShape} onChange={onModuleShape} />
      <GridPicker label="Eye frame" options={EYE_SHAPES} value={eyeFrameShape} onChange={onEyeFrameShape} />
      <GridPicker label="Eye ball" options={EYE_SHAPES} value={eyeBallShape} onChange={onEyeBallShape} />
    </div>
  );
}
