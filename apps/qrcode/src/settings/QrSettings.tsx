import { Button } from '@aliv/ui';
import { PresetGallery } from './PresetGallery';
import { type Preset, resetDefaults } from './presets';
import type { QrOptions } from '../lib/types';

interface QrSettingsProps {
  onApplyPreset: (preset: Preset) => void;
  onReset: (options: QrOptions) => void;
  currentPresetId?: string;
}

export function QrSettings({ onApplyPreset, onReset, currentPresetId }: QrSettingsProps) {
  return (
    <div className="qr-settings-body">
      <h2 className="settings-title">Settings</h2>
      <section>
        <h3 className="settings-section-title">Presets</h3>
        <PresetGallery onApply={onApplyPreset} currentPresetId={currentPresetId} />
      </section>
      <section>
        <h3 className="settings-section-title">Reset</h3>
        <Button variant="ghost" onClick={() => onReset(resetDefaults())}>Reset to defaults</Button>
      </section>
    </div>
  );
}
