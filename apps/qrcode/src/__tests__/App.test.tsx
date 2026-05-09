import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
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
});
