import { useId, type ChangeEvent } from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  format?: (value: number) => string;
  ariaLabel?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  format,
  ariaLabel,
}: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : String(value);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value));
  }

  return (
    <div className="aliv-slider">
      {label && (
        <div className="aliv-slider-label">
          <label htmlFor={id}>{label}</label>
          <span className="aliv-slider-value">{display}</span>
        </div>
      )}
      <div
        className="aliv-slider-track"
        style={{ '--aliv-slider-pct': `${pct}%` } as React.CSSProperties}
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={ariaLabel ?? label}
          className="aliv-slider-input"
        />
      </div>
    </div>
  );
}
