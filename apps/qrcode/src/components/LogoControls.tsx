import { useEffect, useMemo, useState } from 'react';
import { Slider, SegmentedControl } from '@aliv/ui';
import { LogoUpload } from './LogoUpload';
import { clipLogoToShape } from '../lib/logo-utils';
import {
  computeLogoSizeBuckets,
  labeledBuckets,
  labelToRatio,
  nearestBucketIndex,
  type LogoSizeBucket,
} from '../lib/logo-size';
import { safeMaxPadding } from '../lib/ec-rules';
import type { ErrorCorrection, LogoConfig, LogoSizeLabel } from '../lib/types';

interface LogoControlsProps {
  logo: LogoConfig | undefined;
  onChange: (logo: LogoConfig | undefined) => void;
  moduleCount: number;
  /** Inscribed QR pixel size from the frame layout — drives dotSize. */
  qrPixelSize: number;
  /** EC the user has explicitly locked, or undefined if autoBump decides. */
  userEc?: ErrorCorrection;
  autoBumpThreshold: number;
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
  userEc,
  autoBumpThreshold,
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
      userEc,
      autoBumpThreshold,
      range: { min: 0.15, max: 0.35 },
    });
    return computed.length > 0 ? computed : FALLBACK_BUCKETS;
  }, [moduleCount, userEc, autoBumpThreshold]);

  const items = useMemo(() => labeledBuckets(buckets), [buckets]);
  // Clamp the active label to the available bucket count — e.g. user picked XL
  // but the new QR + EC combination only yields 3 distinct cell counts → fall
  // back to L without losing their intent.
  const activeLabel: LogoSizeLabel | undefined = logo
    ? (items.find((b) => b.label === logo.size)?.label ?? items[items.length - 1]?.label)
    : undefined;
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

  // Keep options.logo.sizeRatio in sync with options.logo.size. When buckets
  // change (content edit → new module count, or EC change), the label-to-ratio
  // mapping shifts; we rewrite sizeRatio so the engine renders what the user
  // picked. Idempotent — does nothing if already aligned.
  useEffect(() => {
    if (!logo || items.length === 0) return;
    const targetRatio = labelToRatio(activeLabel ?? 'M', buckets);
    if (targetRatio !== undefined && Math.abs(targetRatio - logo.sizeRatio) > 0.005) {
      onChange({ ...logo, size: activeLabel ?? 'M', sizeRatio: targetRatio });
    } else if (activeLabel && activeLabel !== logo.size) {
      // Label drifted (e.g. XL → L because bucket count shrank). Keep ratio.
      onChange({ ...logo, size: activeLabel });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, activeLabel]);

  return (
    <>
      <LogoUpload src={logo?.src} onChange={setSrc} />
      {logo && items.length > 0 && (
        <>
          <div className="qr-field">
            <label>Size</label>
            <SegmentedControl<LogoSizeLabel>
              value={activeLabel ?? items[0].label}
              options={items.map(({ label }) => ({ value: label, label }))}
              onChange={(label) => {
                const target = items.find((b) => b.label === label)?.bucket;
                if (target) onChange({ ...logo, size: label, sizeRatio: target.ratio });
              }}
              ariaLabel="Logo size"
              full
            />
            <span className="qr-field-hint">
              {currentBucket
                ? `≈ ${Math.round(currentBucket.ratio * 100)}% · ${currentBucket.cells}-cell`
                : 'No size available at this EC'}
              {items.length < 4 && ' · more sizes at higher error correction'}
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
