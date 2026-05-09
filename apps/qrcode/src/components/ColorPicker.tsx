import { useState } from 'react';
import { isValidHex } from '../lib/color-utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

export function ColorPicker({ value, onChange, label, id }: ColorPickerProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);

  function commit(v: string) {
    if (isValidHex(v)) {
      onChange(v);
      setError(false);
    } else {
      setError(true);
    }
  }

  return (
    <div className="qr-field">
      <label htmlFor={id}>{label}</label>
      <div className="qr-row">
        <input
          type="color"
          className="qr-color-input"
          aria-label={`${label} swatch`}
          value={isValidHex(value) ? value : '#000000'}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
        />
        <input
          id={id}
          type="text"
          className="qr-input"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          style={error ? { borderColor: 'var(--danger)' } : undefined}
        />
      </div>
    </div>
  );
}
