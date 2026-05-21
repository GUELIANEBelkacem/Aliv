import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ShapeSelectOption<T extends string> {
  value: T;
  label: string;
}

interface ShapeSelectProps<T extends string> {
  value: T;
  options: ShapeSelectOption<T>[];
  onChange: (value: T) => void;
  /** Field label shown above the trigger. */
  label: string;
  /** Optional aria-label override for the popover listbox. */
  ariaLabel?: string;
}

/**
 * Dropdown selector for shape pickers — same UX pattern as the content-type
 * selector. A trigger shows the current label; clicking opens a glass
 * popover with a grid of option tiles. Used for Modules, Eye frame and Eye
 * ball where 6-7 options no longer fit in a segmented row.
 */
export function ShapeSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  ariaLabel,
}: ShapeSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const buttonsRef = useRef<Map<T, HTMLButtonElement>>(new Map());
  const labelId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    buttonsRef.current.get(value)?.focus();
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, value]);

  return (
    <div className="qr-field qr-sel" ref={wrapRef}>
      <label id={labelId}>{label}</label>
      <button
        type="button"
        className="qr-sel-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        ref={triggerRef}
      >
        <span className="qr-sel-trigger-value">{current?.label ?? '—'}</span>
        <ChevronDown
          className="qr-sel-chevron"
          aria-hidden="true"
          data-open={open ? 'true' : 'false'}
        />
      </button>
      {open && (
        <div
          className="qr-sel-popover"
          role="listbox"
          aria-label={ariaLabel ?? label}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`qr-sel-option${selected ? ' is-selected' : ''}`}
                data-shape-value={opt.value}
                ref={(el) => {
                  if (el) buttonsRef.current.set(opt.value, el);
                  else buttonsRef.current.delete(opt.value);
                }}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
