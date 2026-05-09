import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  full?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
  full = false,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function measure() {
      if (!container) return;
      const active = container.querySelector<HTMLButtonElement>(`[data-active="true"]`);
      if (!active) {
        setIndicator(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      setIndicator({ left: rect.left - containerRect.left, width: rect.width });
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [value, options.length]);

  return (
    <div
      ref={containerRef}
      className={`aliv-seg aliv-seg-${size}${full ? ' aliv-seg-full' : ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {indicator && (
        <span
          className="aliv-seg-indicator"
          style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
          aria-hidden="true"
        />
      )}
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-active={isActive}
            data-segment-value={opt.value}
            disabled={opt.disabled}
            className={isActive ? 'is-active' : ''}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
