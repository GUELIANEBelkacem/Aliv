interface Props {
  size: number;
  margin: number;
  onSize: (size: number) => void;
  onMargin: (margin: number) => void;
}

export function SizeMarginControls({ size, margin, onSize, onMargin }: Props) {
  return (
    <>
      <div className="qr-field">
        <label htmlFor="qr-size">Size: {size}px</label>
        <input
          id="qr-size"
          type="range"
          min={120}
          max={600}
          step={20}
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
        />
      </div>
      <div className="qr-field">
        <label htmlFor="qr-margin">Quiet zone: {margin}px</label>
        <input
          id="qr-margin"
          type="range"
          min={0}
          max={40}
          step={2}
          value={margin}
          onChange={(e) => onMargin(Number(e.target.value))}
        />
      </div>
    </>
  );
}
