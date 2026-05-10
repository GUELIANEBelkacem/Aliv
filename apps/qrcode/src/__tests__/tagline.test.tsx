import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Tagline } from '../sections/Tagline';

describe('Tagline', () => {
  it('renders a single muted line summarizing the tool', () => {
    const { container } = render(<Tagline />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/customizable/i);
    expect(text).toMatch(/browser/i);
  });
});
