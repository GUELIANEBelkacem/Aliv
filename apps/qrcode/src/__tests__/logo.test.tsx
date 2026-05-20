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
  const logo = { src: 'data:image/png;base64,abc', sizeRatio: 0.2, padding: 4, shape: 'square' as const };
  const baseProps = { moduleCount: 25, autoBumpThreshold: 0.2 };

  it('does not render size/padding/shape when no logo set', () => {
    const { queryByLabelText } = render(
      <LogoControls logo={undefined} onChange={() => {}} {...baseProps} />,
    );
    expect(queryByLabelText('Size')).toBeNull();
  });

  it('shows controls when a logo is set', () => {
    const { getByLabelText } = render(
      <LogoControls logo={logo} onChange={() => {}} {...baseProps} />,
    );
    expect(getByLabelText('Size')).toBeInTheDocument();
    expect(getByLabelText('Padding')).toBeInTheDocument();
  });

  it('emits a bucketed sizeRatio when the size slider moves', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <LogoControls logo={logo} onChange={onChange} {...baseProps} />,
    );
    // The size slider now exposes bucket indices, not raw ratios. Picking
    // the highest index must produce one of the precomputed bucket ratios,
    // never the raw input value.
    fireEvent.change(getByLabelText('Size'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalled();
    const call = onChange.mock.calls.at(-1)?.[0];
    expect(call.sizeRatio).toBeGreaterThanOrEqual(0.15);
    expect(call.sizeRatio).toBeLessThanOrEqual(0.35);
    // Whatever ratio we get, it isn't the literal slider input.
    expect(call.sizeRatio).not.toBe(2);
  });
});
