import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = 'secondary', className = '', children, ...rest }: ButtonProps) {
  const cls = `aliv-btn aliv-btn-${variant}${className ? ` ${className}` : ''}`;
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
