import { useEffect, useId, useRef, useState } from 'react';
import {
  Type, Link, Wifi, User, Mail, MessageSquare, Phone, MapPin, Calendar,
  ChevronDown,
} from 'lucide-react';
import type { ContentType } from './types';

interface ContentOption {
  value: ContentType;
  icon: typeof Type;
  label: string;
  description: string;
}

const OPTIONS: ContentOption[] = [
  { value: 'text',     icon: Type,           label: 'Text',     description: 'A short note or message' },
  { value: 'url',      icon: Link,           label: 'URL',      description: 'A website link' },
  { value: 'wifi',     icon: Wifi,           label: 'Wi-Fi',    description: 'Network credentials' },
  { value: 'vcard',    icon: User,           label: 'vCard',    description: 'A contact card' },
  { value: 'email',    icon: Mail,           label: 'Email',    description: 'A mailto: link' },
  { value: 'sms',      icon: MessageSquare,  label: 'SMS',      description: 'A pre-filled SMS' },
  { value: 'phone',    icon: Phone,          label: 'Phone',    description: 'Tap to call' },
  { value: 'geo',      icon: MapPin,         label: 'Geo',      description: 'Map coordinates' },
  { value: 'calendar', icon: Calendar,       label: 'Event',    description: 'A calendar event' },
];

interface ContentTabsProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
}

export function ContentTabs({ value, onChange }: ContentTabsProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<Map<ContentType, HTMLButtonElement>>(new Map());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    // Focus the active tile when the menu opens.
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

  function moveFocus(from: ContentType, direction: 'left' | 'right' | 'up' | 'down') {
    const cols = 3;
    const idx = OPTIONS.findIndex((o) => o.value === from);
    let next = idx;
    if (direction === 'left')  next = idx - 1;
    if (direction === 'right') next = idx + 1;
    if (direction === 'up')    next = idx - cols;
    if (direction === 'down')  next = idx + cols;
    if (next < 0 || next >= OPTIONS.length) return;
    buttonsRef.current.get(OPTIONS[next].value)?.focus();
  }

  function onOptionKey(e: React.KeyboardEvent<HTMLButtonElement>, opt: ContentType) {
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); moveFocus(opt, 'left');  break;
      case 'ArrowRight': e.preventDefault(); moveFocus(opt, 'right'); break;
      case 'ArrowUp':    e.preventDefault(); moveFocus(opt, 'up');    break;
      case 'ArrowDown':  e.preventDefault(); moveFocus(opt, 'down');  break;
    }
  }

  return (
    <div className="qr-ctype" ref={wrapRef}>
      <label className="qr-ctype-eyebrow" id={labelId}>Content type</label>
      <button
        type="button"
        className="qr-ctype-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        ref={triggerRef}
        data-testid="qr-content-type-trigger"
      >
        <span className="qr-ctype-trigger-icon">
          <CurrentIcon aria-hidden="true" />
        </span>
        <span className="qr-ctype-trigger-text">
          <span className="qr-ctype-trigger-label">{current.label}</span>
          <span className="qr-ctype-trigger-desc">{current.description}</span>
        </span>
        <ChevronDown
          className="qr-ctype-chevron"
          aria-hidden="true"
          data-open={open ? 'true' : 'false'}
        />
      </button>
      {open && (
        <div
          className="qr-ctype-popover"
          role="listbox"
          aria-labelledby={labelId}
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`qr-ctype-tile${selected ? ' is-selected' : ''}`}
                data-content-type={opt.value}
                ref={(el) => {
                  if (el) buttonsRef.current.set(opt.value, el);
                  else buttonsRef.current.delete(opt.value);
                }}
                onClick={() => { onChange(opt.value); setOpen(false); triggerRef.current?.focus(); }}
                onKeyDown={(e) => onOptionKey(e, opt.value)}
              >
                <span className="qr-ctype-tile-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="qr-ctype-tile-label">{opt.label}</span>
                <span className="qr-ctype-tile-desc">{opt.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
