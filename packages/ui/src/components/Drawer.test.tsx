import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders children when open', () => {
    const { getByText } = render(
      <Drawer open onClose={() => {}} ariaLabel="Settings">hello</Drawer>,
    );
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { queryByText } = render(
      <Drawer open={false} onClose={() => {}} ariaLabel="Settings">hello</Drawer>,
    );
    expect(queryByText('hello')).toBeNull();
  });

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <Drawer open onClose={onClose} ariaLabel="Settings">x</Drawer>,
    );
    fireEvent.click(getByTestId('drawer-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<Drawer open onClose={onClose} ariaLabel="Settings">x</Drawer>);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
