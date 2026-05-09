import { useQrPreview } from '../hooks/useQrPreview';
import type { QrOptions } from '../lib/types';

interface QrPreviewProps {
  options: QrOptions;
}

export function QrPreview({ options }: QrPreviewProps) {
  const { containerRef } = useQrPreview(options);
  return (
    <div className="qr-preview-wrap">
      <div className="qr-preview" data-testid="qr-preview" ref={containerRef} />
    </div>
  );
}
