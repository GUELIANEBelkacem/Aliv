import { useState } from 'react';
import { Button, SegmentedControl } from '@aliv/ui';
import { exportPng, exportSvg, copyPngFromOptions, defaultFilename } from '../lib/export';
import type { QrOptions } from '../lib/types';

const RESOLUTIONS = ['256', '512', '1024', '2048'] as const;
type Resolution = typeof RESOLUTIONS[number];

interface ExportPanelProps {
  options: QrOptions;
}

export function ExportPanel({ options }: ExportPanelProps) {
  const [resolution, setResolution] = useState<Resolution>('1024');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getFilename() {
    return defaultFilename(options.data);
  }

  async function handlePng() {
    setError(null);
    try {
      await exportPng(options, Number(resolution), getFilename());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    }
  }

  async function handleSvg() {
    setError(null);
    try {
      await exportSvg(options, getFilename());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    }
  }

  async function handleCopy() {
    setError(null);
    try {
      const ok = await copyPngFromOptions(options);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        setError('Clipboard not available in this browser.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Copy failed.');
    }
  }

  return (
    <>
      <div className="qr-field" data-testid="qr-export-resolution">
        <label>Resolution</label>
        <SegmentedControl<Resolution>
          value={resolution}
          options={RESOLUTIONS.map((r) => ({ value: r, label: `${r}px` }))}
          onChange={setResolution}
          ariaLabel="Resolution"
          full
        />
      </div>
      <div className="qr-actions">
        <Button variant="primary" onClick={handlePng}>Download PNG</Button>
        <Button variant="secondary" onClick={handleSvg}>Download SVG</Button>
        <Button variant="ghost" onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy PNG'}</Button>
      </div>
      {(error || copied) && (
        <span
          className="qr-field-hint"
          data-testid="qr-export-feedback"
          style={error ? { color: 'var(--danger)' } : undefined}
        >
          {error ?? 'Copied!'}
        </span>
      )}
    </>
  );
}
