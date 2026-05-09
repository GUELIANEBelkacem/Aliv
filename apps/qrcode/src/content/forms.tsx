import type { ContentData, WifiAuth } from './types';

interface FormProps<T extends ContentData> {
  data: T;
  onChange: (data: T) => void;
}

function field(id: string, label: string, value: string, onChange: (v: string) => void, hint?: string, type: string = 'text') {
  return (
    <div className="qr-field" key={id}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} className="qr-input" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="qr-field-hint">{hint}</span>}
    </div>
  );
}

export function TextForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'text' }>>) {
  return (
    <div className="qr-field">
      <label htmlFor="content-text">Text</label>
      <textarea
        id="content-text"
        className="qr-textarea"
        value={data.text}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
      />
    </div>
  );
}

export function UrlForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'url' }>>) {
  return field('content-url', 'URL', data.url, (v) => onChange({ ...data, url: v }), 'https:// is added automatically if missing.');
}

export function WifiForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'wifi' }>>) {
  const auths: WifiAuth[] = ['WPA', 'WEP', 'nopass'];
  return (
    <>
      {field('content-ssid', 'SSID', data.ssid, (v) => onChange({ ...data, ssid: v }))}
      {data.auth !== 'nopass' && field('content-pass', 'Password', data.password, (v) => onChange({ ...data, password: v }))}
      <div className="qr-field">
        <label>Auth</label>
        <div className="qr-segmented" role="radiogroup">
          {auths.map((a) => (
            <button key={a} role="radio" aria-checked={data.auth === a} className={data.auth === a ? 'is-active' : ''} onClick={() => onChange({ ...data, auth: a })}>{a}</button>
          ))}
        </div>
      </div>
      <div className="qr-field">
        <label><input type="checkbox" checked={data.hidden} onChange={(e) => onChange({ ...data, hidden: e.target.checked })} /> Hidden network</label>
      </div>
    </>
  );
}

export function VCardForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'vcard' }>>) {
  return (
    <>
      {field('vc-fn', 'First name', data.firstName, (v) => onChange({ ...data, firstName: v }))}
      {field('vc-ln', 'Last name', data.lastName, (v) => onChange({ ...data, lastName: v }))}
      {field('vc-org', 'Organization', data.org ?? '', (v) => onChange({ ...data, org: v }))}
      {field('vc-title', 'Title', data.title ?? '', (v) => onChange({ ...data, title: v }))}
      {field('vc-phone', 'Phone', data.phone ?? '', (v) => onChange({ ...data, phone: v }))}
      {field('vc-email', 'Email', data.email ?? '', (v) => onChange({ ...data, email: v }), undefined, 'email')}
      {field('vc-url', 'Website', data.url ?? '', (v) => onChange({ ...data, url: v }))}
      {field('vc-addr', 'Address', data.address ?? '', (v) => onChange({ ...data, address: v }))}
    </>
  );
}

export function EmailForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'email' }>>) {
  return (
    <>
      {field('em-to', 'To', data.to, (v) => onChange({ ...data, to: v }), undefined, 'email')}
      {field('em-subj', 'Subject', data.subject ?? '', (v) => onChange({ ...data, subject: v }))}
      <div className="qr-field">
        <label htmlFor="em-body">Body</label>
        <textarea id="em-body" className="qr-textarea" value={data.body ?? ''} onChange={(e) => onChange({ ...data, body: e.target.value })} />
      </div>
    </>
  );
}

export function SmsForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'sms' }>>) {
  return (
    <>
      {field('sms-phone', 'Phone', data.phone, (v) => onChange({ ...data, phone: v }), undefined, 'tel')}
      <div className="qr-field">
        <label htmlFor="sms-body">Message</label>
        <textarea id="sms-body" className="qr-textarea" value={data.body ?? ''} onChange={(e) => onChange({ ...data, body: e.target.value })} />
      </div>
    </>
  );
}

export function PhoneForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'phone' }>>) {
  return field('ph-number', 'Phone', data.phone, (v) => onChange({ ...data, phone: v }), undefined, 'tel');
}

export function GeoForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'geo' }>>) {
  return (
    <>
      {field('geo-lat', 'Latitude', String(data.lat), (v) => onChange({ ...data, lat: Number(v) }), '-90 to 90', 'number')}
      {field('geo-lon', 'Longitude', String(data.lon), (v) => onChange({ ...data, lon: Number(v) }), '-180 to 180', 'number')}
      {field('geo-label', 'Label', data.label ?? '', (v) => onChange({ ...data, label: v }))}
    </>
  );
}

export function CalendarForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'calendar' }>>) {
  return (
    <>
      {field('cal-title', 'Title', data.title, (v) => onChange({ ...data, title: v }))}
      {field('cal-loc', 'Location', data.location ?? '', (v) => onChange({ ...data, location: v }))}
      {field('cal-start', 'Starts', data.start, (v) => onChange({ ...data, start: v }), undefined, 'datetime-local')}
      {field('cal-end', 'Ends', data.end, (v) => onChange({ ...data, end: v }), undefined, 'datetime-local')}
      <div className="qr-field">
        <label htmlFor="cal-desc">Description</label>
        <textarea id="cal-desc" className="qr-textarea" value={data.description ?? ''} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      </div>
    </>
  );
}
