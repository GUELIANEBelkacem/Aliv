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
    const ecPicker = container.querySelector('[aria-label="Error correction level"]');
    expect(ecPicker).toBeNull();
    const statusBlock = container.querySelector('[data-testid="qr-advanced-status"]');
    expect(statusBlock).not.toBeNull();
  });

  it('toggling Advanced reveals the EC picker', () => {
    const { container, getByText, getByTestId } = render(<App />);
    fireEvent.click(getByText('Advanced'));
    fireEvent.click(getByTestId('qr-advanced-toggle'));
    const ecPicker = container.querySelector('[aria-label="Error correction level"]');
    expect(ecPicker).not.toBeNull();
  });
});
