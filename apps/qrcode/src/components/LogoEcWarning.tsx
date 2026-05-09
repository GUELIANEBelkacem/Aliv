import { Banner } from '@aliv/ui';

interface LogoEcWarningProps {
  show: boolean;
}

export function LogoEcWarning({ show }: LogoEcWarningProps) {
  if (!show) return null;
  return (
    <div data-testid="logo-ec-warning">
      <Banner severity="warn" title="Error correction bumped to H">
        Your logo is large enough that we raised error correction to H so the
        QR stays scannable. Override below if you'd rather keep the lower level.
      </Banner>
    </div>
  );
}
