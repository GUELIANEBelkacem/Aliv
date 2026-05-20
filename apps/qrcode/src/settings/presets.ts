import type { QrOptions } from '../lib/types';
import { DEFAULT_QR_OPTIONS } from '../lib/types';

export interface Preset {
  id: string;
  name: string;
  // Presets carry the visual subset of QR options. `size` lives outside so a
  // future size control isn't snapped back on preset apply (REVIEW §3.5).
  options: Omit<QrOptions, 'data' | 'logo' | 'size'>;
}

const base = (overrides: Partial<Preset['options']>): Preset['options'] => ({
  errorCorrection: 'M',
  margin: 12,
  foreground: { type: 'solid', color: '#0c0d12' },
  background: { type: 'solid', color: '#ffffff' },
  moduleShape: 'square',
  eyeFrameShape: 'square',
  eyeBallShape: 'square',
  frameShape: 'rounded',
  ...overrides,
});

export const PRESETS: Preset[] = [
  {
    id: 'classic-black',
    name: 'Classic Black',
    options: base({}),
  },
  {
    id: 'cyan-brand',
    name: 'Cyan Brand',
    options: base({
      foreground: { type: 'solid', color: '#22d3ee' },
      background: { type: 'solid', color: '#0c0d12' },
      moduleShape: 'rounded',
      eyeFrameShape: 'rounded',
      eyeBallShape: 'rounded',
    }),
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    options: base({
      foreground: { type: 'linear-gradient', stops: ['#f97316', '#db2777'], angle: 135 },
      background: { type: 'solid', color: '#fff7ed' },
      moduleShape: 'rounded',
      eyeFrameShape: 'rounded',
      eyeBallShape: 'rounded',
    }),
  },
  {
    id: 'mono-dots',
    name: 'Mono Dots',
    options: base({
      foreground: { type: 'solid', color: '#1f2937' },
      background: { type: 'solid', color: '#f4f4f5' },
      moduleShape: 'dots',
      eyeFrameShape: 'circle',
      eyeBallShape: 'circle',
    }),
  },
  {
    id: 'rounded-pastel',
    name: 'Rounded Pastel',
    options: base({
      foreground: { type: 'solid', color: '#7c3aed' },
      background: { type: 'solid', color: '#faf5ff' },
      moduleShape: 'extra-rounded',
      eyeFrameShape: 'rounded',
      eyeBallShape: 'rounded',
    }),
  },
  {
    id: 'high-contrast-print',
    name: 'High-Contrast Print',
    options: base({
      errorCorrection: 'H',
      moduleShape: 'square',
    }),
  },
];

export function applyPreset(current: QrOptions, preset: Preset): QrOptions {
  // Always clear stale eyeColor so a previously-set custom eye doesn't bleed
  // through onto a new theme (REVIEW §8.8).
  return {
    ...current,
    ...preset.options,
    eyeColor: undefined,
  };
}

export function resetDefaults(): QrOptions {
  return DEFAULT_QR_OPTIONS;
}
