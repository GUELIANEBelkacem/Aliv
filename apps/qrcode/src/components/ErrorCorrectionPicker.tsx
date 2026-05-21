import { SegmentedControl } from '@aliv/ui';
import { EC_LABEL } from '../lib/ec-rules';
import type { ErrorCorrection } from '../lib/types';

const LEVELS: { value: ErrorCorrection; label: string }[] = [
  { value: 'L', label: EC_LABEL.L },
  { value: 'M', label: EC_LABEL.M },
  { value: 'Q', label: EC_LABEL.Q },
  { value: 'H', label: EC_LABEL.H },
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
        ariaLabel="Error correction"
        full
      />
      <span className="qr-field-hint">
        Higher error correction makes the code denser but more tolerant of
        logos and scratches.
      </span>
    </div>
  );
}
