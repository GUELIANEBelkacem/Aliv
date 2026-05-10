import type { CSSProperties, MutableRefObject } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { useQrPreview } from '../hooks/useQrPreview';
import type { QrOptions, FrameShape } from '../lib/types';
import type { ScannabilityResult } from '../lib/scannability';

interface QrPreviewProps {
  options: QrOptions;
  qrRef?: MutableRefObject<QRCodeStyling | null>;
  scannability?: ScannabilityResult;
}

const FRAME_RADIUS: Record<FrameShape, string> = {
  square: '8px',
  rounded: 'var(--radius-2xl)',
  circle: '50%',
};

export function QrPreview({ options, qrRef, scannability }: QrPreviewProps) {
  const { containerRef } = useQrPreview(options, qrRef);
  const dotClass = scannability?.level === 'fail'
    ? ' is-fail'
    : scannability?.level === 'warn'
      ? ' is-warn'
      : '';
  const label = scannability?.level === 'fail'
    ? 'May not scan'
    : scannability?.level === 'warn'
      ? 'Scannable — minor warnings'
      : 'Live preview · scannable';
  const stageStyle = { '--qr-frame-radius': FRAME_RADIUS[options.frameShape] } as CSSProperties;
  return (
    <div className="qr-preview-wrap">
      <div className="qr-preview-stage" style={stageStyle} data-frame={options.frameShape}>
        <div className="qr-preview" data-testid="qr-preview" ref={containerRef} />
      </div>
      <div className="qr-preview-meta">
        <span className={`qr-preview-meta-dot${dotClass}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}
