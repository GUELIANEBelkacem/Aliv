import type { ComponentType } from 'react';

export interface RailItem<T extends string> {
  id: T;
  label: string;
  icon: ComponentType<{ 'aria-hidden'?: boolean }>;
  badge?: 'warn' | 'fail';
}

interface SectionRailProps<T extends string> {
  items: RailItem<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function SectionRail<T extends string>({ items, active, onChange }: SectionRailProps<T>) {
  return (
    <nav className="qr-rail" aria-label="Tool sections">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            className={`qr-rail-btn${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
            data-rail-id={item.id}
            title={item.label}
          >
            <Icon aria-hidden />
            <span className="qr-rail-label">{item.label}</span>
            {item.badge && <span className={`qr-rail-badge is-${item.badge}`} aria-label={`${item.badge} indicator`} />}
          </button>
        );
      })}
    </nav>
  );
}
