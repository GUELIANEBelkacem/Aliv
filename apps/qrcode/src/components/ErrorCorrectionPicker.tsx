import type { ErrorCorrection } from '../lib/types';

const LEVELS: { value: ErrorCorrection; label: string; hint: string }[] = [
  { value: 'L', label: 'Low', hint: '~7% recovery' },
  { value: 'M', label: 'Medium', hint: '~15% recovery' },
  { value: 'Q', label: 'Quartile', hint: '~25% recovery' },
  { value: 'H', label: 'High', hint: '~30% recovery' },
];

interface Props {
  value: ErrorCorrection;
  onChange: (value: ErrorCorrection) => void;
}

export function ErrorCorrectionPicker({ value, onChange }: Props) {
  return (
    <div className="qr-field">
      <label>Error correction</label>
      <div className="qr-segmented" role="radiogroup" aria-label="Error correction level">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            role="radio"
            aria-checked={value === level.value}
            className={value === level.value ? 'is-active' : ''}
            onClick={() => onChange(level.value)}
            title={`${level.label} — ${level.hint}`}
          >
            {level.value}
          </button>
        ))}
      </div>
      <span className="qr-field-hint">Higher = more resilient to damage, but denser code.</span>
    </div>
  );
}
