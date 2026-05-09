import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ShortcutsModal, formatKeys } from './ShortcutsModal';

describe('ShortcutsModal', () => {
  it('renders all provided shortcuts', () => {
    const { getByText } = render(
      <ShortcutsModal
        open
        onClose={() => {}}
        shortcuts={[
          { keys: 'Ctrl+Enter', description: 'Convert' },
          { keys: 'Ctrl+Shift+S', description: 'Swap' },
        ]}
      />,
    );
    expect(getByText('Convert')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal open onClose={onClose} shortcuts={[]} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not render when closed', () => {
    const { queryByText } = render(
      <ShortcutsModal open={false} onClose={() => {}} shortcuts={[{ keys: 'a', description: 'A' }]} />,
    );
    expect(queryByText('A')).toBeNull();
  });
});

describe('formatKeys', () => {
  it('formats Ctrl shortcut on non-mac', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
    expect(formatKeys('Ctrl+Enter')).toBe('Ctrl+⏎');
  });

  it('formats Mod prefix', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
    expect(formatKeys('Mod+S')).toBe('Ctrl+S');
  });

  it('uppercases single-char keys', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
    expect(formatKeys('Ctrl+Shift+s')).toBe('Ctrl+Shift+S');
  });
});
