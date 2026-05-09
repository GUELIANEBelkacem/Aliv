import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../components/ColorPicker';
import { GradientEditor } from '../components/GradientEditor';

describe('ColorPicker', () => {
  it('emits valid hex via the text input', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <ColorPicker id="x" label="Test" value="#000000" onChange={onChange} />,
    );
    fireEvent.change(getByLabelText('Test'), { target: { value: '#ff0000' } });
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('does not emit invalid hex', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <ColorPicker id="x" label="Test" value="#000000" onChange={onChange} />,
    );
    fireEvent.change(getByLabelText('Test'), { target: { value: '#zzz' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('GradientEditor', () => {
  it('renders the angle slider only for linear gradient', () => {
    const onChange = vi.fn();
    const { queryByLabelText, rerender, getByLabelText } = render(
      <GradientEditor
        value={{ type: 'solid', color: '#000' }}
        onChange={onChange}
      />,
    );
    expect(queryByLabelText(/Angle/i)).toBeNull();

    rerender(
      <GradientEditor
        value={{ type: 'linear-gradient', stops: ['#000000', '#ffffff'], angle: 45 }}
        onChange={onChange}
      />,
    );
    expect(getByLabelText(/Angle: 45/i)).toBeInTheDocument();
  });

  it('switching from solid to linear keeps the previous color as stop 1', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <GradientEditor
        value={{ type: 'solid', color: '#abcdef' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByText('Linear'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'linear-gradient',
      stops: ['#abcdef', '#999999'],
    }));
  });

  it('emits angle changes via the slider', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <GradientEditor
        value={{ type: 'linear-gradient', stops: ['#000', '#fff'], angle: 0 }}
        onChange={onChange}
      />,
    );
    fireEvent.change(getByLabelText(/Angle/i), { target: { value: '180' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ angle: 180 }));
  });
});
