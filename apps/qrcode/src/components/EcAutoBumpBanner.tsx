import { Banner } from '@aliv/ui';
import type { ErrorCorrection } from '../lib/types';

export type AutoBumpReason = 'logo' | 'padding' | 'both';

interface EcAutoBumpBannerProps {
  show: boolean;
  recommended: ErrorCorrection;
  reason: AutoBumpReason;
}

function bodyCopy(reason: AutoBumpReason, level: ErrorCorrection): string {
  const tail = `error correction raised to ${level} so the QR stays scannable. Override below if you'd rather keep the lower level.`;
  if (reason === 'logo') return `Your logo is large enough that we ${tail.replace('raised', 'raised')}`;
  if (reason === 'padding') return `The padding around the QR is large; ${tail}`;
  return `Big logo plus a wide padding — ${tail}`;
}

export function EcAutoBumpBanner({ show, recommended, reason }: EcAutoBumpBannerProps) {
  if (!show) return null;
  return (
    <div data-testid="logo-ec-warning">
      <Banner severity="warn" title={`Error correction bumped to ${recommended}`}>
        {bodyCopy(reason, recommended)}
      </Banner>
    </div>
  );
}
