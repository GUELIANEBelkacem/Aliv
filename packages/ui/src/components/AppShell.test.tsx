import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders the app name from the registry', () => {
    const { getByText } = render(
      <AppShell appId="json-xml"><div /></AppShell>,
    );
    expect(getByText('JSON ↔ XML')).toBeInTheDocument();
  });

  it('sets data-app on the document element', () => {
    render(<AppShell appId="qrcode"><div /></AppShell>);
    expect(document.documentElement.dataset.app).toBe('qrcode');
  });

  it('opens the settings drawer when the settings button is clicked', () => {
    const { getByLabelText, getByText } = render(
      <AppShell appId="json-xml" settings={<div>Settings body</div>}><div /></AppShell>,
    );
    fireEvent.click(getByLabelText('Settings'));
    expect(getByText('Settings body')).toBeInTheDocument();
  });

  it('opens the app switcher when the switcher button is clicked', () => {
    const { getByLabelText, container } = render(
      <AppShell appId="json-xml"><div /></AppShell>,
    );
    fireEvent.click(getByLabelText('App switcher'));
    expect(container.querySelectorAll('[data-tile]').length).toBeGreaterThan(0);
  });

});
