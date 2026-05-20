import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Sparkles, Palette, Shapes, ImagePlus, Sliders, Download } from 'lucide-react';
import { AppShell, type Shortcut } from '@aliv/ui';
import { copyPngFromOptions } from './lib/export';
import { CONTENT_TYPE_ORDER } from './content/order';
import { QrPreview } from './components/QrPreview';
import { AdvancedPanel } from './components/AdvancedPanel';
import { PaddingControl } from './components/PaddingControl';
import { ColorControls } from './components/ColorControls';
import { ShapeControls } from './components/ShapeControls';
import { LogoControls } from './components/LogoControls';
import { EcAutoBumpToast } from './components/EcAutoBumpToast';
import { ExportPanel } from './components/ExportPanel';
import { ScannabilityNotice } from './components/ScannabilityNotice';
import { SectionRail, type RailItem } from './components/SectionRail';
import { assess } from './lib/scannability';
import { frameLayout } from './lib/frame-shapes';
import { EC_RANK, recommendedEc } from './lib/ec-rules';
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

const SHORTCUTS_LIST = [
  { keys: 'Ctrl+Shift+C', description: 'Copy PNG' },
  { keys: 'Ctrl+Shift+S', description: 'Next content type' },
  { keys: 'Alt+1..6', description: 'Switch tool section' },
];

