import { useCallback, useRef, useState } from 'react';
import type QRCodeStyling from 'qr-code-styling';
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
      <div className="qr-app">
        <div className="qr-controls">
          <div className="qr-control-group">
            <h3>Content</h3>
            <ContentTabs value={contentType} onChange={setContentType} />
            <div className="qr-content-form">
              <ContentEditor data={data} onChange={updateData} />
            </div>
            {!built.ok && built.error && (
              <span className="qr-field-hint" style={{ color: 'var(--danger)' }}>{built.error}</span>
            )}
          </div>
          <ColorControls
            foreground={options.foreground}
            background={options.background}
            eyeColor={options.eyeColor}
            onForegroundChange={(foreground) => update({ foreground })}
            onBackgroundChange={(color) => update({ background: { type: 'solid', color } })}
            onEyeColorChange={(eyeColor) => update({ eyeColor })}
          />
          <ShapeControls
            moduleShape={options.moduleShape}
            eyeFrameShape={options.eyeFrameShape}
            eyeBallShape={options.eyeBallShape}
            onModuleShape={(moduleShape) => update({ moduleShape })}
            onEyeFrameShape={(eyeFrameShape) => update({ eyeFrameShape })}
            onEyeBallShape={(eyeBallShape) => update({ eyeBallShape })}
          />
          <LogoControls logo={options.logo} onChange={(logo) => update({ logo })} />
          <LogoEcWarning show={autoBump} />
          <ScannabilityNotice result={scannability} />
          <div className="qr-control-group">
            <h3>Format</h3>
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
          </div>
          <ExportPanel qrRef={qrRef} filenameSeed={effectiveOptions.data} />
        </div>
        <QrPreview options={effectiveOptions} qrRef={qrRef} />
      </div>
    </AppShell>
  );
}
