interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContentInput({ value, onChange }: ContentInputProps) {
  return (
    <div className="qr-control-group">
      <h3>Content</h3>
      <div className="qr-field">
        <label htmlFor="qr-content">Text or URL</label>
        <textarea
          id="qr-content"
          className="qr-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
}
