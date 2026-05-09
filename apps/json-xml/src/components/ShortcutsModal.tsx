const SHORTCUTS = [
  { keys: 'Ctrl + Enter', action: 'Convert' },
  { keys: 'Ctrl + Shift + C', action: 'Copy output' },
  { keys: 'Ctrl + Shift + S', action: 'Swap input / output' },
  { keys: 'Ctrl + Shift + B', action: 'Beautify input' },
  { keys: 'Ctrl + Shift + M', action: 'Minify input' },
  { keys: 'Ctrl + ,', action: 'Toggle settings' },
  { keys: '?', action: 'Show this help' },
];

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="shortcuts-backdrop" onClick={onClose} />
      <div className="shortcuts-modal" role="dialog" aria-label="Keyboard shortcuts">
        <h3>Keyboard Shortcuts</h3>
        <table>
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.keys}>
                <td><kbd className="shortcut-key">{s.keys}</kbd></td>
                <td className="shortcut-action">{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost shortcuts-close" onClick={onClose}>Close</button>
      </div>
    </>
  );
}
