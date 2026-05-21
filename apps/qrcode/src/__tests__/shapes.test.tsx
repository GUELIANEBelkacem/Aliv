import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ShapeControls } from '../components/ShapeControls';

const noop = () => {};
const baseProps = {
  moduleShape: 'square' as const,
  eyeFrameShape: 'square' as const,
  eyeBallShape: 'square' as const,
  frameShape: 'rounded' as const,
  onModuleShape: noop,
  onEyeFrameShape: noop,
  onEyeBallShape: noop,
  onFrameShape: noop,
};

// Modules / Eye frame / Eye ball are dropdowns. Open the popover for `label`
// then click `[data-shape-value="..."]` to make a selection.
function openSelect(container: HTMLElement, label: string) {
  const trigger = container.querySelector(`[aria-labelledby] [aria-haspopup="listbox"]`);
  // Find the trigger whose label text matches.
  const triggers = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="listbox"]'));
  const target = triggers.find((b) => {
    const labelEl = b.closest('.qr-sel')?.querySelector('label');
    return labelEl?.textContent === label;
  });
  if (!target) throw new Error(`no shape select trigger for label "${label}"`);
  fireEvent.click(target);
  return trigger;
}

describe('ShapeControls', () => {
  it('shows the current module shape on its trigger', () => {
    const { container } = render(<ShapeControls {...baseProps} moduleShape="dots" />);
    const triggers = container.querySelectorAll('button[aria-haspopup="listbox"]');
    const modulesTrigger = Array.from(triggers).find((t) =>
      t.closest('.qr-sel')?.querySelector('label')?.textContent === 'Modules',
    )!;
    expect(modulesTrigger.textContent).toMatch(/Dots/);
  });

  it('emits module shape changes', () => {
    const onModuleShape = vi.fn();
    const { container } = render(<ShapeControls {...baseProps} onModuleShape={onModuleShape} />);
    openSelect(container, 'Modules');
    fireEvent.click(container.querySelector('[role="listbox"] [data-shape-value="rounded"]')!);
    expect(onModuleShape).toHaveBeenCalledWith('rounded');
  });

  it('emits eye frame and eye ball changes independently', () => {
    const onEyeFrame = vi.fn();
    const onEyeBall = vi.fn();
    const { container } = render(
      <ShapeControls {...baseProps} onEyeFrameShape={onEyeFrame} onEyeBallShape={onEyeBall} />,
    );
    openSelect(container, 'Eye frame');
    fireEvent.click(container.querySelector('[role="listbox"] [data-shape-value="classy"]')!);
    openSelect(container, 'Eye ball');
    fireEvent.click(container.querySelector('[role="listbox"] [data-shape-value="circle"]')!);
    expect(onEyeFrame).toHaveBeenCalledWith('classy');
    expect(onEyeBall).toHaveBeenCalledWith('circle');
  });

  // Frame stays a SegmentedControl — only 4 options, no need for a dropdown.
  it('emits frame shape changes', () => {
    const onFrameShape = vi.fn();
    const { container } = render(<ShapeControls {...baseProps} onFrameShape={onFrameShape} />);
    const circle = container.querySelector('[aria-label="Frame"] [data-segment-value="circle"]')!;
    fireEvent.click(circle);
    expect(onFrameShape).toHaveBeenCalledWith('circle');
  });
});
