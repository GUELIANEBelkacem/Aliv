import { useState } from 'react';
import { AppShell } from '@aliv/ui';
import { QrPreview } from './components/QrPreview';
import { ContentInput } from './components/ContentInput';
import { ErrorCorrectionPicker } from './components/ErrorCorrectionPicker';
import { SizeMarginControls } from './components/SizeMarginControls';
import { DEFAULT_QR_OPTIONS, type QrOptions } from './lib/types';

export default function App() {
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);

  function update(patch: Partial<QrOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }));
  }

  return (
    <AppShell appId="qrcode">
      <div className="qr-app">
        <div className="qr-controls">
          <ContentInput value={options.data} onChange={(data) => update({ data })} />
          <div className="qr-control-group">
            <h3>Format</h3>
            <ErrorCorrectionPicker
              value={options.errorCorrection}
              onChange={(errorCorrection) => update({ errorCorrection })}
            />
            <SizeMarginControls
              size={options.size}
              margin={options.margin}
              onSize={(size) => update({ size })}
              onMargin={(margin) => update({ margin })}
            />
          </div>
        </div>
        <QrPreview options={options} />
      </div>
    </AppShell>
  );
}
