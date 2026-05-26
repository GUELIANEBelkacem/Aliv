import { useEffect, useState, type ReactNode } from 'react';
import { Settings, LayoutGrid } from 'lucide-react';
import { Drawer } from './Drawer';
import { AppSwitcher } from './AppSwitcher';
import { Logo } from './Logo';
import { IconButton } from './IconButton';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useShortcuts, type Shortcut } from '../hooks/useShortcuts';
import { getApp, appUrl } from '../registry/app-registry';
import type { AppId } from '../registry/types';

interface AppShellProps {
  appId: AppId;
  /**
   * Programmatic keyboard shortcuts the app wants to register (e.g. Ctrl+S
   * for save). Still wired through `useShortcuts` so handlers fire on the
   * matching keys. The shell no longer renders a help modal — apps should
   * surface bindings in their own UI if discovery matters.
   */
  shortcuts?: Shortcut[];
  settings?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  tld?: string;
}

export function AppShell({
  appId,
  shortcuts = [],
  settings,
  footer,
  children,
  tld,
}: AppShellProps) {
  const app = getApp(appId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.app = appId;
    document.body.classList.add('aliv-ambient');
  }, [appId]);

  useShortcuts(shortcuts);

  return (
    <div className="aliv-shell">
      <header className="aliv-shell-header">
        <div className="aliv-shell-brand">
          <a href={appUrl(getApp('web'), tld)} className="aliv-brand-link" aria-label="Aliv platform home">
            <Logo size={26} title="Aliv" appId={appId} />
            <span className="aliv-wordmark">aliv</span>
          </a>
          <span className="aliv-brand-divider" aria-hidden="true">|</span>
          <span className="aliv-app-name">{app.name}</span>
        </div>
        <div className="aliv-shell-actions">
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
      <AppSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        currentAppId={appId}
        tld={tld}
      />
    </div>
  );
}
