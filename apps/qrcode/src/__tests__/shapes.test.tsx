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
    const dots = container.querySelector('[aria-label="Modules"] [data-shape="dots"]')!;
    expect(dots.className).toContain('is-active');
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
    const rounded = container.querySelector('[aria-label="Modules"] [data-shape="rounded"]')!;
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
    fireEvent.click(container.querySelector('[aria-label="Eye frame"] [data-shape="leaf"]')!);
    fireEvent.click(container.querySelector('[aria-label="Eye ball"] [data-shape="circle"]')!);
    expect(onEyeFrame).toHaveBeenCalledWith('leaf');
    expect(onEyeBall).toHaveBeenCalledWith('circle');
  });
});
