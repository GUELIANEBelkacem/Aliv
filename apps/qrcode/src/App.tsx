import { useCallback, useRef, useState, type ComponentType, type ReactNode } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { Sparkles, Palette, Shapes, ImagePlus, Sliders, Download } from 'lucide-react';
import { AppShell, type Shortcut } from '@aliv/ui';
import { copyPngToClipboard } from './lib/export';
import { CONTENT_TYPE_ORDER } from './content/order';
import { QrPreview } from './components/QrPreview';
import { ErrorCorrectionPicker } from './components/ErrorCorrectionPicker';
import { SizeMarginControls } from './components/SizeMarginControls';
import { ColorControls } from './components/ColorControls';
import { ShapeControls } from './components/ShapeControls';
import { LogoControls } from './components/LogoControls';
import { LogoEcWarning } from './components/LogoEcWarning';
import { ExportPanel } from './components/ExportPanel';
import { ScannabilityNotice } from './components/ScannabilityNotice';
import { assess } from './lib/scannability';
import { QrSettings } from './settings/QrSettings';
import { applyPreset, type Preset } from './settings/presets';
import { ContentTabs } from './content/ContentTabs';
import { Hero } from './sections/Hero';
import { Faq } from './sections/Faq';
import { ContentEditor } from './content/ContentEditor';
import { DEFAULT_CONTENT } from './content/defaults';
import { buildContent } from './content/builders';
import type { ContentData, ContentType } from './content/types';
import { DEFAULT_QR_OPTIONS, type QrOptions } from './lib/types';

const LARGE_LOGO_THRESHOLD = 0.2;

const SHORTCUTS_LIST = [
  { keys: 'Ctrl+Shift+C', description: 'Copy PNG' },
  { keys: 'Ctrl+Shift+S', description: 'Next content type' },
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: 'Plain text',
  url: 'Web address',
  wifi: 'Wi-Fi network',
  vcard: 'Contact card',
  email: 'mailto link',
  sms: 'SMS message',
  phone: 'Phone number',
  geo: 'Map coordinates',
  calendar: 'Calendar event',
};

interface SectionProps {
  icon: ComponentType<{ 'aria-hidden'?: boolean }>;
  title: string;
  hint?: string;
  children: ReactNode;
}

function Section({ icon: Icon, title, hint, children }: SectionProps) {
  return (
    <section className="qr-control-group">
      <header className="qr-group-header">
        <Icon aria-hidden />
        <h3>{title}</h3>
        {hint && <span className="qr-group-hint">{hint}</span>}
      </header>
      {children}
    </section>
  );
}

export default function App() {
  const [contentType, setContentType] = useState<ContentType>('url');
  const [contentMap, setContentMap] = useState<Record<ContentType, ContentData>>(DEFAULT_CONTENT);
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);
  const [userTouchedEc, setUserTouchedEc] = useState(false);
  const qrRef = useRef<QRCodeStyling | null>(null);

  const data = contentMap[contentType];
  const built = buildContent(data);

  function update(patch: Partial<QrOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }));
  }

  function updateData(next: ContentData) {
    setContentMap((prev) => ({ ...prev, [next.type]: next }));
  }

  const bigLogo = !!(options.logo && options.logo.sizeRatio > LARGE_LOGO_THRESHOLD);
  const autoBump = bigLogo && !userTouchedEc && options.errorCorrection !== 'H';

  const effectiveOptions: QrOptions = {
    ...options,
    data: built.ok ? (built.value ?? '') : ' ',
    errorCorrection: autoBump ? 'H' : options.errorCorrection,
  };

  const scannability = assess(effectiveOptions);

  function handleEcChange(level: QrOptions['errorCorrection']) {
    setUserTouchedEc(true);
    update({ errorCorrection: level });
  }

  function handleApplyPreset(preset: Preset) {
    setOptions((prev) => applyPreset(prev, preset));
    setUserTouchedEc(false);
  }

  function handleReset(reset: QrOptions) {
    setOptions(reset);
    setUserTouchedEc(false);
  }

  const cycleContent = useCallback(() => {
    const idx = CONTENT_TYPE_ORDER.indexOf(contentType);
    setContentType(CONTENT_TYPE_ORDER[(idx + 1) % CONTENT_TYPE_ORDER.length]);
  }, [contentType]);

  const copyPng = useCallback(async () => {
    if (qrRef.current) await copyPngToClipboard(qrRef.current);
  }, []);

  const shortcuts: Shortcut[] = [
    { keys: 'Ctrl+Shift+C', handler: copyPng, whenInInput: true, description: 'Copy PNG' },
    { keys: 'Ctrl+Shift+S', handler: cycleContent, whenInInput: true, description: 'Next content type' },
  ];

  return (
    <AppShell
      appId="qrcode"
      shortcuts={shortcuts}
      shortcutsList={SHORTCUTS_LIST}
      settings={<QrSettings onApplyPreset={handleApplyPreset} onReset={handleReset} />}
    >
      <Hero />
      <div className="qr-app">
        <div className="qr-controls">
          <Section icon={Sparkles} title="Content" hint={CONTENT_TYPE_LABELS[contentType]}>
            <ContentTabs value={contentType} onChange={setContentType} />
            <div className="qr-content-form">
              <ContentEditor data={data} onChange={updateData} />
            </div>
            {!built.ok && built.error && (
              <span className="qr-field-hint" style={{ color: 'var(--danger)' }}>{built.error}</span>
            )}
          </Section>

          <Section icon={Palette} title="Colors">
            <ColorControls
              foreground={options.foreground}
              background={options.background}
              eyeColor={options.eyeColor}
              onForegroundChange={(foreground) => update({ foreground })}
              onBackgroundChange={(color) => update({ background: { type: 'solid', color } })}
              onEyeColorChange={(eyeColor) => update({ eyeColor })}
            />
          </Section>

          <Section icon={Shapes} title="Shapes">
            <ShapeControls
              moduleShape={options.moduleShape}
              eyeFrameShape={options.eyeFrameShape}
              eyeBallShape={options.eyeBallShape}
              onModuleShape={(moduleShape) => update({ moduleShape })}
              onEyeFrameShape={(eyeFrameShape) => update({ eyeFrameShape })}
              onEyeBallShape={(eyeBallShape) => update({ eyeBallShape })}
            />
          </Section>

          <Section icon={ImagePlus} title="Logo" hint={options.logo ? 'Embedded' : 'Optional'}>
            <LogoControls logo={options.logo} onChange={(logo) => update({ logo })} />
          </Section>

          <LogoEcWarning show={autoBump} />
          <ScannabilityNotice result={scannability} />

          <Section icon={Sliders} title="Format">
            <ErrorCorrectionPicker
              value={effectiveOptions.errorCorrection}
              onChange={handleEcChange}
            />
            <SizeMarginControls
              size={options.size}
              margin={options.margin}
              onSize={(size) => update({ size })}
              onMargin={(margin) => update({ margin })}
            />
          </Section>

          <Section icon={Download} title="Export">
            <ExportPanel qrRef={qrRef} filenameSeed={effectiveOptions.data} />
          </Section>
        </div>
        <QrPreview options={effectiveOptions} qrRef={qrRef} scannability={scannability} />
      </div>
      <Faq />
    </AppShell>
  );
}
