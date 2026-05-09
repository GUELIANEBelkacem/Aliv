import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Hero } from '../sections/Hero';
import { Faq } from '../sections/Faq';

describe('Hero', () => {
  it('renders the headline', () => {
    const { getByRole } = render(<Hero />);
    expect(getByRole('heading', { level: 1 }).textContent).toMatch(/customizable/i);
  });
});

describe('Faq', () => {
  it('renders multiple Q&A items', () => {
    const { container } = render(<Faq />);
    expect(container.querySelectorAll('[data-faq-item]').length).toBeGreaterThan(3);
  });

  it('addresses privacy', () => {
    const { container } = render(<Faq />);
    expect(container.textContent).toMatch(/no backend|stays in your browser/i);
  });
});
