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

describe('ShapeControls', () => {
  it('marks the current module shape as active', () => {
    const { container } = render(<ShapeControls {...baseProps} moduleShape="dots" />);
    const dotsBtn = container.querySelector('[aria-label="Modules"] [data-segment-value="dots"]')!;
    expect(dotsBtn.getAttribute('data-active')).toBe('true');
  });

  it('emits module shape changes', () => {
    const onModuleShape = vi.fn();
    const { container } = render(<ShapeControls {...baseProps} onModuleShape={onModuleShape} />);
    const rounded = container.querySelector('[aria-label="Modules"] [data-segment-value="rounded"]')!;
    fireEvent.click(rounded);
    expect(onModuleShape).toHaveBeenCalledWith('rounded');
  });

  it('emits eye frame and eye ball changes independently', () => {
    const onEyeFrame = vi.fn();
    const onEyeBall = vi.fn();
    const { container } = render(
      <ShapeControls {...baseProps} onEyeFrameShape={onEyeFrame} onEyeBallShape={onEyeBall} />,
    );
    fireEvent.click(container.querySelector('[aria-label="Eye frame"] [data-segment-value="classy"]')!);
    fireEvent.click(container.querySelector('[aria-label="Eye ball"] [data-segment-value="circle"]')!);
    expect(onEyeFrame).toHaveBeenCalledWith('classy');
    expect(onEyeBall).toHaveBeenCalledWith('circle');
  });

  it('emits frame shape changes', () => {
    const onFrameShape = vi.fn();
    const { container } = render(<ShapeControls {...baseProps} onFrameShape={onFrameShape} />);
    const circle = container.querySelector('[aria-label="Frame"] [data-segment-value="circle"]')!;
    fireEvent.click(circle);
    expect(onFrameShape).toHaveBeenCalledWith('circle');
  });
});
