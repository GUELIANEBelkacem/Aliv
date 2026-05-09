import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ContentInput } from '../components/ContentInput';
import { ErrorCorrectionPicker } from '../components/ErrorCorrectionPicker';
import { SizeMarginControls } from '../components/SizeMarginControls';

describe('ContentInput', () => {
  it('emits onChange when typed', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<ContentInput value="" onChange={onChange} />);
    fireEvent.change(getByLabelText(/Text or URL/i), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledWith('hi');
  });
});

describe('ErrorCorrectionPicker', () => {
  it('renders all 4 levels and marks the current one', () => {
    const { getByText } = render(<ErrorCorrectionPicker value="M" onChange={() => {}} />);
    expect(getByText('M').className).toContain('is-active');
    expect(getByText('L').className).not.toContain('is-active');
  });

  it('emits onChange when a different level is clicked', () => {
    const onChange = vi.fn();
    const { getByText } = render(<ErrorCorrectionPicker value="M" onChange={onChange} />);
    fireEvent.click(getByText('H'));
    expect(onChange).toHaveBeenCalledWith('H');
  });
});

describe('SizeMarginControls', () => {
  it('size slider emits Number on change', () => {
    const onSize = vi.fn();
    const { getByLabelText } = render(
      <SizeMarginControls size={280} margin={12} onSize={onSize} onMargin={() => {}} />,
    );
    fireEvent.change(getByLabelText(/Size:/i), { target: { value: '320' } });
    expect(onSize).toHaveBeenCalledWith(320);
  });

  it('margin slider emits Number on change', () => {
    const onMargin = vi.fn();
    const { getByLabelText } = render(
      <SizeMarginControls size={280} margin={12} onSize={() => {}} onMargin={onMargin} />,
    );
    fireEvent.change(getByLabelText(/Quiet zone:/i), { target: { value: '20' } });
    expect(onMargin).toHaveBeenCalledWith(20);
  });
});
