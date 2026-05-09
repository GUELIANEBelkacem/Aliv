import type { ReactNode } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type BannerSeverity = 'info' | 'success' | 'warn' | 'fail';

interface BannerProps {
  severity?: BannerSeverity;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const ICONS: Record<BannerSeverity, typeof AlertTriangle> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  fail: AlertCircle,
};

export function Banner({ severity = 'info', title, children, action, className = '' }: BannerProps) {
  const Icon = ICONS[severity];
  return (
    <div className={`aliv-banner aliv-banner-${severity} ${className}`} role="status">
      <Icon className="aliv-banner-icon" aria-hidden="true" />
      <div className="aliv-banner-body">
        {title && <strong>{title}</strong>}
        <span>{children}</span>
      </div>
      {action && <div className="aliv-banner-action">{action}</div>}
    </div>
  );
}
