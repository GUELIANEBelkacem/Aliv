import type { HTMLAttributes, ReactNode } from 'react';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'panel' | 'elevated';
  children: ReactNode;
}

export function Surface({ variant = 'glass', className = '', children, ...rest }: SurfaceProps) {
  const cls = `aliv-surface aliv-surface-${variant}${className ? ` ${className}` : ''}`;
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
