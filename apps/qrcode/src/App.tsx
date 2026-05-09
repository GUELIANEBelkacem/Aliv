import { useState } from 'react';
import { AppShell } from '@aliv/ui';
import { QrPreview } from './components/QrPreview';
import { ContentInput } from './components/ContentInput';
import { ErrorCorrectionPicker } from './components/ErrorCorrectionPicker';
import { SizeMarginControls } from './components/SizeMarginControls';
import { ColorControls } from './components/ColorControls';
import { ShapeControls } from './components/ShapeControls';
import { LogoControls } from './components/LogoControls';
import { LogoEcWarning } from './components/LogoEcWarning';
import { DEFAULT_QR_OPTIONS, type QrOptions } from './lib/types';

const LARGE_LOGO_THRESHOLD = 0.2;

export default function App() {
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);
  const [userTouchedEc, setUserTouchedEc] = useState(false);

  function update(patch: Partial<QrOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }));
  }

  const bigLogo = !!(options.logo && options.logo.sizeRatio > LARGE_LOGO_THRESHOLD);
  const autoBump = bigLogo && !userTouchedEc && options.errorCorrection !== 'H';
  const effectiveOptions: QrOptions = autoBump
    ? { ...options, errorCorrection: 'H' }
    : options;
  const displayedEc = effectiveOptions.errorCorrection;

  function handleEcChange(level: QrOptions['errorCorrection']) {
    setUserTouchedEc(true);
    update({ errorCorrection: level });
  }

  return (
    <AppShell appId="qrcode">
      <div className="qr-app">
        <div className="qr-controls">
          <ContentInput value={options.data} onChange={(data) => update({ data })} />
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
              value={displayedEc}
              onChange={handleEcChange}
            />
            <SizeMarginControls
              size={options.size}
              margin={options.margin}
              onSize={(size) => update({ size })}
              onMargin={(margin) => update({ margin })}
            />
          </div>
        </div>
        <QrPreview options={effectiveOptions} />
      </div>
    </AppShell>
  );
}
