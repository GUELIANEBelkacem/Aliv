import { DEFAULT_SETTINGS } from '../types/settings';
import type { AppSettings } from '../types/settings';

interface SettingsBodyProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
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

export function SettingsBody({ settings, onUpdate, autoConvertBlocked }: SettingsBodyProps) {
  return (
    <div className="settings-body">
      <h2 className="settings-title">Settings</h2>
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

      <div className="settings-footer">
        <button
          className="btn btn-ghost settings-reset-btn"
          onClick={() => onUpdate(DEFAULT_SETTINGS)}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
