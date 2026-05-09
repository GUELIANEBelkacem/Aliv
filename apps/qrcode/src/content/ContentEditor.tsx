import {
  TextForm, UrlForm, WifiForm, VCardForm, EmailForm, SmsForm, PhoneForm, GeoForm, CalendarForm,
} from './forms';
import type { ContentData } from './types';

interface ContentEditorProps {
  data: ContentData;
  onChange: (data: ContentData) => void;
}

export function ContentEditor({ data, onChange }: ContentEditorProps) {
  switch (data.type) {
    case 'text': return <TextForm data={data} onChange={onChange} />;
    case 'url': return <UrlForm data={data} onChange={onChange} />;
    case 'wifi': return <WifiForm data={data} onChange={onChange} />;
    case 'vcard': return <VCardForm data={data} onChange={onChange} />;
    case 'email': return <EmailForm data={data} onChange={onChange} />;
    case 'sms': return <SmsForm data={data} onChange={onChange} />;
    case 'phone': return <PhoneForm data={data} onChange={onChange} />;
    case 'geo': return <GeoForm data={data} onChange={onChange} />;
    case 'calendar': return <CalendarForm data={data} onChange={onChange} />;
  }
}
