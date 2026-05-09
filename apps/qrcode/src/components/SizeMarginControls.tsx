import { Slider } from '@aliv/ui';

interface Props {
  size: number;
  margin: number;
  onSize: (size: number) => void;
  onMargin: (margin: number) => void;
}

export function SizeMarginControls({ size, margin, onSize, onMargin }: Props) {
  return (
    <>
      <Slider
        label="Size"
        value={size}
        min={120}
        max={600}
        step={20}
        onChange={onSize}
        format={(v) => `${v} px`}
      />
      <Slider
        label="Quiet zone"
        value={margin}
        min={0}
        max={40}
        step={2}
        onChange={onMargin}
        format={(v) => `${v} px`}
      />
    </>
  );
}
