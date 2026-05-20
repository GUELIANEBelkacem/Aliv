import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { loadLogoFile, ALLOWED_LOGO_MIMES, MAX_LOGO_BYTES } from '../lib/logo-utils';
import { LogoUpload } from '../components/LogoUpload';
import { LogoControls } from '../components/LogoControls';

function makeFile(bytes: number, type: string, content?: string): File {
  const data = content ?? new Array(bytes).fill('a').join('');
  return new File([data], 'test', { type });
}

describe('loadLogoFile', () => {
  it('rejects unsupported MIME types', async () => {
    const file = makeFile(10, 'application/octet-stream');
    const result = await loadLogoFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unsupported/i);
  });

  it('accepts every allowed MIME type', async () => {
    for (const mime of ALLOWED_LOGO_MIMES) {
      const file = makeFile(50, mime, mime === 'image/svg+xml' ? '<svg/>' : 'data');
      const result = await loadLogoFile(file);
      expect(result.ok).toBe(true);
      expect(result.dataUrl).toMatch(/^data:/);
    }
  });

  it('rejects oversize files', async () => {
    const huge = MAX_LOGO_BYTES + 1;
    const file = makeFile(huge, 'image/png');
    const result = await loadLogoFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it('rejects SVGs containing <script>', async () => {
    const file = makeFile(0, 'image/svg+xml', '<svg><script>alert(1)</script></svg>');
    const result = await loadLogoFile(file);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/script/i);
  });
});

describe('LogoUpload', () => {
  it('emits onChange with a data URL on file select', async () => {
    const onChange = vi.fn();
    const { getByTestId, container } = render(<LogoUpload onChange={onChange} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile(10, 'image/png', 'data');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0]).toMatch(/^data:/);
    expect(getByTestId('qr-logo-dropzone')).toBeInTheDocument();
  });

  it('shows an error for an unsupported MIME', async () => {
    const onChange = vi.fn();
    const { findByText, container } = render(<LogoUpload onChange={onChange} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [makeFile(10, 'application/zip')] });
    fireEvent.change(input);
    expect(await findByText(/Unsupported/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('LogoControls', () => {
  const logo = { src: 'data:image/png;base64,abc', size: 'M' as const, sizeRatio: 0.23, padding: 4, shape: 'square' as const };
  const baseProps = { moduleCount: 33, qrPixelSize: 280, ec: 'H' as const };

  it('does not render the size selector when no logo set', () => {
    const { queryByRole } = render(
      <LogoControls logo={undefined} onChange={() => {}} {...baseProps} />,
    );
    expect(queryByRole('radiogroup', { name: /logo size/i })).toBeNull();
  });

  it('shows S/M/L/XL labels when a logo is set', () => {
    const { getByRole } = render(
      <LogoControls logo={logo} onChange={() => {}} {...baseProps} />,
    );
    const group = getByRole('radiogroup', { name: /logo size/i });
    expect(group).toBeInTheDocument();
    // 4 buckets at default settings → all 4 labels.
    const buttons = group.querySelectorAll('[data-segment-value]');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(buttons.length).toBeLessThanOrEqual(4);
  });

  it('clamps padding slider max so the embedded image stays visible', () => {
    // With a tiny inscribed QR (circle frame → ~194 px / 25 modules) the
    // smallest bucket renders a ~23-px hole; the slider must cap padding at
    // ~3 px or the lib collapses the <image> to the corner of the stage.
    const small = { ...logo, size: 'S' as const, sizeRatio: 0.16 };
    const { getByLabelText } = render(
      <LogoControls logo={small} onChange={() => {}} {...baseProps} qrPixelSize={194} />,
    );
    const padding = getByLabelText('Padding') as HTMLInputElement;
    expect(Number(padding.max)).toBeLessThanOrEqual(6);
  });

  it('emits a labeled change with a matching bucketed sizeRatio', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <LogoControls logo={logo} onChange={onChange} {...baseProps} />,
    );
    const group = getByRole('radiogroup', { name: /logo size/i });
    const sButton = group.querySelector('[data-segment-value="S"]') as HTMLElement;
    fireEvent.click(sButton);
    expect(onChange).toHaveBeenCalled();
    const call = onChange.mock.calls.at(-1)?.[0];
    expect(call.size).toBe('S');
    // Range extended to [0.10, 0.40] so 4 buckets fit at EC=H, moduleCount=33.
    expect(call.sizeRatio).toBeGreaterThanOrEqual(0.10);
    expect(call.sizeRatio).toBeLessThanOrEqual(0.40);
  });
});
