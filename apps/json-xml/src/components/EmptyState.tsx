interface EmptyStateProps {
  onLoadSample: () => void;
  onOpenFile: () => void;
}

export function EmptyState({ onLoadSample, onOpenFile }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M10 6C8 6 7 7.5 7 9v4c0 1.5-1 3-3 3 2 0 3 1.5 3 3v4c0 1.5 1 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M22 6c2 0 3 1.5 3 3v4c0 1.5 1 3 3 3-2 0-3 1.5-3 3v4c0 1.5-1 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M13 16h6m0 0l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>
      <p className="empty-state-title">No input yet</p>
      <p className="empty-state-hint">Paste JSON or XML, or try one of these:</p>
      <div className="empty-state-actions">
        <button className="btn btn-secondary" onClick={onLoadSample}>Load sample</button>
        <button className="btn btn-ghost" onClick={onOpenFile}>Open file</button>
      </div>
    </div>
  );
}
