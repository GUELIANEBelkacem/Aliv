import type { ContentType } from './types';

const TABS: { value: ContentType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'url', label: 'URL' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'vcard', label: 'vCard' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone' },
  { value: 'geo', label: 'Geo' },
  { value: 'calendar', label: 'Event' },
];

interface ContentTabsProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
}

export function ContentTabs({ value, onChange }: ContentTabsProps) {
  return (
    <div className="qr-segmented qr-content-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          className={value === tab.value ? 'is-active' : ''}
          onClick={() => onChange(tab.value)}
          data-content-type={tab.value}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

