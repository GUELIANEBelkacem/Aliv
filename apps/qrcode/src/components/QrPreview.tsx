import type { CSSProperties } from 'react';
import { useEffect, useMemo } from 'react';
import { useQrPreview } from '../hooks/useQrPreview';
import { frameLayout } from '../lib/frame-shapes';
import type { QrOptions } from '../lib/types';
import type { ScannabilityResult } from '../lib/scannability';

interface QrPreviewProps {
  options: QrOptions;
  scannability?: ScannabilityResult;
  valid?: boolean;
  onModuleCount?: (count: number) => void;
}

export function QrPreview({ options, scannability, valid = true, onModuleCount }: QrPreviewProps) {
  const layout = useMemo(
    () => frameLayout(options.frameShape, options.size, options.background.color),
    [options.frameShape, options.size, options.background.color],
  );

  // Render the QR engine at the inscribed size so the corners stay inside the
  // frame's backdrop (REVIEW §8.3). The engine is structurally re-instantiated
  // on size jumps because we pass a new options object.
  const previewOptions = useMemo<QrOptions>(
    () => ({ ...options, size: layout.qr.size }),
    [options, layout.qr.size],
  );
  const { containerRef, moduleCount } = useQrPreview(previewOptions);

  useEffect(() => {
    if (moduleCount > 0) onModuleCount?.(moduleCount);
  }, [moduleCount, onModuleCount]);

  const dotClass = !valid
    ? ' is-invalid'
    : scannability?.level === 'fail'
      ? ' is-fail'
      : scannability?.level === 'warn'
        ? ' is-warn'
        : '';
  const label = !valid
    ? 'Preview only — fix the error before exporting'
    : scannability?.level === 'fail'
      ? 'May not scan'
      : scannability?.level === 'warn'
        ? 'Scannable — minor warnings'
        : 'Live preview · scannable';

  const stageStyle: CSSProperties = {
    width: layout.total,
    height: layout.total,
    position: 'relative',
  };
  const backdropStyle: CSSProperties | null = layout.backdrop
    ? {
        position: 'absolute',
        inset: 0,
        background: layout.backdrop.fill,
        borderRadius:
          layout.backdrop.kind === 'circle' ? '50%' : `${layout.backdrop.rx}px`,
      }
    : null;
  const qrStyle: CSSProperties = {
    position: 'absolute',
    left: layout.qr.x,
    top: layout.qr.y,
    width: layout.qr.size,
    height: layout.qr.size,
  };

  return (
    <div
      className="qr-preview-wrap"
      data-testid="qr-preview"
      data-valid={valid ? 'true' : 'false'}
    >
      <div
        className="qr-preview-stage"
        style={stageStyle}
        data-frame={options.frameShape}
        data-testid="qr-frame-stage"
      >
        {backdropStyle && <span className="qr-frame-backdrop" style={backdropStyle} aria-hidden="true" />}
        <div
          className="qr-preview"
          data-testid="qr-preview-canvas"
          ref={containerRef}
          style={qrStyle}
        />
      </div>
      <div className="qr-preview-meta">
        <span className={`qr-preview-meta-dot${dotClass}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}
