import { useEffect } from 'react';

interface ShortcutEntry {
  keys: string;
  description: string;
}

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  shortcuts: ShortcutEntry[];
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
}

export function formatKeys(keys: string): string {
  const mac = isMac();
  return keys
    .split('+')
    .map((part) => {
      const p = part.trim().toLowerCase();
      if (p === 'mod' || p === 'ctrl' || p === 'cmd') return mac ? '⌘' : 'Ctrl';
      if (p === 'shift') return mac ? '⇧' : 'Shift';
      if (p === 'alt') return mac ? '⌥' : 'Alt';
      if (p === 'enter') return '⏎';
      if (p === 'esc' || p === 'escape') return 'Esc';
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join(mac ? '' : '+');
}

export function ShortcutsModal({ open, onClose, shortcuts }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="aliv-modal-root" role="dialog" aria-label="Keyboard shortcuts" aria-modal="true">
      <div className="aliv-modal-backdrop" onClick={onClose} data-testid="modal-backdrop" />
      <div className="aliv-modal aliv-shortcuts-modal">
        <h2>Keyboard shortcuts</h2>
        <ul className="aliv-shortcuts-list">
          {shortcuts.map((s) => (
            <li key={s.keys}>
              <kbd>{formatKeys(s.keys)}</kbd>
              <span>{s.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
