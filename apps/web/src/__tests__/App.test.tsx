import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import { APPS } from '@aliv/ui';

describe('Aliv landing', () => {
  it('renders the hero headline', () => {
    const { getByRole } = render(<App />);
    expect(getByRole('heading', { level: 1 }).textContent).toMatch(/Privacy-first/i);
  });

  it('renders one card per non-web app', () => {
    const { container } = render(<App />);
    const cards = container.querySelectorAll('[data-app-card]');
    expect(cards.length).toBe(APPS.length - 1);
  });

  it('coming-soon cards are non-link spans with aria-disabled', () => {
    const { container } = render(<App />);
    const card = container.querySelector('[data-app-id="hashgen"]')!;
    expect(card.tagName).toBe('SPAN');
    expect(card.getAttribute('aria-disabled')).toBe('true');
  });

  it('live cards are anchor links opening in a new tab', () => {
    const { container } = render(<App />);
    const card = container.querySelector('[data-app-id="json-xml"]') as HTMLAnchorElement;
    expect(card.tagName).toBe('A');
    expect(card.getAttribute('target')).toBe('_blank');
    expect(card.getAttribute('rel')).toContain('noopener');
  });

  it('sets data-app on the document root via AppShell', () => {
    render(<App />);
    expect(document.documentElement.dataset.app).toBe('web');
  });

  it('manifesto section is present', () => {
    const { getByText } = render(<App />);
    expect(getByText(/No uploads, ever/i)).toBeInTheDocument();
  });

  it('footer renders the current year', () => {
    const { getByText } = render(<App />);
    expect(getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
