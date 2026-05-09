import { buildText } from './text';
import { buildUrl } from './url';
import { buildWifi } from './wifi';
import { buildVCard } from './vcard';
import { buildEmail } from './email';
import { buildSms } from './sms';
import { buildPhone } from './phone';
import { buildGeo } from './geo';
import { buildCalendar } from './calendar';
import type { BuildResult, ContentData } from '../types';

export function buildContent(data: ContentData): BuildResult {
  switch (data.type) {
    case 'text': return buildText(data.text);
    case 'url': return buildUrl(data.url);
    case 'wifi': return buildWifi(data.ssid, data.password, data.auth, data.hidden);
    case 'vcard': return buildVCard(data);
    case 'email': return buildEmail(data.to, data.subject, data.body);
    case 'sms': return buildSms(data.phone, data.body);
    case 'phone': return buildPhone(data.phone);
    case 'geo': return buildGeo(data.lat, data.lon, data.label);
    case 'calendar': return buildCalendar(data);
  }
}

export { buildText, buildUrl, buildWifi, buildVCard, buildEmail, buildSms, buildPhone, buildGeo, buildCalendar };
