import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ContentTabs } from '../content/ContentTabs';

describe('ContentTabs', () => {
  it('renders all 9 content type tabs', () => {
    const { container } = render(<ContentTabs value="text" onChange={() => {}} />);
    expect(container.querySelectorAll('[data-segment-value]').length).toBe(9);
  });

  it('marks the current tab as selected', () => {
    const { container } = render(<ContentTabs value="wifi" onChange={() => {}} />);
    const wifi = container.querySelector('[data-segment-value="wifi"]')!;
    expect(wifi.getAttribute('data-active')).toBe('true');
    expect(wifi.getAttribute('aria-checked')).toBe('true');
  });

  it('emits onChange when a different tab is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(<ContentTabs value="text" onChange={onChange} />);
    fireEvent.click(container.querySelector('[data-segment-value="vcard"]')!);
    expect(onChange).toHaveBeenCalledWith('vcard');
  });
});
