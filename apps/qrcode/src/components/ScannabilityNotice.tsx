import type { ScannabilityResult } from '../lib/scannability';

interface ScannabilityNoticeProps {
  result: ScannabilityResult;
}

export function ScannabilityNotice({ result }: ScannabilityNoticeProps) {
  if (result.level === 'ok') return null;
  return (
    <div
      className={`qr-banner${result.level === 'fail' ? ' is-fail' : ''}`}
      role="status"
      data-testid="scannability"
      data-severity={result.level}
    >
      {result.messages[0]}
    </div>
  );
}
