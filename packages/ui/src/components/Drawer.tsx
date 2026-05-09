import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  ariaLabel: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, side = 'right', ariaLabel, children }: DrawerProps) {
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
    <div className="aliv-drawer-root" role="dialog" aria-label={ariaLabel} aria-modal="true">
      <div className="aliv-drawer-backdrop" onClick={onClose} data-testid="drawer-backdrop" />
      <div className={`aliv-drawer aliv-drawer-${side}`}>{children}</div>
    </div>
  );
}
