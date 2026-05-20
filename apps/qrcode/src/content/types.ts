export type ContentType = 'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'sms' | 'phone' | 'geo' | 'calendar';

export type WifiAuth = 'WPA' | 'WEP' | 'nopass';

export type ContentData =
  | { type: 'text'; text: string }
  | { type: 'url'; url: string }
  | { type: 'wifi'; ssid: string; password: string; auth: WifiAuth; hidden: boolean }
  | { type: 'vcard'; firstName: string; lastName: string; org?: string; title?: string; phone?: string; email?: string; url?: string; address?: string }
  | { type: 'email'; to: string; subject?: string; body?: string }
  | { type: 'sms'; phone: string; body?: string }
  | { type: 'phone'; phone: string }
  | { type: 'geo'; lat: number | undefined; lon: number | undefined; label?: string }
  | { type: 'calendar'; title: string; description?: string; location?: string; start: string; end: string };

export interface BuildResult {
  ok: boolean;
  value?: string;
  error?: string;
}
