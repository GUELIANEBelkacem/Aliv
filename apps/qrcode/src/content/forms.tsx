import { SegmentedControl } from '@aliv/ui';
import type { ContentData, WifiAuth } from './types';

interface FormProps<T extends ContentData> {
  data: T;
  onChange: (data: T) => void;
}

function field(
  id: string,
  label: string,
  value: string,
  onChange: (v: string) => void,
  opts: { hint?: string; type?: string; required?: boolean; invalid?: boolean; autoFocus?: boolean } = {},
) {
  const { hint, type = 'text', required, invalid, autoFocus } = opts;
  return (
    <div className="qr-field" key={id}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className="qr-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        autoFocus={autoFocus}
      />
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
        autoFocus
      />
    </div>
  );
}

export function UrlForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'url' }>>) {
  return field('content-url', 'URL', data.url, (v) => onChange({ ...data, url: v }), {
    hint: 'https:// is added automatically if missing.',
    required: true,
    invalid: !data.url.trim(),
    autoFocus: true,
  });
}

const WIFI_AUTH_OPTIONS: { value: WifiAuth; label: string }[] = [
  { value: 'WPA', label: 'WPA / WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'None' },
];

export function WifiForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'wifi' }>>) {
  return (
    <>
      {field('content-ssid', 'SSID', data.ssid, (v) => onChange({ ...data, ssid: v }), {
        required: true,
        invalid: !data.ssid,
        autoFocus: true,
      })}
      {data.auth !== 'nopass' && field('content-pass', 'Password', data.password, (v) => onChange({ ...data, password: v }), {
        required: true,
        invalid: !data.password,
      })}
      <div className="qr-field">
        <label>Auth</label>
        <SegmentedControl<WifiAuth>
          value={data.auth}
          options={WIFI_AUTH_OPTIONS}
          onChange={(auth) => onChange({ ...data, auth })}
          ariaLabel="Auth"
          full
        />
      </div>
      <div className="qr-field">
        <label className="qr-checkbox-label">
          <input type="checkbox" checked={data.hidden} onChange={(e) => onChange({ ...data, hidden: e.target.checked })} />
          Hidden network
        </label>
      </div>
    </>
  );
}

export function VCardForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'vcard' }>>) {
  return (
    <>
      {field('vc-fn', 'First name', data.firstName, (v) => onChange({ ...data, firstName: v }), { required: true, invalid: !data.firstName, autoFocus: true })}
      {field('vc-ln', 'Last name', data.lastName, (v) => onChange({ ...data, lastName: v }))}
      {field('vc-org', 'Organization', data.org ?? '', (v) => onChange({ ...data, org: v }))}
      {field('vc-title', 'Title', data.title ?? '', (v) => onChange({ ...data, title: v }))}
      {field('vc-phone', 'Phone', data.phone ?? '', (v) => onChange({ ...data, phone: v }))}
      {field('vc-email', 'Email', data.email ?? '', (v) => onChange({ ...data, email: v }), { type: 'email' })}
      {field('vc-url', 'Website', data.url ?? '', (v) => onChange({ ...data, url: v }))}
      {field('vc-addr', 'Street address', data.address ?? '', (v) => onChange({ ...data, address: v }))}
    </>
  );
}

export function EmailForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'email' }>>) {
  return (
    <>
      {field('em-to', 'To', data.to, (v) => onChange({ ...data, to: v }), { type: 'email', required: true, invalid: !data.to, autoFocus: true })}
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
      {field('sms-phone', 'Phone', data.phone, (v) => onChange({ ...data, phone: v }), { type: 'tel', required: true, invalid: !data.phone, autoFocus: true })}
      <div className="qr-field">
        <label htmlFor="sms-body">Message</label>
        <textarea id="sms-body" className="qr-textarea" value={data.body ?? ''} onChange={(e) => onChange({ ...data, body: e.target.value })} />
      </div>
    </>
  );
}

export function PhoneForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'phone' }>>) {
  return field('ph-number', 'Phone', data.phone, (v) => onChange({ ...data, phone: v }), { type: 'tel', required: true, invalid: !data.phone, autoFocus: true });
}

export function GeoForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'geo' }>>) {
  return (
    <>
      {field('geo-lat', 'Latitude', String(data.lat ?? ''), (v) => onChange({ ...data, lat: v === '' ? undefined : Number(v) }), { hint: '-90 to 90', type: 'number', required: true, autoFocus: true })}
      {field('geo-lon', 'Longitude', String(data.lon ?? ''), (v) => onChange({ ...data, lon: v === '' ? undefined : Number(v) }), { hint: '-180 to 180', type: 'number', required: true })}
      {field('geo-label', 'Label', data.label ?? '', (v) => onChange({ ...data, label: v }))}
    </>
  );
}

export function CalendarForm({ data, onChange }: FormProps<Extract<ContentData, { type: 'calendar' }>>) {
  return (
    <>
      {field('cal-title', 'Title', data.title, (v) => onChange({ ...data, title: v }), { required: true, invalid: !data.title, autoFocus: true })}
      {field('cal-loc', 'Location', data.location ?? '', (v) => onChange({ ...data, location: v }))}
      {field('cal-start', 'Starts', data.start, (v) => onChange({ ...data, start: v }), { type: 'datetime-local', required: true, hint: 'In your local timezone — stored as UTC.' })}
      {field('cal-end', 'Ends', data.end, (v) => onChange({ ...data, end: v }), { type: 'datetime-local', required: true })}
      <div className="qr-field">
        <label htmlFor="cal-desc">Description</label>
        <textarea id="cal-desc" className="qr-textarea" value={data.description ?? ''} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      </div>
    </>
  );
}
