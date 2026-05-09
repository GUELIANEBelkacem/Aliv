interface LogoEcWarningProps {
  show: boolean;
}

export function LogoEcWarning({ show }: LogoEcWarningProps) {
  if (!show) return null;
  return (
    <div className="qr-banner" data-testid="logo-ec-warning">
      Logo is large — error correction was bumped to <strong>H</strong> to keep
      the QR scannable. You can change it back manually if you prefer.
    </div>
  );
}
