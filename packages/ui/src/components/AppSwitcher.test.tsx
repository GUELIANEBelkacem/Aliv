import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AppSwitcher } from './AppSwitcher';
import { APPS } from '../registry/app-registry';

describe('AppSwitcher', () => {
  it('renders a tile for every app in the registry', () => {
    const { container } = render(
      <AppSwitcher open onClose={() => {}} currentAppId="json-xml" />,
    );
    const tiles = container.querySelectorAll('[data-tile]');
    expect(tiles.length).toBe(APPS.length);
  });

  it('marks the current app with is-current and aria-current', () => {
    const { container } = render(
      <AppSwitcher open onClose={() => {}} currentAppId="qrcode" />,
    );
    const current = container.querySelector('[data-app-id="qrcode"]')!;
    expect(current.className).toContain('is-current');
    expect(current.getAttribute('aria-current')).toBe('page');
  });

  it('renders coming-soon apps as non-links with aria-disabled', () => {
    const { container } = render(
      <AppSwitcher open onClose={() => {}} currentAppId="json-xml" />,
    );
    const comingSoon = container.querySelector('[data-app-id="hashgen"]')!;
    expect(comingSoon.tagName).toBe('SPAN');
    expect(comingSoon.getAttribute('aria-disabled')).toBe('true');
  });

  it('non-coming-soon tiles are anchor links opening in new tab (production)', () => {
    const original = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...original, hostname: 'aliv.test' },
      writable: true,
      configurable: true,
    });
    const { container } = render(
      <AppSwitcher open onClose={() => {}} currentAppId="json-xml" tld="aliv.test" />,
    );
    const tile = container.querySelector('[data-app-id="qrcode"]') as HTMLAnchorElement;
    expect(tile.tagName).toBe('A');
    expect(tile.getAttribute('target')).toBe('_blank');
    expect(tile.href).toContain('qrcode.aliv.test');
    Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true });
  });

  it('non-coming-soon tiles route to dev ports on localhost', () => {
    const { container } = render(
      <AppSwitcher open onClose={() => {}} currentAppId="json-xml" />,
    );
    const tile = container.querySelector('[data-app-id="qrcode"]') as HTMLAnchorElement;
    expect(tile.tagName).toBe('A');
    expect(tile.href).toContain('localhost:5174');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<AppSwitcher open onClose={onClose} currentAppId="json-xml" />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <AppSwitcher open={false} onClose={() => {}} currentAppId="json-xml" />,
    );
    expect(container.querySelectorAll('[data-tile]').length).toBe(0);
  });
});
