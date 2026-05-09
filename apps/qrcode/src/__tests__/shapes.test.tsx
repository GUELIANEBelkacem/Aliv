import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ShapeControls } from '../components/ShapeControls';

describe('ShapeControls', () => {
  it('marks the current module shape as active', () => {
    const { container } = render(
      <ShapeControls
        moduleShape="dots"
        eyeFrameShape="square"
        eyeBallShape="square"
        onModuleShape={() => {}}
        onEyeFrameShape={() => {}}
        onEyeBallShape={() => {}}
      />,
    );
    const dotsBtn = container.querySelector('[aria-label="Modules"] [data-segment-value="dots"]')!;
    expect(dotsBtn.getAttribute('data-active')).toBe('true');
  });

  it('emits module shape changes', () => {
    const onModuleShape = vi.fn();
    const { container } = render(
      <ShapeControls
        moduleShape="square"
        eyeFrameShape="square"
        eyeBallShape="square"
        onModuleShape={onModuleShape}
        onEyeFrameShape={() => {}}
        onEyeBallShape={() => {}}
      />,
    );
    const rounded = container.querySelector('[aria-label="Modules"] [data-segment-value="rounded"]')!;
    fireEvent.click(rounded);
    expect(onModuleShape).toHaveBeenCalledWith('rounded');
  });

  it('emits eye frame and eye ball changes independently', () => {
    const onEyeFrame = vi.fn();
    const onEyeBall = vi.fn();
    const { container } = render(
      <ShapeControls
        moduleShape="square"
        eyeFrameShape="square"
        eyeBallShape="square"
        onModuleShape={() => {}}
        onEyeFrameShape={onEyeFrame}
        onEyeBallShape={onEyeBall}
      />,
    );
    fireEvent.click(container.querySelector('[aria-label="Eye frame"] [data-segment-value="leaf"]')!);
    fireEvent.click(container.querySelector('[aria-label="Eye ball"] [data-segment-value="circle"]')!);
    expect(onEyeFrame).toHaveBeenCalledWith('leaf');
    expect(onEyeBall).toHaveBeenCalledWith('circle');
  });
});
