import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Settings, LayoutGrid } from 'lucide-react';
import { Drawer } from './Drawer';
import { ShortcutsModal } from './ShortcutsModal';
import { AppSwitcher } from './AppSwitcher';
import { Logo } from './Logo';
import { IconButton } from './IconButton';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useShortcuts, type Shortcut } from '../hooks/useShortcuts';
import { getApp } from '../registry/app-registry';
import type { AppId } from '../registry/types';

interface AppShellProps {
  appId: AppId;
  shortcuts?: Shortcut[];
  shortcutsList?: { keys: string; description: string }[];
  settings?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  tld?: string;
}

export function AppShell({
  appId,
  shortcuts = [],
  shortcutsList,
  settings,
  footer,
  children,
  tld,
}: AppShellProps) {
  const app = getApp(appId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.app = appId;
    document.body.classList.add('aliv-ambient');
  }, [appId]);

  const composedShortcuts: Shortcut[] = [
    ...shortcuts,
    { keys: 'Mod+,', handler: () => setSettingsOpen((v) => !v), description: 'Open settings' },
    { keys: '?', handler: () => setShortcutsOpen((v) => !v), description: 'Show shortcuts' },
  ];
  useShortcuts(composedShortcuts);

  const list = shortcutsList ?? composedShortcuts.filter((s) => s.description).map((s) => ({ keys: s.keys, description: s.description as string }));

  return (
    <div className="aliv-shell">
      <header className="aliv-shell-header">
        <div className="aliv-shell-brand">
          <a href={tld ? `https://${tld}` : '/'} className="aliv-brand-link" aria-label="Aliv platform home">
            <Logo size={26} title="Aliv" />
            <span className="aliv-wordmark">aliv</span>
          </a>
          <span className="aliv-brand-divider" aria-hidden="true">|</span>
          <span className="aliv-app-name">{app.name}</span>
        </div>
        <div className="aliv-shell-actions">
          <IconButton label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
            <Keyboard aria-hidden="true" />
          </IconButton>
          {settings && (
            <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
              <Settings aria-hidden="true" />
            </IconButton>
          )}
          <IconButton label="App switcher" onClick={() => setSwitcherOpen(true)}>
            <LayoutGrid aria-hidden="true" />
          </IconButton>
          <ThemeToggle />
        </div>
      </header>
      <main className="aliv-shell-main">{children}</main>
      {footer && <footer className="aliv-shell-footer">{footer}</footer>}
      {settings && (
        <Drawer open={settingsOpen} onClose={() => setSettingsOpen(false)} ariaLabel="Settings">
          {settings}
        </Drawer>
      )}
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} shortcuts={list} />
      <AppSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        currentAppId={appId}
        tld={tld}
      />
    </div>
  );
}
