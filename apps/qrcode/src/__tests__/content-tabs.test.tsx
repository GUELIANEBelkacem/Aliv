import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ContentTabs } from '../content/ContentTabs';

describe('ContentTabs', () => {
  it('renders all 9 content type tabs', () => {
    const { container } = render(<ContentTabs value="text" onChange={() => {}} />);
    expect(container.querySelectorAll('[data-content-type]').length).toBe(9);
  });

  it('marks the current tab as selected', () => {
    const { container } = render(<ContentTabs value="wifi" onChange={() => {}} />);
    const wifi = container.querySelector('[data-content-type="wifi"]')!;
    expect(wifi.getAttribute('aria-selected')).toBe('true');
    expect(wifi.className).toContain('is-active');
  });

  it('emits onChange when a different tab is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(<ContentTabs value="text" onChange={onChange} />);
    fireEvent.click(container.querySelector('[data-content-type="vcard"]')!);
    expect(onChange).toHaveBeenCalledWith('vcard');
  });
});
