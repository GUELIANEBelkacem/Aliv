import { useEffect, useRef } from 'react';
import { APPS, appUrl } from '../registry/app-registry';
import { Logo } from './Logo';
import type { AppId } from '../registry/types';

interface AppSwitcherProps {
  open: boolean;
  onClose: () => void;
  currentAppId: AppId;
  tld?: string;
}

export function AppSwitcher({ open, onClose, currentAppId, tld }: AppSwitcherProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    focusIndexRef.current = Math.max(0, APPS.findIndex((a) => a.id === currentAppId));
    const tiles = popoverRef.current?.querySelectorAll<HTMLAnchorElement | HTMLSpanElement>('[data-tile]');
    tiles?.[focusIndexRef.current]?.focus?.();

    function focusAt(i: number) {
      focusIndexRef.current = (i + APPS.length) % APPS.length;
      tiles?.[focusIndexRef.current]?.focus?.();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusAt(focusIndexRef.current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusAt(focusIndexRef.current - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, currentAppId]);

  if (!open) return null;

  return (
    <div className="aliv-popover-root" role="dialog" aria-label="App switcher">
      <div className="aliv-popover-backdrop" onClick={onClose} data-testid="switcher-backdrop" />
      <div className="aliv-app-switcher" ref={popoverRef}>
        <h3>Aliv apps</h3>
        <div className="aliv-app-grid">
          {APPS.map((app) => {
            const isCurrent = app.id === currentAppId;
            const isComingSoon = !!app.comingSoon;
            const tileClass = `aliv-app-tile${isCurrent ? ' is-current' : ''}${isComingSoon ? ' is-coming-soon' : ''}`;
            const commonProps = {
              'data-tile': true,
              'data-app-id': app.id,
              className: tileClass,
              style: { color: app.accent } as const,
            };
            const content = (
              <>
                <Logo size={32} />
                <span className="aliv-app-tile-name">{app.name}</span>
                <span className="aliv-app-tile-tagline">{app.tagline}</span>
                {isComingSoon && <span className="aliv-app-tile-badge">Soon</span>}
              </>
            );
            if (isComingSoon) {
              return (
                <span key={app.id} {...commonProps} aria-disabled="true" tabIndex={-1}>
                  {content}
                </span>
              );
            }
            return (
              <a
                key={app.id}
                {...commonProps}
                href={appUrl(app, tld)}
                target="_blank"
                rel="noopener"
                aria-current={isCurrent ? 'page' : undefined}
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
