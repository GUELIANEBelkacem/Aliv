import { useRef, useState } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { AppShell } from '@aliv/ui';
import { QrPreview } from './components/QrPreview';
import { ErrorCorrectionPicker } from './components/ErrorCorrectionPicker';
import { SizeMarginControls } from './components/SizeMarginControls';
import { ColorControls } from './components/ColorControls';
import { ShapeControls } from './components/ShapeControls';
import { LogoControls } from './components/LogoControls';
import { LogoEcWarning } from './components/LogoEcWarning';
import { ExportPanel } from './components/ExportPanel';
import { ContentTabs } from './content/ContentTabs';
import { ContentEditor } from './content/ContentEditor';
import { DEFAULT_CONTENT } from './content/defaults';
import { buildContent } from './content/builders';
import type { ContentData, ContentType } from './content/types';
import { DEFAULT_QR_OPTIONS, type QrOptions } from './lib/types';

const LARGE_LOGO_THRESHOLD = 0.2;

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

  function handleEcChange(level: QrOptions['errorCorrection']) {
    setUserTouchedEc(true);
    update({ errorCorrection: level });
  }

  return (
    <AppShell appId="qrcode">
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
