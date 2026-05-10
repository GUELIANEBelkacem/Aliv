import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Hero } from '../sections/Hero';
import { FaqLauncher } from '../sections/FaqLauncher';

describe('Hero', () => {
  it('renders the headline', () => {
    const { getByRole } = render(<Hero />);
    expect(getByRole('heading', { level: 1 }).textContent).toMatch(/customizable/i);
  });
});

describe('FaqLauncher', () => {
  it('hides the FAQ items behind a launcher button', () => {
    const { queryAllByText, getByRole } = render(<FaqLauncher />);
    expect(queryAllByText(/no backend|stays in your browser/i)).toHaveLength(0);
    expect(getByRole('button', { name: 'Open FAQ' })).toBeInTheDocument();
  });

  it('opens a modal with multiple Q&A items when clicked', () => {
    const { getByRole, queryAllByText } = render(<FaqLauncher />);
    fireEvent.click(getByRole('button', { name: 'Open FAQ' }));
    expect(queryAllByText(/no backend|stays in your browser/i).length).toBeGreaterThan(0);
    expect(getByRole('dialog', { name: /Frequently asked/i })).toBeInTheDocument();
  });

  it('closes via the close button', () => {
    const { getByRole, queryByRole } = render(<FaqLauncher />);
    fireEvent.click(getByRole('button', { name: 'Open FAQ' }));
    fireEvent.click(getByRole('button', { name: 'Close FAQ' }));
    expect(queryByRole('dialog', { name: /Frequently asked/i })).toBeNull();
  });

  it('closes on Escape', () => {
    const { getByRole, queryByRole } = render(<FaqLauncher />);
    fireEvent.click(getByRole('button', { name: 'Open FAQ' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(queryByRole('dialog', { name: /Frequently asked/i })).toBeNull();
  });
});
