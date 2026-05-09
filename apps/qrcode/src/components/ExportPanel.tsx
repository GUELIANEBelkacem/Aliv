import { useState } from 'react';
import { Button } from '@aliv/ui';
import type QRCodeStyling from 'qr-code-styling';
import { downloadPng, downloadSvg, copyPngToClipboard, defaultFilename } from '../lib/export';

const RESOLUTIONS = [256, 512, 1024, 2048] as const;

interface ExportPanelProps {
  qrRef: React.MutableRefObject<QRCodeStyling | null>;
  filenameSeed: string;
}

export function ExportPanel({ qrRef, filenameSeed }: ExportPanelProps) {
  const [resolution, setResolution] = useState<number>(1024);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withQr<T>(fn: (qr: QRCodeStyling) => Promise<T>): Promise<T | undefined> {
    if (!qrRef.current) {
      setError('QR not ready yet — try again in a moment.');
      return;
    }
    try {
      return await fn(qrRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
      return;
    }
  }

  function getFilename() {
    return defaultFilename(filenameSeed);
  }

  async function handlePng() {
    setError(null);
    if (!qrRef.current) return;
    qrRef.current.update({ width: resolution, height: resolution });
    await withQr((qr) => downloadPng(qr, getFilename()));
  }

  async function handleSvg() {
    setError(null);
    await withQr((qr) => downloadSvg(qr, getFilename()));
  }

  async function handleCopy() {
    setError(null);
    const ok = await withQr((qr) => copyPngToClipboard(qr));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      setError('Clipboard not available in this browser.');
    }
  }

  return (
    <div className="qr-control-group">
      <h3>Export</h3>
      <div className="qr-field">
        <label>Resolution: {resolution}px</label>
        <div className="qr-segmented">
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={resolution === r}
              className={resolution === r ? 'is-active' : ''}
              onClick={() => setResolution(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="qr-actions">
        <Button variant="primary" onClick={handlePng}>Download PNG</Button>
        <Button variant="secondary" onClick={handleSvg}>Download SVG</Button>
        <Button variant="ghost" onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy PNG'}</Button>
      </div>
      {error && <span className="qr-field-hint" style={{ color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}
