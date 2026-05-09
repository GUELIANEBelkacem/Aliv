import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to secondary variant', () => {
    const { getByRole } = render(<Button>Hi</Button>);
    expect(getByRole('button').className).toContain('aliv-btn-secondary');
  });

  it.each(['primary', 'secondary', 'ghost'] as const)('applies %s variant class', (variant) => {
    const { getByRole } = render(<Button variant={variant}>x</Button>);
    expect(getByRole('button').className).toContain(`aliv-btn-${variant}`);
  });

  it('fires onClick', () => {
    const handler = vi.fn();
    const { getByRole } = render(<Button onClick={handler}>x</Button>);
    fireEvent.click(getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', () => {
    const handler = vi.fn();
    const { getByRole } = render(<Button onClick={handler} disabled>x</Button>);
    fireEvent.click(getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });
});
