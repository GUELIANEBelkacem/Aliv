import { useEffect, useId, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Pipette, Check } from 'lucide-react';
import { isValidHex, expandHex } from '../lib/color-utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

const BRAND_CHIPS = [
  '#0c0d12', '#ffffff',
  '#7c8cf5', '#22d3ee', '#4ade80', '#f59e0b',
  '#ef4444', '#ec4899',
];

export function ColorPicker({ value, onChange, label, id }: ColorPickerProps) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync the draft when the parent's value changes externally (e.g. preset apply).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function commit(v: string) {
    if (isValidHex(v)) {
      const expanded = expandHex(v);
      onChange(expanded);
    }
  }

  return (
    <div className="qr-field qr-cp-field" ref={wrapRef}>
      <label htmlFor={inputId}>{label}</label>
      <div className="qr-cp-trigger-row">
        <button
          type="button"
          className="qr-cp-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-label={`${label} swatch`}
          aria-expanded={open}
        >
          <span className="qr-cp-swatch" style={{ background: isValidHex(value) ? value : '#000000' }} />
        </button>
        <input
          id={inputId}
          type="text"
          className="qr-input qr-cp-hex"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => setDraft(value)}
          spellCheck={false}
        />
      </div>
      {open && <ColorPickerPopover value={value} onChange={onChange} />}
    </div>
  );
}

function ColorPickerPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  async function pickFromScreen() {
    const win = window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };
    if (!win.EyeDropper) return;
    try {
      const result = await new win.EyeDropper().open();
      if (result.sRGBHex && isValidHex(result.sRGBHex)) onChange(result.sRGBHex);
    } catch { /* user cancelled */ }
  }

  const eyedropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;
  const safeValue = isValidHex(value) ? value : '#000000';

  return (
    <div className="qr-cp-popover" role="dialog" aria-label="Color picker">
      <HexColorPicker
        color={safeValue}
        onChange={(c) => onChange(c)}
        className="qr-cp-rc"
      />
      <div className="qr-cp-chips" role="group" aria-label="Brand colors">
        {BRAND_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="qr-cp-chip"
            style={{ background: chip }}
            onClick={() => onChange(chip)}
            aria-label={chip}
            title={chip}
          >
            {value.toLowerCase() === chip.toLowerCase() && <Check aria-hidden="true" />}
          </button>
        ))}
      </div>
      {eyedropperSupported && (
        <button type="button" className="qr-cp-eyedropper" onClick={pickFromScreen}>
          <Pipette aria-hidden="true" />
          Pick from screen
        </button>
      )}
    </div>
  );
}
