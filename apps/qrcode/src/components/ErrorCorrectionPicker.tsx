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
      <span className="qr-field-hint">Higher = more resilient to damage, but denser code.</span>
    </div>
  );
}
