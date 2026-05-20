import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ContentTabs } from '../content/ContentTabs';

describe('ContentTabs', () => {
  it('renders a trigger showing the current type', () => {
    const { getByRole } = render(<ContentTabs value="wifi" onChange={() => {}} />);
    const trigger = getByRole('button', { name: /content type/i });
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toMatch(/Wi-Fi/);
  });

  it('opens the popover when the trigger is clicked', () => {
    const { container, getByRole } = render(<ContentTabs value="text" onChange={() => {}} />);
    fireEvent.click(getByRole('button', { name: /content type/i }));
    expect(container.querySelectorAll('[data-content-type]').length).toBe(9);
  });

  it('marks the current option as selected when the popover is open', () => {
    const { container, getByRole } = render(<ContentTabs value="wifi" onChange={() => {}} />);
    fireEvent.click(getByRole('button', { name: /content type/i }));
    const wifi = container.querySelector('[data-content-type="wifi"]')!;
    expect(wifi.getAttribute('aria-selected')).toBe('true');
  });

  it('emits onChange when a different option is clicked', () => {
    const onChange = vi.fn();
    const { container, getByRole } = render(<ContentTabs value="text" onChange={onChange} />);
    fireEvent.click(getByRole('button', { name: /content type/i }));
    fireEvent.click(container.querySelector('[data-content-type="vcard"]')!);
    expect(onChange).toHaveBeenCalledWith('vcard');
  });

  it('closes the popover after a selection', () => {
    const { container, getByRole } = render(<ContentTabs value="text" onChange={() => {}} />);
    fireEvent.click(getByRole('button', { name: /content type/i }));
    fireEvent.click(container.querySelector('[data-content-type="vcard"]')!);
    expect(container.querySelectorAll('[data-content-type]').length).toBe(0);
  });
});
