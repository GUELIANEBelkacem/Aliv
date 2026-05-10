import { SegmentedControl } from '@aliv/ui';
import type { ErrorCorrection } from '../lib/types';

const LEVELS: { value: ErrorCorrection; label: string }[] = [
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
  { value: 'Q', label: 'Q' },
  { value: 'H', label: 'H' },
];

interface Props {
  value: ErrorCorrection;
  onChange: (value: ErrorCorrection) => void;
}

export function ErrorCorrectionPicker({ value, onChange }: Props) {
  return (
    <div className="qr-field">
      <label>Error correction</label>
      <SegmentedControl<ErrorCorrection>
        value={value}
        options={LEVELS}
        onChange={onChange}
        ariaLabel="Error correction level"
        full
      />
      <span className="qr-field-hint">L=7%, M=15%, Q=25%, H=30% recoverable damage. Higher = denser code, more tolerant of logos and worn prints.</span>
    </div>
  );
}
