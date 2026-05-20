import { Banner } from '@aliv/ui';
import { ErrorCorrectionPicker } from './ErrorCorrectionPicker';
import { isManualEcUnsafe, recommendedEc } from '../lib/ec-rules';
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
 * the section just shows the resulting level. Toggling Advanced reveals the
 * L/M/Q/H picker; a manual choice below what the rule recommends surfaces an
 * inline warning that names the recommended level.
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
          <span className="qr-advanced-status-value">{effectiveEc}</span>
        </div>
        <span className="qr-field-hint">
          {advancedEc ? 'Manual override' : 'Auto-tuned from logo size + padding'}
        </span>
      </div>

      <label className="qr-checkbox-label">
        <input
          type="checkbox"
          checked={advancedEc}
          onChange={(e) => onAdvancedChange(e.target.checked)}
          data-testid="qr-advanced-toggle"
        />
        Show advanced controls
      </label>

      {advancedEc && (
        <>
          <ErrorCorrectionPicker
            value={options.errorCorrection}
            onChange={onEcChange}
          />
          {showUnsafeWarning && (
            <div data-testid="qr-advanced-unsafe-warn">
              <Banner severity="warn" title={`Auto would pick ${recommended}`}>
                Your settings would normally use {recommended}. Sticking with{' '}
                {options.errorCorrection} keeps the QR denser but lower-EC reads can
                miss under heavy logo coverage or large padding.
              </Banner>
            </div>
          )}
        </>
      )}
    </>
  );
}
