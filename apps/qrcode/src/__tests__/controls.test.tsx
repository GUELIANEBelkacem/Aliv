import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ErrorCorrectionPicker } from '../components/ErrorCorrectionPicker';
import { PaddingControl } from '../components/PaddingControl';

describe('ErrorCorrectionPicker', () => {
  it('renders all 4 levels and marks the current one', () => {
    const { container } = render(<ErrorCorrectionPicker value="M" onChange={() => {}} />);
    const m = container.querySelector('[data-segment-value="M"]')!;
    const l = container.querySelector('[data-segment-value="L"]')!;
    expect(m.getAttribute('data-active')).toBe('true');
    expect(l.getAttribute('data-active')).toBe('false');
  });

  it('emits onChange when a different level is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(<ErrorCorrectionPicker value="M" onChange={onChange} />);
    fireEvent.click(container.querySelector('[data-segment-value="H"]')!);
    expect(onChange).toHaveBeenCalledWith('H');
  });

  it('disables levels below minLevel', () => {
    const { container } = render(
      <ErrorCorrectionPicker value="H" onChange={() => {}} minLevel="H" />,
    );
    const buttons = ['L', 'M', 'Q', 'H'].map((v) =>
      container.querySelector(`[data-segment-value="${v}"]`) as HTMLButtonElement,
    );
    expect(buttons[0].disabled).toBe(true); // L
    expect(buttons[1].disabled).toBe(true); // M
    expect(buttons[2].disabled).toBe(true); // Q
    expect(buttons[3].disabled).toBe(false); // H — the floor itself stays open
  });

  it('omitting minLevel enables every level', () => {
    const { container } = render(<ErrorCorrectionPicker value="M" onChange={() => {}} />);
    for (const v of ['L', 'M', 'Q', 'H']) {
      const b = container.querySelector(`[data-segment-value="${v}"]`) as HTMLButtonElement;
      expect(b.disabled).toBe(false);
    }
  });
});

describe('PaddingControl', () => {
  it('renders as "Padding" (was "Quiet zone") and emits Number on change', () => {
    const onMargin = vi.fn();
    const { getByLabelText } = render(<PaddingControl margin={12} onMargin={onMargin} />);
    const slider = getByLabelText('Padding') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '20' } });
    expect(onMargin).toHaveBeenCalledWith(20);
  });

  it('caps at 48 (raised from 40)', () => {
    const { getByLabelText } = render(<PaddingControl margin={12} onMargin={() => {}} />);
    const slider = getByLabelText('Padding') as HTMLInputElement;
    expect(Number(slider.max)).toBe(48);
  });
});
