import { useRef } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { DEFAULT_SETTINGS } from '../types/settings';
import type { AppSettings } from '../types/settings';

interface SettingsDrawerProps {
  open: boolean;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
  autoConvertBlocked?: boolean;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`toggle-track ${disabled ? 'toggle-disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="toggle-slider" />
    </label>
  );
}

export function SettingsDrawer({ open, settings, onUpdate, onClose, autoConvertBlocked }: SettingsDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  useSwipe(drawerRef, { onSwipeRight: onClose });

  return (
    <>
      <div className={`settings-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside ref={drawerRef} className={`settings-drawer ${open ? 'open' : ''}`} aria-label="Settings">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <fieldset>
            <legend>Conversion</legend>

            <div className={`setting-row ${autoConvertBlocked ? 'setting-row-disabled' : ''}`}>
              <div className="setting-info">
                <span className="setting-label">Auto-convert</span>
                <span className="setting-hint">
                  {autoConvertBlocked
                    ? 'Disabled — input exceeds 100 KB'
                    : 'Convert automatically as you type (small inputs only)'}
                </span>
              </div>
              <Toggle checked={settings.autoConvert} onChange={(v) => onUpdate({ autoConvert: v })} disabled={autoConvertBlocked} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Infer types</span>
                <span className="setting-hint">Parse "123" as number, "true"/"false" as boolean</span>
              </div>
              <Toggle checked={settings.inferTypes} onChange={(v) => onUpdate({ inferTypes: v })} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Always create arrays</span>
                <span className="setting-hint">Wrap single XML elements in arrays for consistent round-trips</span>
              </div>
              <Toggle checked={settings.alwaysArray} onChange={(v) => onUpdate({ alwaysArray: v })} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Preserve comments</span>
                <span className="setting-hint">Include XML comments as #comment properties in JSON</span>
              </div>
              <Toggle checked={settings.preserveComments} onChange={(v) => onUpdate({ preserveComments: v })} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">XML declaration</span>
                <span className="setting-hint">{"Prepend <?xml version=\"1.0\"?> to XML output"}</span>
              </div>
              <Toggle checked={settings.preserveDeclaration} onChange={(v) => onUpdate({ preserveDeclaration: v })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>Formatting</legend>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Indentation</span>
              </div>
              <select
                value={settings.indentation}
                onChange={(e) => onUpdate({ indentation: e.target.value })}
              >
                <option value="  ">2 spaces</option>
                <option value="    ">4 spaces</option>
                <option value="	">Tab</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Attribute prefix</span>
                <span className="setting-hint">Prefix for XML attributes in JSON keys</span>
              </div>
              <input
                type="text"
                className="setting-input-small"
                value={settings.attributePrefix}
                onChange={(e) => onUpdate({ attributePrefix: e.target.value })}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Appearance</legend>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Theme</span>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => onUpdate({ theme: e.target.value as AppSettings['theme'] })}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </fieldset>

          <fieldset>
            <legend>About</legend>
            <div className="settings-about">
              <p><strong>JsonToXML</strong> v1.0.0</p>
              <p>Free, private JSON / XML converter. All processing runs in your browser — nothing is sent to a server.</p>
            </div>
          </fieldset>

          <div className="settings-footer">
            <button
              className="btn btn-ghost settings-reset-btn"
              onClick={() => onUpdate(DEFAULT_SETTINGS)}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
