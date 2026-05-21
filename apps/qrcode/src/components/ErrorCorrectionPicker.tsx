import { SegmentedControl } from '@aliv/ui';
import { EC_LABEL, EC_RANK } from '../lib/ec-rules';
import type { ErrorCorrection } from '../lib/types';

const LEVELS: ErrorCorrection[] = ['L', 'M', 'Q', 'H'];

interface Props {
  value: ErrorCorrection;
  onChange: (value: ErrorCorrection) => void;
  /**
   * Disables every level below this one. Use to enforce the auto-recommended
   * floor — the user can still pick this level or higher, but not below.
   * Omit (or pass undefined) to allow the full L–H range.
   */
  minLevel?: ErrorCorrection;
}

export function ErrorCorrectionPicker({ value, onChange, minLevel }: Props) {
  const minRank = minLevel ? EC_RANK[minLevel] : 0;
  const options = LEVELS.map((level) => ({
    value: level,
    label: EC_LABEL[level],
    disabled: EC_RANK[level] < minRank,
  }));

  return (
    <div className="qr-field">
      <label>Error correction</label>
      <SegmentedControl<ErrorCorrection>
        value={value}
        options={options}
        onChange={onChange}
        ariaLabel="Error correction"
        full
      />
      <span className="qr-field-hint">
        {minLevel
          ? `This design needs at least ${EC_LABEL[minLevel]}; lower levels are disabled.`
          : 'Higher error correction makes the code denser but more tolerant of logos and scratches.'}
      </span>
    </div>
  );
}