type SectionId = 'content' | 'colors' | 'shapes' | 'logo' | 'advanced' | 'export';

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
  // When true the user is in advanced mode and the EC picker is exposed —
  // their manual choice wins. When false, recommendedEc(opts) drives the
  // effective level. Toggling off/on preserves options.errorCorrection, so
  // the manual pick is restored when Advanced comes back on.
  const [advancedEc, setAdvancedEc] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('content');
  const [currentPresetId, setCurrentPresetId] = useState<string | undefined>(undefined);
  const [moduleCount, setModuleCount] = useState(0);

  const data = contentMap[contentType];
  const built = buildContent(data);

  function update(patch: Partial<QrOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }));
    // Any manual option change diverges from the applied preset (REVIEW §1.7).
    setCurrentPresetId(undefined);
  }

  function updateData(next: ContentData) {
    setContentMap((prev) => ({ ...prev, [next.type]: next }));
  }

  // In auto mode the EC is derived from logo size and padding together
  // (lib/ec-rules.recommendedEc). advancedEc=true switches to manual.
  const recommended = recommendedEc(options);

  const effectiveOptions = useMemo<QrOptions>(() => ({
    ...options,
    data: built.ok ? (built.value ?? '') : ' ',
    errorCorrection: advancedEc ? options.errorCorrection : recommended,
  }), [options, built.ok, built.value, advancedEc, recommended]);

  // Surface an auto-driven EC change as a transient toast. Watches the
  // *effective* EC (not just `recommended`) so toggling Advanced off and
  // having auto take over with a higher level also announces itself.
  // While Advanced is ON, manual picks aren't surprises — skip the toast.
  const effectiveEc = effectiveOptions.errorCorrection;
  const lastEffectiveEcRef = useRef(effectiveEc);
  const [toastTrigger, setToastTrigger] = useState(0);
  const [toastLevel, setToastLevel] = useState(effectiveEc);
  useEffect(() => {
    if (advancedEc) {
      lastEffectiveEcRef.current = effectiveEc;
      return;
    }
    const t = setTimeout(() => {
      if (EC_RANK[effectiveEc] > EC_RANK[lastEffectiveEcRef.current]) {
        setToastLevel(effectiveEc);
        setToastTrigger((n) => n + 1);
      }
      lastEffectiveEcRef.current = effectiveEc;
    }, 250);
    return () => clearTimeout(t);
  }, [effectiveEc, advancedEc]);

  // The frame layout decides the *inscribed* pixel size of the QR engine
  // (smaller than options.size when the frame is a circle). LogoControls needs
  // it to compute the safe-max logo padding, and QrPreview needs it to position
  // the engine output. Computed once here so both consume the same value.
  const layout = useMemo(
    () => frameLayout(effectiveOptions.frameShape, effectiveOptions.size, effectiveOptions.background.color),
    [effectiveOptions.frameShape, effectiveOptions.size, effectiveOptions.background.color],
  );

  const scannability = assess(effectiveOptions);
  const valid = built.ok;

  function handleEcChange(level: QrOptions['errorCorrection']) {
    setAdvancedEc(true);
    update({ errorCorrection: level });
  }

  function handleAdvancedChange(next: boolean) {
    // Going auto → advanced: seed `options.errorCorrection` from the EC the
    // engine is actually using. Otherwise flipping the switch silently drops
    // the level (e.g. dropping a logo bumps to H; opening Advanced would
    // expose the stale default M).
    if (next && !advancedEc) {
      update({ errorCorrection: effectiveOptions.errorCorrection });
    }
    setAdvancedEc(next);
  }

  function handleApplyPreset(preset: Preset) {
    setOptions((prev) => applyPreset(prev, preset));
    // Only forcing presets flip Advanced on; non-forcing presets leave the
    // user's mode alone. Combined with presets no longer carrying
    // errorCorrection (presets.ts), an in-flight manual EC choice survives
    // applying a colour/shape preset.
    if (preset.forcesAdvanced) setAdvancedEc(true);
    setCurrentPresetId(preset.id);
  }

  function handleReset(reset: QrOptions) {
    setOptions(reset);
    setAdvancedEc(false);
    setCurrentPresetId(undefined);
    setContentType('url');
    setContentMap(DEFAULT_CONTENT);
  }

  const cycleContent = useCallback(() => {
    const idx = CONTENT_TYPE_ORDER.indexOf(contentType);
    setContentType(CONTENT_TYPE_ORDER[(idx + 1) % CONTENT_TYPE_ORDER.length]);
  }, [contentType]);

  const copyPng = useCallback(async () => {
    await copyPngFromOptions(effectiveOptions);
  }, [effectiveOptions]);

  // Make sure the <html data-app> attribute is set before AppShell's own
  // effect runs so first paint already has the right accent. REVIEW §8.9.
  useEffect(() => {
    document.documentElement.dataset.app = 'qrcode';
  }, []);

  const railItems: RailItem<SectionId>[] = [
    { id: 'content', label: 'Content', icon: Sparkles },
    { id: 'colors',  label: 'Colors',  icon: Palette },
    { id: 'shapes',  label: 'Shapes',  icon: Shapes },
    { id: 'logo',    label: 'Logo',    icon: ImagePlus },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: Sliders,
      badge: scannability.level === 'fail' ? 'fail' : scannability.level === 'warn' ? 'warn' : undefined,
    },
    { id: 'export',  label: 'Export',  icon: Download },
  ];

  const numericShortcuts: Shortcut[] = railItems.map((item, idx) => ({
    keys: `Alt+${idx + 1}`,
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
      settings={
        <QrSettings
          onApplyPreset={handleApplyPreset}
          onReset={handleReset}
          currentPresetId={currentPresetId}
        />
      }
    >
      <Tagline />
      <div className="qr-app">
        <SectionRail items={railItems} active={activeSection} onChange={setActiveSection} />

        <div className="qr-panel-stage">
          {scannability.level !== 'ok' && (
            <div className="qr-notices">
              <ScannabilityNotice result={scannability} />
            </div>
          )}
          <EcAutoBumpToast trigger={toastTrigger} level={toastLevel} />

          {activeSection === 'content' && (
            <Panel icon={Sparkles} title="Content" hint={CONTENT_TYPE_LABELS[contentType]}>
              <ContentTabs value={contentType} onChange={setContentType} />
              <div data-testid="qr-content-form">
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
              <PaddingControl
                margin={options.margin}
                onMargin={(margin) => update({ margin })}
              />
            </Panel>
          )}

          {activeSection === 'logo' && (
            <Panel icon={ImagePlus} title="Logo" hint={options.logo ? 'Embedded' : 'Optional'}>
              <LogoControls
                logo={options.logo}
                onChange={(logo) => update({ logo })}
                moduleCount={moduleCount}
                qrPixelSize={layout.qr.size}
                ec={effectiveOptions.errorCorrection}
              />
            </Panel>
          )}

          {activeSection === 'advanced' && (
            <Panel icon={Sliders} title="Advanced">
              <AdvancedPanel
                options={options}
                effectiveEc={effectiveOptions.errorCorrection}
                advancedEc={advancedEc}
                onAdvancedChange={handleAdvancedChange}
                onEcChange={handleEcChange}
              />
            </Panel>
          )}

          {activeSection === 'export' && (
            <Panel icon={Download} title="Export">
              <ExportPanel options={effectiveOptions} />
            </Panel>
          )}
        </div>

        <QrPreview
          options={effectiveOptions}
          scannability={scannability}
          valid={valid}
          onModuleCount={setModuleCount}
        />
      </div>
      <FaqLauncher />
    </AppShell>
  );
}
