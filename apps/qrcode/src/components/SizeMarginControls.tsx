import { Slider } from '@aliv/ui';

interface Props {
  margin: number;
  onMargin: (margin: number) => void;
}

export function SizeMarginControls({ margin, onMargin }: Props) {
  return (
    <Slider
      label="Quiet zone"
      value={margin}
      min={0}
      max={40}
      step={2}
      onChange={onMargin}
      format={(v) => `${v} px`}
    />
  );
}
