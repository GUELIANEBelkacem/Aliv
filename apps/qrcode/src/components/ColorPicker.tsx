import { useEffect, useId, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Pipette } from 'lucide-react';
import { isValidHex, expandHex } from '../lib/color-utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

const RECENT_KEY = 'qr-color-recent';
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === 'string' && isValidHex(v)).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function pushRecent(color: string): string[] {
  const current = readRecent();
  const next = [color, ...current.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, MAX_RECENT);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

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
      pushRecent(expanded);
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
      {open && <ColorPickerPopover value={value} onChange={(v) => { onChange(v); pushRecent(v); }} />}
    </div>
  );
}

function ColorPickerPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recent, setRecent] = useState<string[]>(() => readRecent());

  function applyChip(hex: string) {
    onChange(hex);
    setRecent(pushRecent(hex));
  }

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
      {recent.length > 0 && (
        <div className="qr-cp-chips qr-cp-recent" role="group" aria-label="Recent colors">
          {recent.map((c) => (
            <button
              key={c}
              type="button"
              className="qr-cp-chip qr-cp-chip-sm"
              style={{ background: c }}
              onClick={() => applyChip(c)}
              aria-label={c}
              title={c}
            />
          ))}
        </div>
      )}
      {eyedropperSupported && (
        <button type="button" className="qr-cp-eyedropper" onClick={pickFromScreen}>
          <Pipette aria-hidden="true" />
          Pick from screen
        </button>
      )}
    </div>
  );
}
