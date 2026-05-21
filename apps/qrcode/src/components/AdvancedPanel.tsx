import { Banner } from '@aliv/ui';
import { ErrorCorrectionPicker } from './ErrorCorrectionPicker';
import { EC_LABEL, isManualEcUnsafe, recommendedEc } from '../lib/ec-rules';
import type { ErrorCorrection, QrOptions } from '../lib/types';

interface AdvancedPanelProps {
  options: QrOptions;
  effectiveEc: ErrorCorrection;
  advancedEc: boolean;
  onAdvancedChange: (advanced: boolean) => void;
  onEcChange: (ec: ErrorCorrection) => void;
}

/**
 * The "Advanced" rail panel. By default error correction is auto-tuned and
 * the section just shows the resulting choice. Toggling Advanced reveals the
 * picker; a manual choice below what the rule recommends surfaces an inline
 * warning that names the recommended level.
 */
export function AdvancedPanel({
  options,
  effectiveEc,
  advancedEc,
  onAdvancedChange,
  onEcChange,
}: AdvancedPanelProps) {
  const recommended = recommendedEc(options);
  const showUnsafeWarning = advancedEc && isManualEcUnsafe(options);

  return (
    <>
      <div className="qr-advanced-status" data-testid="qr-advanced-status">
        <div className="qr-advanced-status-row">
          <span className="qr-advanced-status-label">Error correction</span>
          <span className="qr-advanced-status-value">{EC_LABEL[effectiveEc]}</span>
        </div>
        <span className="qr-field-hint">
          {advancedEc ? 'You picked this yourself' : 'Auto-tuned for your logo and padding'}
        </span>
      </div>

      <label className="qr-checkbox-label">
        <input
          type="checkbox"
          checked={advancedEc}
          onChange={(e) => onAdvancedChange(e.target.checked)}
          data-testid="qr-advanced-toggle"
        />
        Let me set error correction myself
      </label>

      {advancedEc && (
        <>
          <ErrorCorrectionPicker
            value={options.errorCorrection}
            onChange={onEcChange}
            // Only enforce a floor when the rule was actually bumped from
            // baseline. With no logo / small padding the full L-H range is
            // open — the user is free to pick a lower level.
            minLevel={recommended === 'M' ? undefined : recommended}
          />
          {showUnsafeWarning && (
            <div data-testid="qr-advanced-unsafe-warn">
              <Banner severity="warn" title={`This setup usually needs ${EC_LABEL[recommended]} error correction`}>
                With <strong>{EC_LABEL[options.errorCorrection]}</strong> error correction your QR
                may fail to scan — large logos and wide padding leave less room for damage. Switch
                back to auto, or pick at least <strong>{EC_LABEL[recommended]}</strong>.
              </Banner>
            </div>
          )}
        </>
      )}
    </>
  );
}
