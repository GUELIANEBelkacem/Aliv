import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { loadLogoFile } from '../lib/logo-utils';

interface LogoUploadProps {
  src?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export function LogoUpload({ src, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    const result = await loadLogoFile(file);
    if (!result.ok) {
      setError(result.error ?? 'Could not load logo.');
      return;
    }
    setError(null);
    onChange(result.dataUrl);
  }

  return (
    <div className="qr-field">
      <label>Logo image</label>
      <div
        className={`qr-drop-zone${dragOver ? ' is-drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        data-testid="logo-drop"
      >
        {src ? (
          <img src={src} alt="Logo preview" className="qr-logo-preview" />
        ) : (
          <>
            <ImagePlus aria-hidden="true" />
            <span>Drop or click to upload</span>
            <span className="qr-field-hint">PNG · SVG · JPEG · WebP — max 2 MB</span>
          </>
        )}
      </div>
      {src && (
        <button
          type="button"
          className="qr-clear-logo"
          onClick={() => onChange(undefined)}
        >
          Remove logo
        </button>
      )}
      {error && <span className="qr-field-hint" style={{ color: 'var(--danger)' }}>{error}</span>}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/svg+xml,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
