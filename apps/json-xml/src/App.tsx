import { useState, useCallback, useEffect, useRef } from 'react';
import { useSettings, SettingsContext } from './hooks/useSettings';
import { useConversion } from './hooks/useConversion';
import { useSwipe } from './hooks/useSwipe';
import { usePanelResize } from './hooks/usePanelResize';
import { EditorPanel } from './components/EditorPanel';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { ErrorBanner } from './components/ErrorBanner';
import { EmptyState } from './components/EmptyState';
import { ShortcutsModal } from './components/ShortcutsModal';
import { prettifyJson, minifyJson, prettifyXml, minifyXml } from './lib/formatter';
import type { ConversionDirection } from './types/settings';
import './App.css';

const SAMPLE_JSON = `{
  "bookstore": {
    "book": [
      {
        "@_category": "fiction",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "year": 1925
      },
      {
        "@_category": "science",
        "title": "A Brief History of Time",
        "author": "Stephen Hawking",
        "year": 1988
      }
    ]
  }
}`;

const AUTO_CONVERT_THRESHOLD = 100 * 1024; // 100 KB

function AppInner() {
  const { settings, updateSettings } = useSettings();
  const [input, setInput] = useState(SAMPLE_JSON);
  const [direction, setDirection] = useState<ConversionDirection>('auto');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');
  const [swapping, setSwapping] = useState(false);

  const autoConvert = settings.autoConvert && new TextEncoder().encode(input).length < AUTO_CONVERT_THRESHOLD;

  const { result, detectedFormat, conversionTime, manualConvert, pending } = useConversion({
    input,
    direction,
    options: settings,
    autoConvert,
  });

  const outputLang = (() => {
    if (direction === 'json-to-xml') return 'xml' as const;
    if (direction === 'xml-to-json') return 'json' as const;
    if (detectedFormat === 'json') return 'xml' as const;
    if (detectedFormat === 'xml') return 'json' as const;
    return 'unknown' as const;
  })();

  const inputDot = result.error ? 'error' : detectedFormat;
  const outputDot = outputLang === 'unknown' ? 'unknown' : outputLang;

  // Fix #4: Smooth theme transition
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    if (settings.theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }
    const timer = setTimeout(() => root.classList.remove('theme-transitioning'), 350);
    return () => clearTimeout(timer);
  }, [settings.theme]);

  const handleBeautify = useCallback(() => {
    try {
      if (detectedFormat === 'json') {
        setInput(prettifyJson(input, settings.indentation));
      } else if (detectedFormat === 'xml') {
        setInput(prettifyXml(input, settings.indentation));
      }
    } catch { /* ignore */ }
  }, [detectedFormat, input, settings.indentation]);

  const handleMinify = useCallback(() => {
    try {
      if (detectedFormat === 'json') {
        setInput(minifyJson(input));
      } else if (detectedFormat === 'xml') {
        setInput(minifyXml(input));
      }
    } catch { /* ignore */ }
  }, [detectedFormat, input]);

  const handleCopyInput = useCallback(async () => {
    if (!input.trim()) return;
    await navigator.clipboard.writeText(input);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 1500);
  }, [input]);

  const handleDownloadInput = useCallback(() => {
    if (!input.trim()) return;
    const ext = detectedFormat === 'xml' ? 'xml' : 'json';
    const mime = detectedFormat === 'xml' ? 'application/xml' : 'application/json';
    const blob = new Blob([input], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `input.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [input, detectedFormat]);

  const handleCopy = useCallback(async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 1500);
  }, [result.output]);

  const handleDownload = useCallback(() => {
    if (!result.output) return;
    const ext = outputLang === 'xml' ? 'xml' : 'json';
    const mime = outputLang === 'xml' ? 'application/xml' : 'application/json';
    const blob = new Blob([result.output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result.output, outputLang]);

  // Fix #13: Swap with cross-fade animation
  const handleSwap = useCallback(() => {
    if (!result.output) return;
    setSwapping(true);
    setTimeout(() => {
      setInput(result.output);
      if (direction === 'json-to-xml') setDirection('xml-to-json');
      else if (direction === 'xml-to-json') setDirection('json-to-xml');
      setSwapping(false);
    }, 150);
  }, [result.output, direction]);

  const handleClear = useCallback(() => {
    setInput('');
  }, []);

  // File picker for mobile
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large (max 10 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setInput(reader.result as string);
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Swipe gesture for panel switching
  const editorRef = useRef<HTMLDivElement>(null);
  useSwipe(editorRef, {
    onSwipeLeft: useCallback(() => setMobileTab('output'), []),
    onSwipeRight: useCallback(() => setMobileTab('input'), []),
  });

  // Fix #1: Draggable panel resizer
  const dividerRef = useRef<HTMLDivElement>(null);
  const { leftPercent } = usePanelResize(editorRef, dividerRef);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        manualConvert();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handleCopy();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSwap();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        handleBeautify();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        handleMinify();
      } else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setSettingsOpen((o) => !o);
      } else if (e.key === '?' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        // Don't trigger when typing in inputs or the CodeMirror editor
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (document.querySelector('.cm-focused')) return;
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [manualConvert, handleCopy, handleSwap, handleBeautify, handleMinify]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <div className="app">
        <Toolbar
          direction={direction}
          onDirectionChange={setDirection}
          onConvert={manualConvert}
          onBeautify={handleBeautify}
          onMinify={handleMinify}
          onToggleSettings={() => setSettingsOpen((o) => !o)}
          showConvert={!autoConvert}
          detectedFormat={detectedFormat}
        />

        {/* Mobile tabs */}
        <div className="mobile-tabs">
          <button
            className={`mobile-tab ${mobileTab === 'input' ? 'active' : ''}`}
            onClick={() => setMobileTab('input')}
          >
            Input
          </button>
          <button
            className={`mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
            onClick={() => setMobileTab('output')}
          >
            Output
          </button>
          <button
            className="mobile-file-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Open file"
            aria-label="Open file"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 13V3a1 1 0 011-1h4l2 2h4a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M8 7v4M6 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="mobile-swap-btn"
            onClick={handleSwap}
            title="Swap input and output"
            aria-label="Swap"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 5.5h12M14 5.5l-2.5-2.5M14 5.5l-2.5 2.5M14 10.5H2M2 10.5l2.5-2.5M2 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xml,.txt"
            hidden
            onChange={handleFileSelect}
          />
        </div>

        <main className="editor-container" ref={editorRef}>
          {/* Input panel */}
          <div
            className={`panel ${swapping ? 'panel-swapping' : ''} ${mobileTab === 'input' ? 'mobile-visible' : 'mobile-hidden-left'}`}
            style={{ flex: `0 0 ${leftPercent}%` }}
          >
            <div className="panel-header">
              <span className="panel-label">
                <span className={`panel-dot ${inputDot}`} />
                Input
              </span>
              <div className="panel-actions">
                {detectedFormat !== 'unknown' && (
                  <span className={`panel-format ${detectedFormat}`}>{detectedFormat.toUpperCase()}</span>
                )}
                <button
                  className={`btn btn-ghost btn-icon-sm ${copiedInput ? 'btn-copied' : ''}`}
                  onClick={handleCopyInput}
                  disabled={!input.trim()}
                  title={copiedInput ? 'Copied!' : 'Copy input'}
                  aria-label="Copy input"
                >
                  {copiedInput ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M11 3H4a1.5 1.5 0 00-1.5 1.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-icon-sm"
                  onClick={handleDownloadInput}
                  disabled={!input.trim()}
                  title="Download input"
                  aria-label="Download input"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className="btn btn-ghost btn-icon-sm" onClick={handleClear} title="Clear input" aria-label="Clear input">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* Fix #5: Inline error banner */}
            <ErrorBanner error={result.error} />
            <EditorPanel
              value={input}
              onChange={setInput}
              language={detectedFormat === 'unknown' ? 'json' : detectedFormat}
              placeholder="Paste or type JSON / XML here..."
            />
            {/* Fix #7: Empty state overlay */}
            {!input.trim() && (
              <EmptyState
                onLoadSample={() => setInput(SAMPLE_JSON)}
                onOpenFile={() => fileInputRef.current?.click()}
              />
            )}
          </div>

          {/* Center divider with swap — Fix #1: now actually draggable */}
          <div className="center-divider" ref={dividerRef}>
            <button className="swap-btn" onClick={handleSwap} onPointerDown={(e) => e.stopPropagation()} title="Swap input and output (Ctrl+Shift+S)" aria-label="Swap">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 5.5h12M14 5.5l-2.5-2.5M14 5.5l-2.5 2.5M14 10.5H2M2 10.5l2.5-2.5M2 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Output panel — Fix #12: visual distinction */}
          <div
            className={`panel panel-output ${swapping ? 'panel-swapping' : ''} ${mobileTab === 'output' ? 'mobile-visible' : 'mobile-hidden-right'}`}
          >
            <div className="panel-header">
              <span className="panel-label">
                <span className={`panel-dot ${outputDot}`} />
                Output
                <span className="readonly-badge">Read-only</span>
              </span>
              <div className="panel-actions">
                {outputLang !== 'unknown' && (
                  <span className={`panel-format ${outputLang}`}>{outputLang.toUpperCase()}</span>
                )}
                <button
                  className={`btn btn-ghost btn-icon-sm ${copiedOutput ? 'btn-copied' : ''}`}
                  onClick={handleCopy}
                  disabled={!result.output}
                  title={copiedOutput ? 'Copied!' : 'Copy output'}
                  aria-label="Copy output"
                >
                  {copiedOutput ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M11 3H4a1.5 1.5 0 00-1.5 1.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-icon-sm"
                  onClick={handleDownload}
                  disabled={!result.output}
                  title="Download output"
                  aria-label="Download output"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <EditorPanel
              value={result.output}
              language={outputLang}
              readOnly
              placeholder="Converted output will appear here..."
            />
          </div>
        </main>

        <StatusBar
          error={result.error}
          detectedFormat={detectedFormat}
          inputLength={new TextEncoder().encode(input).length}
          conversionTime={conversionTime}
          pending={pending}
        />

        <SettingsDrawer
          open={settingsOpen}
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setSettingsOpen(false)}
          autoConvertBlocked={new TextEncoder().encode(input).length >= AUTO_CONVERT_THRESHOLD}
        />

        {/* Fix #10: Keyboard shortcuts modal */}
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </div>
    </SettingsContext.Provider>
  );
}

export default function App() {
  return <AppInner />;
}
