import { useEffect, useMemo, useState } from 'react';
import { Slider, SegmentedControl } from '@aliv/ui';
import { LogoUpload } from './LogoUpload';
import { clipLogoToShape } from '../lib/logo-utils';
import {
  computeLogoSizeBuckets,
  labelToRatio,
  nearestBucketIndex,
  type LogoSizeBucket,
} from '../lib/logo-size';
import { safeMaxPadding } from '../lib/ec-rules';
import type { ErrorCorrection, LogoConfig, LogoSizeLabel } from '../lib/types';
import { LOGO_SIZE_LABELS } from '../lib/types';

interface LogoControlsProps {
  logo: LogoConfig | undefined;
  onChange: (logo: LogoConfig | undefined) => void;
  moduleCount: number;
  /** Inscribed QR pixel size from the frame layout — drives dotSize. */
  qrPixelSize: number;
  /** The EC the engine will actually be at — drives bucket cell counts. */
  ec: ErrorCorrection;
}

const SHAPES = [
  { value: 'square' as const, label: 'Square' },
  { value: 'rounded' as const, label: 'Rounded' },
  { value: 'circle' as const, label: 'Circle' },
];

// Fallback buckets that work reasonably across QR versions when we don't
// yet know moduleCount (first render before the engine resolves).
const FALLBACK_BUCKETS: LogoSizeBucket[] = [
  { ratio: 0.16, cells: 3 },
  { ratio: 0.23, cells: 5 },
  { ratio: 0.30, cells: 7 },
];

export function LogoControls({
  logo,
  onChange,
  moduleCount,
  qrPixelSize,
  ec,
}: LogoControlsProps) {
  const [original, setOriginal] = useState<string | undefined>(logo?.src);

  useEffect(() => {
    if (!logo || !original) return;
    let cancelled = false;
    clipLogoToShape(original, logo.shape).then((src) => {
      if (cancelled || src === logo.src) return;
      onChange({ ...logo, src });
    }).catch(() => { /* ignore — keep last good src */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo?.shape, original]);

  const buckets = useMemo<LogoSizeBucket[]>(() => {
    if (moduleCount <= 0) return FALLBACK_BUCKETS;
    const computed = computeLogoSizeBuckets({
      moduleCount,
      ec,
      // Extended range so EC=H + moduleCount=33 produces 4 buckets
      // (cells 5/7/9/11) instead of just 2.
      range: { min: 0.10, max: 0.40 },
    });
    return computed.length > 0 ? computed : FALLBACK_BUCKETS;
  }, [moduleCount, ec]);

  // Always render the full 4-label picker (S/M/L/XL). Picking a label whose
  // EC differs from the current effective EC is part of the auto-EC flow:
  // setting the label triggers a recommendedEc bump, the engine re-renders,
  // and the sync effect snaps sizeRatio to the new bucket on the next render.
  const activeLabel: LogoSizeLabel = logo?.size ?? 'M';
  const currentIndex = logo ? nearestBucketIndex(buckets, logo.sizeRatio) : 0;
  const currentBucket = buckets[currentIndex];

  // Cap padding so the rendered logo image is always at least
  // MIN_EMBEDDED_LOGO_PX wide; past that qr-code-styling produces a
  // zero/negative-width <image> that slips to the corner of the stage.
  const dotSize = moduleCount > 0 ? qrPixelSize / moduleCount : 0;
  const cells = currentBucket?.cells ?? 0;
  const maxPadding = safeMaxPadding({ cells, dotSize });

  // Clamp any previously-stored padding that no longer fits (e.g. user
  // switched to circle frame which shrank the inscribed QR).
  useEffect(() => {
    if (!logo) return;
    if (logo.padding > maxPadding) {
      onChange({ ...logo, padding: maxPadding });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPadding]);

  function setSrc(src: string | undefined) {
    if (!src) {
      setOriginal(undefined);
      onChange(undefined);
      return;
    }
    setOriginal(src);
    const defaultBucket = buckets[Math.min(1, buckets.length - 1)] ?? FALLBACK_BUCKETS[1];
    onChange({
      src,
      size: logo?.size ?? 'M',
      sizeRatio: logo?.sizeRatio ?? defaultBucket.ratio,
      padding: logo?.padding ?? 6,
      shape: logo?.shape ?? 'square',
    });
  }

  // Keep logo.sizeRatio in sync with the current label. When buckets change
  // — content edit, EC bump from a label switch — re-snap the ratio. Never
  // touches the LABEL; that's the user's intent and is the input, not output.
  useEffect(() => {
    if (!logo || buckets.length === 0) return;
    const targetRatio = labelToRatio(activeLabel, buckets);
    if (targetRatio !== undefined && Math.abs(targetRatio - logo.sizeRatio) > 0.005) {
      onChange({ ...logo, sizeRatio: targetRatio });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, activeLabel]);

  return (
    <>
      <LogoUpload src={logo?.src} onChange={setSrc} />
      {logo && (
        <>
          <div className="qr-field">
            <label>Size</label>
            <SegmentedControl<LogoSizeLabel>
              value={activeLabel}
              options={LOGO_SIZE_LABELS.map((label) => ({ value: label, label }))}
              onChange={(label) => {
                // Snap to the best available bucket for this label *right now*.
                // If the chosen label lives at a different EC than the current
                // one (e.g. picking L while at EC=M), the EC bump triggered by
                // recommendedEcFromLogo will rebuild the buckets on the next
                // render and the sync effect will snap to the right ratio.
                const idx = Math.min(LOGO_SIZE_LABELS.indexOf(label), buckets.length - 1);
                const bucket = buckets[idx];
                onChange({
                  ...logo,
                  size: label,
                  sizeRatio: bucket?.ratio ?? logo.sizeRatio,
                });
              }}
              ariaLabel="Logo size"
              full
            />
            <span className="qr-field-hint">
              {currentBucket
                ? `≈ ${Math.round(currentBucket.ratio * 100)}% · ${currentBucket.cells}-cell`
                : 'No size available at this EC'}
            </span>
          </div>
          <Slider
            label="Padding"
            value={Math.min(logo.padding, maxPadding)}
            min={0}
            max={Math.max(1, maxPadding)}
            step={1}
            onChange={(v) => onChange({ ...logo, padding: Math.min(v, maxPadding) })}
            format={(v) => `${v} px`}
          />
          <div className="qr-field">
            <label>Shape</label>
            <SegmentedControl
              value={logo.shape}
              options={SHAPES}
              onChange={(shape) => onChange({ ...logo, shape })}
              ariaLabel="Logo shape"
              full
            />
            <span className="qr-field-hint">Clips the logo to the chosen frame before embedding.</span>
          </div>
        </>
      )}
    </>
  );
}
