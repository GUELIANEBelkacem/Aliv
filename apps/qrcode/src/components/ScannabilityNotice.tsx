import { Banner } from '@aliv/ui';
import type { ScannabilityResult } from '../lib/scannability';

interface ScannabilityNoticeProps {
  result: ScannabilityResult;
}

export function ScannabilityNotice({ result }: ScannabilityNoticeProps) {
  if (result.level === 'ok') return null;
  return (
    <div data-testid="scannability" data-severity={result.level}>
      <Banner severity={result.level === 'fail' ? 'fail' : 'warn'}>
        {result.messages[0]}
      </Banner>
    </div>
  );
}
