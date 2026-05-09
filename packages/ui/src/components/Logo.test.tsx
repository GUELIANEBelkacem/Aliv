import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders an svg element', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('uses currentColor for fill', () => {
    const { container } = render(<Logo />);
    const g = container.querySelector('g');
    expect(g?.getAttribute('fill')).toBe('currentColor');
  });

  it('applies size prop to width and height', () => {
    const { container } = render(<Logo size={48} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('48');
    expect(svg.getAttribute('height')).toBe('48');
  });

  it('renders title and aria-label when title is provided', () => {
    const { container } = render(<Logo title="Aliv" />);
    expect(container.querySelector('title')?.textContent).toBe('Aliv');
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Aliv');
  });

  it('is aria-hidden when no title is provided', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
