import { Slider } from '@aliv/ui';

interface PaddingControlProps {
  margin: number;
  onMargin: (margin: number) => void;
}

/**
 * The "Padding" slider in the Shape rail. Controls the quiet zone — the
 * white margin the QR (Quick Response) spec requires around the modules.
 * Lives in Shape (not Format/Advanced) because users think of it as a
 * shape concern, not an encoding concern.
 */
export function PaddingControl({ margin, onMargin }: PaddingControlProps) {
  return (
    <Slider
      label="Padding"
      value={margin}
      min={0}
      max={48}
      step={2}
      onChange={onMargin}
      format={(v) => `${v} px`}
    />
  );
}
