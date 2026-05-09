import { useRef, useEffect, useCallback } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { linter, type Diagnostic } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import { validateJson, validateXml } from '../lib/validator';

interface EditorPanelProps {
  value: string;
  onChange?: (value: string) => void;
  language: 'json' | 'xml' | 'unknown';
  readOnly?: boolean;
  placeholder?: string;
}

// Dark syntax theme (Dracula-inspired)
const darkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c792ea' },
  { tag: tags.string, color: '#a5d6a7' },
  { tag: tags.number, color: '#f78c6c' },
  { tag: tags.bool, color: '#f78c6c' },
  { tag: tags.null, color: '#f78c6c' },
  { tag: tags.propertyName, color: '#82aaff' },
  { tag: tags.comment, color: '#546e7a', fontStyle: 'italic' },
  { tag: tags.bracket, color: '#89ddff' },
  { tag: tags.punctuation, color: '#89ddff' },
  { tag: tags.separator, color: '#89ddff' },
  { tag: tags.tagName, color: '#f07178' },
  { tag: tags.attributeName, color: '#ffcb6b' },
  { tag: tags.attributeValue, color: '#a5d6a7' },
  { tag: tags.angleBracket, color: '#89ddff' },
  { tag: tags.typeName, color: '#ffcb6b' },
  { tag: tags.content, color: '#a0a6b6' },
]);

// Light syntax theme
const lightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed' },
  { tag: tags.string, color: '#16a34a' },
  { tag: tags.number, color: '#ea580c' },
  { tag: tags.bool, color: '#ea580c' },
  { tag: tags.null, color: '#ea580c' },
  { tag: tags.propertyName, color: '#2563eb' },
  { tag: tags.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: tags.bracket, color: '#0891b2' },
  { tag: tags.punctuation, color: '#0891b2' },
  { tag: tags.separator, color: '#0891b2' },
  { tag: tags.tagName, color: '#dc2626' },
  { tag: tags.attributeName, color: '#d97706' },
  { tag: tags.attributeValue, color: '#16a34a' },
  { tag: tags.angleBracket, color: '#0891b2' },
  { tag: tags.typeName, color: '#d97706' },
  { tag: tags.content, color: '#3a3f4a' },
]);

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    backgroundColor: 'var(--editor-bg)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
  },
  '.cm-content': {
    caretColor: 'var(--accent)',
    padding: '12px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--gutter-bg)',
    color: 'var(--gutter-text)',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--active-line)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--active-line)',
    color: 'var(--text-muted)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--selection) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--selection) !important',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent)',
    borderLeftWidth: '2px',
  },
  '.cm-placeholder': {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--accent-glow)',
    outline: '1px solid var(--accent)',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  // Fold gutter
  '.cm-foldGutter': {
    width: '12px',
  },
  '.cm-foldGutter .cm-gutterElement': {
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '11px',
    lineHeight: '1.6',
    textAlign: 'center',
    opacity: '0.6',
    transition: 'opacity 0.15s',
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    opacity: '1',
    color: 'var(--accent)',
  },
  '.cm-foldPlaceholder': {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '3px',
    padding: '0 4px',
    margin: '0 2px',
    fontSize: '11px',
  },
  // Lint styling
  '.cm-diagnostic': {
    padding: '4px 8px',
    marginLeft: '0',
  },
  '.cm-diagnostic-error': {
    borderLeftColor: 'var(--error)',
    background: 'var(--error-bg)',
    color: 'var(--text)',
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline var(--error)',
    textUnderlineOffset: '3px',
  },
});

function langExtension(language: string) {
  if (language === 'json') return json();
  if (language === 'xml') return xml();
  return [];
}

function getActiveHighlight(): HighlightStyle {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'light') return lightHighlight;
  if (theme === 'dark') return darkHighlight;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? lightHighlight : darkHighlight;
}

function createLintSource(language: string) {
  return linter((view) => {
    const doc = view.state.doc.toString();
    if (!doc.trim()) return [];
    const diagnostics: Diagnostic[] = [];

    if (language === 'json') {
      const err = validateJson(doc);
      if (err) {
        let from = 0;
        let to = Math.min(doc.length, 100);
        if (err.line) {
          const line = view.state.doc.line(Math.min(err.line, view.state.doc.lines));
          from = line.from;
          to = line.to;
        }
        diagnostics.push({ from, to, severity: 'error', message: err.message });
      }
    } else if (language === 'xml') {
      const err = validateXml(doc);
      if (err) {
        let from = 0;
        let to = Math.min(doc.length, 100);
        if (err.line) {
          const line = view.state.doc.line(Math.min(err.line, view.state.doc.lines));
          from = line.from;
          to = line.to;
        }
        diagnostics.push({ from, to, severity: 'error', message: err.message });
      }
    }

    return diagnostics;
  }, { delay: 500 });
}

// Compartments for dynamic reconfiguration
const langCompartment = new Compartment();
const highlightCompartment = new Compartment();
const lintCompartment = new Compartment();

export function EditorPanel({ value, onChange, language, readOnly = false, placeholder }: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialize editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        foldGutter(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        highlightSelectionMatches(),
        highlightCompartment.of(syntaxHighlighting(getActiveHighlight())),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap]),
        langCompartment.of(langExtension(language)),
        lintCompartment.of(!readOnly ? createLintSource(language) : []),
        editorTheme,
        EditorView.lineWrapping,
        readOnly ? EditorState.readOnly.of(true) : [],
        !readOnly
          ? EditorView.updateListener.of((update) => {
              if (update.docChanged && onChangeRef.current) {
                onChangeRef.current(update.state.doc.toString());
              }
            })
          : [],
        placeholder ? cmPlaceholder(placeholder) : [],
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes
  const prevValueRef = useRef(value);
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current && value !== prevValueRef.current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
    prevValueRef.current = value;
  }, [value]);

  // Reconfigure language + lint via compartments (preserves undo history)
  const prevLangRef = useRef(language);
  useEffect(() => {
    const view = viewRef.current;
    if (!view || language === prevLangRef.current) return;
    prevLangRef.current = language;
    view.dispatch({
      effects: [
        langCompartment.reconfigure(langExtension(language)),
        lintCompartment.reconfigure(!readOnly ? createLintSource(language) : []),
      ],
    });
  }, [language, readOnly]);

  // Watch for theme changes and reconfigure highlight style
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const updateHighlight = () => {
      view.dispatch({
        effects: highlightCompartment.reconfigure(syntaxHighlighting(getActiveHighlight())),
      });
    };

    const observer = new MutationObserver(updateHighlight);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', updateHighlight);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', updateHighlight);
    };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10 MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (onChangeRef.current) onChangeRef.current(text);
      };
      reader.readAsText(file);
    },
    [readOnly],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      className="editor-panel"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    />
  );
}
