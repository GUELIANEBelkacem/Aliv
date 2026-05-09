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

export type EyeShape = 'square' | 'rounded' | 'leaf' | 'circle';

export interface LogoConfig {
  src: string;
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
};
