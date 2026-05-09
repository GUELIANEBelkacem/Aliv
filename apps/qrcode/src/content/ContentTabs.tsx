import { Type, Link, Wifi, User, Mail, MessageSquare, Phone, MapPin, Calendar } from 'lucide-react';
import { SegmentedControl } from '@aliv/ui';
import type { ContentType } from './types';

const TABS = [
  { value: 'text' as ContentType, icon: Type, label: 'Text' },
  { value: 'url' as ContentType, icon: Link, label: 'URL' },
  { value: 'wifi' as ContentType, icon: Wifi, label: 'Wi-Fi' },
  { value: 'vcard' as ContentType, icon: User, label: 'vCard' },
  { value: 'email' as ContentType, icon: Mail, label: 'Email' },
  { value: 'sms' as ContentType, icon: MessageSquare, label: 'SMS' },
  { value: 'phone' as ContentType, icon: Phone, label: 'Phone' },
  { value: 'geo' as ContentType, icon: MapPin, label: 'Geo' },
  { value: 'calendar' as ContentType, icon: Calendar, label: 'Event' },
];

interface ContentTabsProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
}

export function ContentTabs({ value, onChange }: ContentTabsProps) {
  const options = TABS.map((tab) => {
    const Icon = tab.icon;
    return {
      value: tab.value,
      label: (
        <span data-content-type={tab.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon aria-hidden="true" />
          <span className="qr-tab-label">{tab.label}</span>
        </span>
      ),
    };
  });
  return (
    <div className="qr-content-tabs-wrap">
      <SegmentedControl<ContentType>
        value={value}
        options={options}
        onChange={onChange}
        ariaLabel="Content type"
        size="sm"
      />
    </div>
  );
}
