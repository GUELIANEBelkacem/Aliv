import { Banner } from '@aliv/ui';
import type { ScannabilityResult } from '../lib/scannability';

interface ScannabilityNoticeProps {
  result: ScannabilityResult;
}

export function ScannabilityNotice({ result }: ScannabilityNoticeProps) {
  if (result.level === 'ok') return null;
  return (
    <div
      data-testid="qr-scannability-notice"
      data-severity={result.level}
      role="status"
      aria-live="polite"
    >
      <Banner severity={result.level === 'fail' ? 'fail' : 'warn'}>
        {result.messages[0]}
      </Banner>
    </div>
  );
}
