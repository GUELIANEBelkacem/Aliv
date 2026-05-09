import type { MutableRefObject } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { useQrPreview } from '../hooks/useQrPreview';
import type { QrOptions } from '../lib/types';

interface QrPreviewProps {
  options: QrOptions;
  qrRef?: MutableRefObject<QRCodeStyling | null>;
}

export function QrPreview({ options, qrRef }: QrPreviewProps) {
  const { containerRef } = useQrPreview(options, qrRef);
  return (
    <div className="qr-preview-wrap">
      <div className="qr-preview" data-testid="qr-preview" ref={containerRef} />
    </div>
  );
}
