import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PRESETS, applyPreset } from '../settings/presets';
import { PresetGallery } from '../settings/PresetGallery';
import { assess } from '../lib/scannability';
import { DEFAULT_QR_OPTIONS } from '../lib/types';

describe('presets', () => {
  it('every preset has a unique id', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset has a non-empty name', () => {
    for (const preset of PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
    }
  });

  it('applyPreset preserves data and logo from current options', () => {
    const current = { ...DEFAULT_QR_OPTIONS, data: 'keep-me', logo: { src: 'x', size: 'M' as const, sizeRatio: 0.2, padding: 4, shape: 'square' as const } };
    const out = applyPreset(current, PRESETS[1]);
    expect(out.data).toBe('keep-me');
    expect(out.logo).toBeDefined();
  });

  it('no preset has scannability level "fail"', () => {
    for (const preset of PRESETS) {
      const opts = { ...DEFAULT_QR_OPTIONS, ...preset.options };
      const result = assess(opts);
      expect(result.level).not.toBe('fail');
    }
  });
});

describe('PresetGallery', () => {
  it('renders one button per preset', () => {
    const { container } = render(<PresetGallery onApply={() => {}} />);
    expect(container.querySelectorAll('[data-preset-id]').length).toBe(PRESETS.length);
  });

  it('emits onApply with the preset on click', () => {
    const onApply = vi.fn();
    const { container } = render(<PresetGallery onApply={onApply} />);
    const target = container.querySelector('[data-preset-id="cyan-brand"]')!;
    fireEvent.click(target);
    expect(onApply).toHaveBeenCalledWith(PRESETS.find((p) => p.id === 'cyan-brand'));
  });

  it('marks the current preset', () => {
    const { container } = render(<PresetGallery onApply={() => {}} currentPresetId="mono-dots" />);
    const current = container.querySelector('[data-preset-id="mono-dots"]')!;
    expect(current.className).toContain('is-current');
  });
});
