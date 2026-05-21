export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export type ColorFill =
  | { type: 'solid'; color: string }
  | { type: 'linear-gradient'; stops: [string, string]; angle: number }
  | { type: 'radial-gradient'; stops: [string, string] };

export type ModuleShape =
  | 'square'
  | 'rounded'
  | 'dots'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded';

// 1:1 with qr-code-styling's CornerSquareType ∪ CornerDotType. `circle`
// is our friendlier name for the engine's `dot` value (a literal filled
// circle); everything else maps straight through.
export type EyeShape =
  | 'square'
  | 'rounded'
  | 'extra-rounded'
  | 'classy'
  | 'classy-rounded'
  | 'dots'
  | 'circle';

export type FrameShape = 'none' | 'square' | 'rounded' | 'circle';

export type LogoSizeLabel = 'S' | 'M' | 'L' | 'XL';
export const LOGO_SIZE_LABELS: readonly LogoSizeLabel[] = ['S', 'M', 'L', 'XL'] as const;

export interface LogoConfig {
  src: string;
  /** User-facing size step. Engine reads sizeRatio; this label drives it. */
  size: LogoSizeLabel;
  /** Bucket-snapped ratio derived from `size`. App keeps it in sync. */
  sizeRatio: number;
  padding: number;
  shape: 'square' | 'rounded' | 'circle';
  backgroundColor?: string;
}

export interface QrOptions {
  data: string;
  errorCorrection: ErrorCorrection;
  size: number;
  margin: number;
  foreground: ColorFill;
  background: { type: 'solid'; color: string };
  eyeColor?: string;
  moduleShape: ModuleShape;
  eyeFrameShape: EyeShape;
  eyeBallShape: EyeShape;
  frameShape: FrameShape;
  logo?: LogoConfig;
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  data: 'https://aliv.app',
  errorCorrection: 'M',
  size: 280,
  margin: 12,
  foreground: { type: 'solid', color: '#0c0d12' },
  background: { type: 'solid', color: '#ffffff' },
  moduleShape: 'square',
  eyeFrameShape: 'square',
  eyeBallShape: 'square',
  frameShape: 'rounded',
};
