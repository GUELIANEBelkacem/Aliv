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
import { SectionRail, type RailItem } from './components/SectionRail';
import { assess } from './lib/scannability';
import { QrSettings } from './settings/QrSettings';
import { applyPreset, type Preset } from './settings/presets';
import { ContentTabs } from './content/ContentTabs';
import { FaqLauncher } from './sections/FaqLauncher';
import { Tagline } from './sections/Tagline';
import { ContentEditor } from './content/ContentEditor';
import { DEFAULT_CONTENT } from './content/defaults';
import { buildContent } from './content/builders';
import type { ContentData, ContentType } from './content/types';
import { DEFAULT_QR_OPTIONS, type QrOptions } from './lib/types';

const LARGE_LOGO_THRESHOLD = 0.2;

const SHORTCUTS_LIST = [
  { keys: 'Ctrl+Shift+C', description: 'Copy PNG' },
  { keys: 'Ctrl+Shift+S', description: 'Next content type' },
  { keys: 'Ctrl+1..6', description: 'Switch tool section' },
];

type SectionId = 'content' | 'colors' | 'shapes' | 'logo' | 'format' | 'export';

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

interface PanelProps {
  icon: ComponentType<{ 'aria-hidden'?: boolean }>;
  title: string;
  hint?: string;
  children: ReactNode;
}

function Panel({ icon: Icon, title, hint, children }: PanelProps) {
  return (
    <section className="qr-panel">
      <header className="qr-group-header">
        <Icon aria-hidden />
        <h3>{title}</h3>
        {hint && <span className="qr-group-hint">{hint}</span>}
      </header>
      <div className="qr-panel-body">{children}</div>
    </section>
  );
}

export default function App() {
  const [contentType, setContentType] = useState<ContentType>('url');
  const [contentMap, setContentMap] = useState<Record<ContentType, ContentData>>(DEFAULT_CONTENT);
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);
  const [userTouchedEc, setUserTouchedEc] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('content');
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

  const railItems: RailItem<SectionId>[] = [
    { id: 'content', label: 'Content', icon: Sparkles },
    { id: 'colors',  label: 'Colors',  icon: Palette },
    { id: 'shapes',  label: 'Shapes',  icon: Shapes },
    { id: 'logo',    label: 'Logo',    icon: ImagePlus, badge: autoBump ? 'warn' : undefined },
    {
      id: 'format',
      label: 'Format',
      icon: Sliders,
      badge: scannability.level === 'fail' ? 'fail' : scannability.level === 'warn' ? 'warn' : undefined,
    },
    { id: 'export',  label: 'Export',  icon: Download },
  ];

  const numericShortcuts: Shortcut[] = railItems.map((item, idx) => ({
    keys: `Ctrl+${idx + 1}`,
    handler: () => setActiveSection(item.id),
    whenInInput: true,
    description: `Switch to ${item.label}`,
  }));

  const shortcuts: Shortcut[] = [
    { keys: 'Ctrl+Shift+C', handler: copyPng, whenInInput: true, description: 'Copy PNG' },
    { keys: 'Ctrl+Shift+S', handler: cycleContent, whenInInput: true, description: 'Next content type' },
    ...numericShortcuts,
  ];

  return (
    <AppShell
      appId="qrcode"
      shortcuts={shortcuts}
      shortcutsList={SHORTCUTS_LIST}
      settings={<QrSettings onApplyPreset={handleApplyPreset} onReset={handleReset} />}
    >
      <Tagline />
      <div className="qr-app">
        <SectionRail items={railItems} active={activeSection} onChange={setActiveSection} />

        <div className="qr-panel-stage">
          {(autoBump || scannability.level !== 'ok') && (
            <div className="qr-notices">
              <LogoEcWarning show={autoBump} />
              <ScannabilityNotice result={scannability} />
            </div>
          )}

          {activeSection === 'content' && (
            <Panel icon={Sparkles} title="Content" hint={CONTENT_TYPE_LABELS[contentType]}>
              <ContentTabs value={contentType} onChange={setContentType} />
              <div className="qr-content-form">
                <ContentEditor data={data} onChange={updateData} />
              </div>
              {!built.ok && built.error && (
                <span className="qr-field-hint" style={{ color: 'var(--danger)' }}>{built.error}</span>
              )}
            </Panel>
          )}

          {activeSection === 'colors' && (
            <Panel icon={Palette} title="Colors">
              <ColorControls
                foreground={options.foreground}
                background={options.background}
                eyeColor={options.eyeColor}
                onForegroundChange={(foreground) => update({ foreground })}
                onBackgroundChange={(color) => update({ background: { type: 'solid', color } })}
                onEyeColorChange={(eyeColor) => update({ eyeColor })}
              />
            </Panel>
          )}

          {activeSection === 'shapes' && (
            <Panel icon={Shapes} title="Shapes">
              <ShapeControls
                moduleShape={options.moduleShape}
                eyeFrameShape={options.eyeFrameShape}
                eyeBallShape={options.eyeBallShape}
                frameShape={options.frameShape}
                onModuleShape={(moduleShape) => update({ moduleShape })}
                onEyeFrameShape={(eyeFrameShape) => update({ eyeFrameShape })}
                onEyeBallShape={(eyeBallShape) => update({ eyeBallShape })}
                onFrameShape={(frameShape) => update({ frameShape })}
              />
            </Panel>
          )}

          {activeSection === 'logo' && (
            <Panel icon={ImagePlus} title="Logo" hint={options.logo ? 'Embedded' : 'Optional'}>
              <LogoControls logo={options.logo} onChange={(logo) => update({ logo })} />
            </Panel>
          )}

          {activeSection === 'format' && (
            <Panel icon={Sliders} title="Format">
              <ErrorCorrectionPicker
                value={effectiveOptions.errorCorrection}
                onChange={handleEcChange}
              />
              <SizeMarginControls
                margin={options.margin}
                onMargin={(margin) => update({ margin })}
              />
            </Panel>
          )}

          {activeSection === 'export' && (
            <Panel icon={Download} title="Export">
              <ExportPanel qrRef={qrRef} filenameSeed={effectiveOptions.data} />
            </Panel>
          )}
        </div>

        <QrPreview options={effectiveOptions} qrRef={qrRef} scannability={scannability} />
      </div>
      <FaqLauncher />
    </AppShell>
  );
}
