import type { ContentData, ContentType } from './types';

export const DEFAULT_CONTENT: Record<ContentType, ContentData> = {
  text: { type: 'text', text: 'Hello from Aliv' },
  url: { type: 'url', url: 'https://aliv.app' },
  wifi: { type: 'wifi', ssid: '', password: '', auth: 'WPA', hidden: false },
  vcard: { type: 'vcard', firstName: '', lastName: '' },
  email: { type: 'email', to: '' },
  sms: { type: 'sms', phone: '' },
  phone: { type: 'phone', phone: '' },
  geo: { type: 'geo', lat: undefined, lon: undefined },
  calendar: { type: 'calendar', title: '', start: '', end: '' },
};
