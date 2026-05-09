import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useShortcuts } from './useShortcuts';

describe('useShortcuts', () => {
  it('fires on a single matching key', () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ keys: '?', handler }]));
    fireEvent.keyDown(window, { key: '?' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('only fires when modifiers match', () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ keys: 'Ctrl+Enter', handler }]));
    fireEvent.keyDown(window, { key: 'Enter' }); // no Ctrl
    expect(handler).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('skips firing when an input is focused (default)', () => {
    const handler = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useShortcuts([{ keys: 'a', handler }]));
    fireEvent.keyDown(window, { key: 'a' });
    expect(handler).not.toHaveBeenCalled();
    input.remove();
  });

  it('fires inside inputs when whenInInput is true', () => {
    const handler = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useShortcuts([{ keys: 'a', handler, whenInInput: true }]));
    fireEvent.keyDown(window, { key: 'a' });
    expect(handler).toHaveBeenCalledOnce();
    input.remove();
  });

  it('cleans up listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useShortcuts([{ keys: 'b', handler }]));
    unmount();
    fireEvent.keyDown(window, { key: 'b' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('disabled flag suppresses firing', () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ keys: 'c', handler }], false));
    fireEvent.keyDown(window, { key: 'c' });
    expect(handler).not.toHaveBeenCalled();
  });
});
