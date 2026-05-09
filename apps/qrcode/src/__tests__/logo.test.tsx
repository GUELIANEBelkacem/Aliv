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
    expect(getByTestId('logo-drop')).toBeInTheDocument();
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

  it('does not render size/padding/shape when no logo set', () => {
    const { queryByLabelText } = render(<LogoControls logo={undefined} onChange={() => {}} />);
    expect(queryByLabelText(/Size:/i)).toBeNull();
  });

  it('shows controls when a logo is set', () => {
    const { getByLabelText } = render(<LogoControls logo={logo} onChange={() => {}} />);
    expect(getByLabelText(/Size:/i)).toBeInTheDocument();
    expect(getByLabelText(/Padding:/i)).toBeInTheDocument();
  });

  it('emits sizeRatio change', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<LogoControls logo={logo} onChange={onChange} />);
    fireEvent.change(getByLabelText(/Size:/i), { target: { value: '0.3' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sizeRatio: 0.3 }));
  });
});
