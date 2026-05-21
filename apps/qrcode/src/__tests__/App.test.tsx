import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import App from '../App';

describe('QR app shell', () => {
  it('mounts inside AppShell with appId="qrcode"', () => {
    render(<App />);
    expect(document.documentElement.dataset.app).toBe('qrcode');
  });

  it('renders the QR Generator name from the registry', () => {
    const { getByText } = render(<App />);
    expect(getByText('QR Generator')).toBeInTheDocument();
  });

  it('Advanced rail starts in auto mode — no L/M/Q/H buttons visible', () => {
    const { container, getByText } = render(<App />);
    // Switch to Advanced rail.
    fireEvent.click(getByText('Advanced'));
    // Picker is hidden by default; only the auto-mode status block is shown.
    const ecPicker = container.querySelector('[aria-label="Error correction"]');
    expect(ecPicker).toBeNull();
    const statusBlock = container.querySelector('[data-testid="qr-advanced-status"]');
    expect(statusBlock).not.toBeNull();
  });

  it('toggling Advanced reveals the EC picker', () => {
    const { container, getByText, getByTestId } = render(<App />);
    fireEvent.click(getByText('Advanced'));
    fireEvent.click(getByTestId('qr-advanced-toggle'));
    const ecPicker = container.querySelector('[aria-label="Error correction"]');
    expect(ecPicker).not.toBeNull();
  });

  it('toggling Advanced ON seeds the picker from current effective EC', () => {
    // Audit-B regression: with no logo on a baseline page, effective=M.
    // Toggling Advanced ON should leave the picker on M, not on a stale
    // value. With a logo (effective=H) the picker should start at H.
    const { container, getByText, getByTestId } = render(<App />);
    fireEvent.click(getByText('Advanced'));
    fireEvent.click(getByTestId('qr-advanced-toggle'));
    const active = container.querySelector(
      '[aria-label="Error correction"] [data-active="true"]',
    );
    // No logo / no big padding → effective=M → picker shows M.
    expect(active?.getAttribute('data-segment-value')).toBe('M');
  });
});
