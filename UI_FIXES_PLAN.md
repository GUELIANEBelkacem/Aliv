# UI Fixes & UX Improvements Plan

A comprehensive plan addressing 16 issues: bugs, broken affordances, UX gaps, and polish items.

---

## Issue Index

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Center divider has `col-resize` cursor but isn't draggable | Bug | Medium |
| 2 | Swap destroys undo history | Bug | Small |
| 3 | Copy/Download buttons have no disabled state when output is empty | Bug | Small |
| 4 | Theme transition is jarring (no animation) | Polish | Small |
| 5 | Errors are buried in a tiny status bar | UX | Medium |
| 6 | No "reset to defaults" in settings | UX | Small |
| 7 | No empty state guidance | UX | Small |
| 8 | No real-time input validation feedback | UX | Medium |
| 9 | No visual indicator during auto-convert debounce | UX | Small |
| 10 | Keyboard shortcuts are invisible until hover | UX | Medium |
| 11 | Both syntax highlight styles registered simultaneously | Bug | Medium |
| 12 | Output panel looks identical to input | Polish | Small |
| 13 | No animation on swap | Polish | Small |
| 14 | No About/info section in settings | Polish | Small |
| 15 | Auto button always visible and does nothing when clicked in auto mode | Bug | Small |
| 16 | Beautify/Minify act on input but sit in a global toolbar — confusing when input is XML | UX | Medium |

---

## Fix 1: Draggable Panel Resizer

**Problem**: The center divider shows `cursor: col-resize` but dragging does nothing. This is a broken affordance — the UI promises resize behavior that doesn't exist.

**Solution**: Implement actual drag-to-resize on the center divider.

### New hook: `src/hooks/usePanelResize.ts`

```typescript
interface UsePanelResizeOptions {
  minPercent?: number;   // default 20
  maxPercent?: number;   // default 80
}

export function usePanelResize(
  containerRef: RefObject<HTMLElement>,
  dividerRef: RefObject<HTMLElement>,
  options?: UsePanelResizeOptions,
): { leftPercent: number; resetSize: () => void }
```

**Behavior**:
- Track `mousedown` on divider → `mousemove` on document → `mouseup` on document
- Also handle `touchstart` / `touchmove` / `touchend` for mobile (though divider is hidden on portrait mobile)
- Calculate left panel width as a percentage of the container width
- Clamp to `[minPercent, maxPercent]` (default 20%–80%)
- Store in state, apply via inline `style` on the panels: `flex: 0 0 {leftPercent}%` on the left panel
- Double-click on divider resets to 50/50

### Changes

| File | Change |
|------|--------|
| `src/hooks/usePanelResize.ts` | New file — resize hook |
| `src/App.tsx` | Import hook, attach refs to container + divider, apply `leftPercent` as inline style on panels |
| `src/index.css` | Remove `cursor: col-resize` from `.center-divider` base style, add it only on desktop (`@media (min-width: 769px)`) |

### Implementation details

```typescript
// usePanelResize.ts
export function usePanelResize(
  containerRef: RefObject<HTMLElement | null>,
  dividerRef: RefObject<HTMLElement | null>,
  options: UsePanelResizeOptions = {},
) {
  const { minPercent = 20, maxPercent = 80 } = options;
  const [leftPercent, setLeftPercent] = useState(50);
  const dragging = useRef(false);

  useEffect(() => {
    const divider = dividerRef.current;
    const container = containerRef.current;
    if (!divider || !container) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(maxPercent, Math.max(minPercent, pct)));
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const onDblClick = () => setLeftPercent(50);

    divider.addEventListener('mousedown', onMouseDown);
    divider.addEventListener('dblclick', onDblClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      divider.removeEventListener('mousedown', onMouseDown);
      divider.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [containerRef, dividerRef, minPercent, maxPercent]);

  return { leftPercent, resetSize: () => setLeftPercent(50) };
}
```

In `App.tsx`, apply the resize:
```tsx
const dividerRef = useRef<HTMLDivElement>(null);
const { leftPercent } = usePanelResize(editorRef, dividerRef);

// On the input panel:
<div className={`panel ...`} style={{ flex: `0 0 ${leftPercent}%` }}>

// On the divider:
<div className="center-divider" ref={dividerRef}>

// On the output panel — no style needed, flex: 1 fills the rest
```

---

## Fix 2: Preserve Undo History on Swap

**Problem**: `handleSwap` calls `setInput(result.output)`, which triggers the `useEffect` in `EditorPanel` that does a full document replacement via `view.dispatch({ changes: { from: 0, to: current.length, insert: value } })`. This wipes undo history.

**Solution**: The dispatch already uses `changes` which preserves undo history in CodeMirror 6 — the issue is that the entire document is replaced as a single transaction. This is actually fine for undo (one Ctrl+Z restores the pre-swap content). The real problem is that the `language` also changes, triggering the language `useEffect` which calls `view.setState(newState)` — this creates a brand new editor state and destroys history.

### Changes

| File | Change |
|------|--------|
| `src/components/EditorPanel.tsx` | Refactor language switching to use CM6 compartments instead of `view.setState()`. A compartment allows swapping extensions without destroying state/history. |

### Implementation details

```typescript
// EditorPanel.tsx
import { Compartment } from '@codemirror/state';

// Create compartments for dynamic extensions
const langCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

function buildExtensions(placeholder, onChange) {
  return [
    lineNumbers(),
    highlightActiveLine(),
    // ... static extensions ...
    langCompartment.of([]),       // placeholder, reconfigured later
    readOnlyCompartment.of([]),   // placeholder, reconfigured later
    // ...
  ];
}

// In the language useEffect, instead of view.setState():
useEffect(() => {
  const view = viewRef.current;
  if (!view) return;
  view.dispatch({
    effects: langCompartment.reconfigure(langExtension(language)),
  });
}, [language]);
```

This preserves the full undo/redo stack across language and swap changes.

---

## Fix 3: Disabled State for Copy/Download

**Problem**: When output is empty, Copy and Download buttons are fully interactive but do nothing on click. No visual cue that they're unavailable.

**Solution**: Pass `hasOutput` to `Toolbar` and apply a disabled style.

### Changes

| File | Change |
|------|--------|
| `src/components/Toolbar.tsx` | Add `hasOutput: boolean` prop. When false, Copy and Download buttons get `disabled` attribute + `btn-disabled` class. |
| `src/App.tsx` | Pass `hasOutput={!!result.output}` to `<Toolbar>`. |
| `src/index.css` | Add `.btn:disabled` / `.btn-disabled` style: reduced opacity, no pointer cursor, no hover transform. |

### CSS

```css
.btn:disabled,
.btn.btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Toolbar changes

```tsx
<button
  className={`btn btn-secondary ${copied ? 'btn-copied' : ''}`}
  onClick={onCopy}
  disabled={!hasOutput}
  title={hasOutput ? 'Copy output' : 'Nothing to copy'}
>
```

Same pattern for Download button.

---

## Fix 4: Smooth Theme Transition

**Problem**: Changing theme snaps all colors instantly. Feels jarring.

**Solution**: Add a CSS transition on all custom-property-driven colors on the root. Since CSS custom properties can't be directly transitioned, use a `color-scheme-transition` class that temporarily adds `transition` to key elements.

### Approach: `transition` on individual properties

Add to `:root`:
```css
:root {
  /* ... existing vars ... */
}

/* Transition all theme-sensitive elements */
:root.theme-transitioning,
:root.theme-transitioning *,
:root.theme-transitioning *::before,
:root.theme-transitioning *::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
}
```

### Changes

| File | Change |
|------|--------|
| `src/index.css` | Add `.theme-transitioning` rule set. |
| `src/App.tsx` | In the theme `useEffect`, add `theme-transitioning` class to `<html>` before changing `data-theme`, then remove it after 350ms. |

### App.tsx theme effect

```typescript
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
```

---

## Fix 5: Inline Error Banner

**Problem**: Conversion errors appear only in the 11px status bar at the bottom — easy to miss.

**Solution**: Add an error banner between the panel header and the editor in the input panel. Keep the status bar error as secondary detail (line/column).

### Changes

| File | Change |
|------|--------|
| `src/components/ErrorBanner.tsx` | New component — dismissible error banner with icon, message, and optional line/column. |
| `src/App.tsx` | Render `<ErrorBanner>` inside the input panel `<div>`, between panel-header and EditorPanel. |
| `src/index.css` | Style `.error-banner`: red-tinted background, left red border, icon + message + dismiss button. |

### ErrorBanner component

```tsx
interface ErrorBannerProps {
  error: ConversionError | null;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when error changes
  useEffect(() => { setDismissed(false); }, [error?.message]);

  if (!error || dismissed) return null;

  return (
    <div className="error-banner">
      <svg className="error-banner-icon" ... />
      <span className="error-banner-msg">{error.message}</span>
      {error.line != null && (
        <span className="error-banner-loc">Line {error.line}{error.column != null ? `, Col ${error.column}` : ''}</span>
      )}
      <button className="error-banner-close" onClick={() => setDismissed(true)} aria-label="Dismiss">×</button>
    </div>
  );
}
```

### CSS

```css
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--error-bg);
  border-left: 3px solid var(--error);
  font-size: 12px;
  color: var(--error);
  flex-shrink: 0;
}
.error-banner-msg { flex: 1; }
.error-banner-loc { color: var(--text-muted); font-size: 11px; white-space: nowrap; }
.error-banner-close {
  background: none; border: none; color: var(--error); cursor: pointer;
  font-size: 16px; padding: 0 4px; opacity: 0.6;
}
.error-banner-close:hover { opacity: 1; }
```

---

## Fix 6: Reset to Defaults in Settings

**Problem**: No way to reset changed settings without clearing localStorage manually.

**Solution**: Add a "Reset to defaults" button at the bottom of the settings drawer.

### Changes

| File | Change |
|------|--------|
| `src/components/SettingsDrawer.tsx` | Add a reset button at the bottom of `.settings-body`. On click, call `onUpdate(DEFAULT_SETTINGS)`. |
| `src/types/settings.ts` | Export `DEFAULT_SETTINGS` (already exported). |
| `src/index.css` | Style `.settings-reset-btn`. |

### SettingsDrawer addition

```tsx
import { DEFAULT_SETTINGS } from '../types/settings';

// At the bottom of .settings-body, after the last fieldset:
<div className="settings-footer">
  <button
    className="btn btn-ghost settings-reset-btn"
    onClick={() => onUpdate(DEFAULT_SETTINGS)}
  >
    Reset to defaults
  </button>
</div>
```

### CSS

```css
.settings-footer {
  padding: 16px 0;
  border-top: 1px solid var(--border);
  margin-top: 8px;
  text-align: center;
}
.settings-reset-btn {
  color: var(--text-muted);
  font-size: 12px;
}
.settings-reset-btn:hover { color: var(--error); }
```

---

## Fix 7: Empty State Guidance

**Problem**: Cleared input shows a bare placeholder. No guidance or call to action.

**Solution**: When input is empty, show a centered empty state overlay with options: "Load sample", "Open file", or instructions.

### Changes

| File | Change |
|------|--------|
| `src/components/EmptyState.tsx` | New component with icon, text, and action buttons. |
| `src/App.tsx` | Render `<EmptyState>` over the input panel when `input` is empty. Pass `onLoadSample` and `onOpenFile` callbacks. |
| `src/index.css` | Style `.empty-state` as centered overlay. |

### EmptyState component

```tsx
interface EmptyStateProps {
  onLoadSample: () => void;
  onOpenFile: () => void;
}

export function EmptyState({ onLoadSample, onOpenFile }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <svg className="empty-state-icon" width="48" height="48" ...>
        {/* curly brace + angle bracket icon */}
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
```

### App.tsx integration

```tsx
{/* Inside the input panel div, after EditorPanel */}
{!input.trim() && (
  <EmptyState
    onLoadSample={() => setInput(SAMPLE_JSON)}
    onOpenFile={() => fileInputRef.current?.click()}
  />
)}
```

### CSS

```css
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 5;
  pointer-events: none;
}
.empty-state > * { pointer-events: auto; }
.empty-state-icon { color: var(--text-muted); opacity: 0.3; }
.empty-state-title { font-size: 15px; font-weight: 600; color: var(--text-h); }
.empty-state-hint { font-size: 13px; color: var(--text-muted); }
.empty-state-actions { display: flex; gap: 8px; margin-top: 4px; }
```

---

## Fix 8: Real-Time Input Validation

**Problem**: Syntax errors only surface after conversion. Users don't know their input is malformed until they see the error in the status bar.

**Solution**: Add CodeMirror lint extension that runs the existing `validator.ts` logic and shows gutter markers + squiggly underlines.

### Changes

| File | Change |
|------|--------|
| `src/components/EditorPanel.tsx` | Add CM6 `linter()` extension from `@codemirror/lint`. Create a custom lint source that calls `validateJson()` / `validateXml()` and maps errors to CM diagnostics. |
| `src/index.css` | Style the lint gutter and tooltips to match the dark theme. |

### Implementation details

```typescript
import { linter, type Diagnostic } from '@codemirror/lint';
import { validateXml } from '../lib/validator';

function createLintSource(language: string) {
  return linter((view) => {
    const doc = view.state.doc.toString();
    if (!doc.trim()) return [];
    const diagnostics: Diagnostic[] = [];

    if (language === 'json') {
      try { JSON.parse(doc); }
      catch (e) {
        // JSON.parse errors don't give positions reliably, so mark line 1
        diagnostics.push({
          from: 0, to: Math.min(doc.length, 100),
          severity: 'error',
          message: (e as Error).message,
        });
      }
    } else if (language === 'xml') {
      const result = validateXml(doc);
      if (result) {
        const line = result.line ? view.state.doc.line(Math.min(result.line, view.state.doc.lines)) : null;
        diagnostics.push({
          from: line?.from ?? 0,
          to: line?.to ?? Math.min(doc.length, 100),
          severity: 'error',
          message: result.message,
        });
      }
    }

    return diagnostics;
  }, { delay: 500 });
}
```

Add to `buildExtensions`:
```typescript
!readOnly ? createLintSource(language) : [],
```

### CSS overrides for lint markers

```css
.cm-diagnostic-error { border-left-color: var(--error); background: var(--error-bg); }
.cm-lint-marker-error { color: var(--error); }
.cm-lintRange-error { background-image: none; text-decoration: wavy underline var(--error); text-underline-offset: 3px; }
```

**Note**: Requires adding `@codemirror/lint` as a dependency. Run `npm install @codemirror/lint`.

---

## Fix 9: Debounce Pending Indicator

**Problem**: During the 300ms auto-convert debounce, there's no visual signal that conversion is queued. The UI looks frozen.

**Solution**: Expose a `pending` state from `useConversion` and show a subtle pulsing dot in the status bar.

### Changes

| File | Change |
|------|--------|
| `src/hooks/useConversion.ts` | Add `pending` boolean state. Set `true` when debounce timer starts, set `false` when conversion completes. |
| `src/App.tsx` | Pass `pending` to `<StatusBar>`. |
| `src/components/StatusBar.tsx` | When `pending` is true and no error, show a pulsing dot + "Converting..." instead of "Ready". |
| `src/index.css` | Add `@keyframes pulse` animation for the pending dot. |

### useConversion changes

```typescript
const [pending, setPending] = useState(false);

useEffect(() => {
  if (!autoConvert) return;
  setPending(true);
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    convert(input);
    setPending(false);
  }, 300);
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [input, autoConvert, convert]);

return { result, detectedFormat, conversionTime, manualConvert, pending };
```

### StatusBar changes

```tsx
// New condition before the existing "Ready" fallback:
) : pending ? (
  <span className="status-pending">
    <span className="pending-dot" />
    Converting...
  </span>
)
```

### CSS

```css
.status-pending { color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
.pending-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 0.8s ease-in-out infinite alternate;
}
@keyframes pulse { from { opacity: 0.3; } to { opacity: 1; } }
```

---

## Fix 10: Keyboard Shortcuts Help Modal

**Problem**: Keyboard shortcuts are only visible on button hover (in `<kbd>` tags). Most users never discover them.

**Solution**: Add a shortcuts help modal triggered by pressing `?` or via a button in the toolbar/settings.

### Changes

| File | Change |
|------|--------|
| `src/components/ShortcutsModal.tsx` | New component — modal listing all shortcuts in a clean table. |
| `src/App.tsx` | Add `shortcutsOpen` state. Toggle on `?` keypress. Add link in settings or toolbar. |
| `src/index.css` | Style `.shortcuts-modal` with backdrop, centered card, two-column layout. |

### ShortcutsModal component

```tsx
const SHORTCUTS = [
  { keys: 'Ctrl + Enter', action: 'Convert' },
  { keys: 'Ctrl + Shift + C', action: 'Copy output' },
  { keys: 'Ctrl + Shift + S', action: 'Swap input ↔ output' },
  { keys: 'Ctrl + Shift + B', action: 'Beautify input' },
  { keys: 'Ctrl + Shift + M', action: 'Minify input' },
  { keys: 'Ctrl + ,', action: 'Toggle settings' },
  { keys: '?', action: 'Show this help' },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <div className="shortcuts-backdrop" onClick={onClose} />
      <div className="shortcuts-modal" role="dialog" aria-label="Keyboard shortcuts">
        <h3>Keyboard Shortcuts</h3>
        <table>
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.keys}>
                <td><kbd>{s.keys}</kbd></td>
                <td>{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </>
  );
}
```

### Keyboard listener addition in App.tsx

```typescript
} else if (e.key === '?' && !e.ctrlKey && !e.shiftKey) {
  // Don't trigger if user is typing in an input/editor
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
  if (document.querySelector('.cm-focused')) return;
  e.preventDefault();
  setShortcutsOpen((o) => !o);
}
```

---

## Fix 11: Dynamic Syntax Theme Switching

**Problem**: Both `darkHighlight` and `lightHighlight` are registered via `syntaxHighlighting()` simultaneously. CodeMirror applies both, and whichever is registered last effectively wins for overlapping tags. This means dark theme colors always show (since it's registered first and light overrides it), or vice versa. The syntax colors don't actually change with the theme.

**Solution**: Use a CM6 `Compartment` to dynamically switch the active `HighlightStyle` based on the current theme.

### Changes

| File | Change |
|------|--------|
| `src/components/EditorPanel.tsx` | Create a `themeCompartment` that holds only the active highlight style. Switch it when the theme changes. |
| `src/hooks/useSettings.ts` | Ensure `theme` is exposed via context (already is). |

### Implementation details

```typescript
const highlightCompartment = new Compartment();

function getActiveHighlight(): HighlightStyle {
  const root = document.documentElement;
  const theme = root.getAttribute('data-theme');
  if (theme === 'light') return lightHighlight;
  if (theme === 'dark') return darkHighlight;
  // System: check media query
  return window.matchMedia('(prefers-color-scheme: light)').matches ? lightHighlight : darkHighlight;
}

// In buildExtensions, replace the two syntaxHighlighting lines with:
highlightCompartment.of(syntaxHighlighting(getActiveHighlight())),

// Add a MutationObserver or useEffect that watches data-theme changes:
useEffect(() => {
  const view = viewRef.current;
  if (!view) return;
  const observer = new MutationObserver(() => {
    view.dispatch({
      effects: highlightCompartment.reconfigure(syntaxHighlighting(getActiveHighlight())),
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Also listen for system theme changes
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const handler = () => {
    if (!document.documentElement.getAttribute('data-theme')) {
      view.dispatch({
        effects: highlightCompartment.reconfigure(syntaxHighlighting(getActiveHighlight())),
      });
    }
  };
  mq.addEventListener('change', handler);

  return () => { observer.disconnect(); mq.removeEventListener('change', handler); };
}, []);
```

This ensures only one highlight style is active at a time, and it switches dynamically.

---

## Fix 12: Visual Distinction for Output Panel

**Problem**: Input and output panels look identical. Users can't immediately tell which side is editable.

**Solution**: Add subtle visual cues to the output panel.

### Changes

| File | Change |
|------|--------|
| `src/index.css` | Slightly different background for output panel. Add a "read-only" badge style. |
| `src/App.tsx` | Add a read-only indicator in the output panel header. |

### CSS

```css
.panel-output {
  background: var(--surface);  /* slightly lighter than input panel's --bg */
}

.readonly-badge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}
```

### App.tsx — output panel header

```tsx
<span className="panel-label">
  <span className={`panel-dot ${outputDot}`} />
  Output
  <span className="readonly-badge">Read-only</span>
</span>
```

---

## Fix 13: Swap Animation

**Problem**: Swap is instant — content disappears and reappears with no visual feedback.

**Solution**: Brief cross-fade animation on both panels when swap happens.

### Changes

| File | Change |
|------|--------|
| `src/App.tsx` | Add a `swapping` state that is `true` for 250ms after swap. Apply `.panel-swapping` class. |
| `src/index.css` | `.panel-swapping` applies a quick opacity 1→0→1 animation. |

### App.tsx

```typescript
const [swapping, setSwapping] = useState(false);

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
```

### CSS

```css
@keyframes swap-flash {
  0% { opacity: 1; }
  40% { opacity: 0.3; }
  100% { opacity: 1; }
}
.panel-swapping .editor-panel {
  animation: swap-flash 0.3s ease;
}
```

---

## Fix 14: About Section in Settings

**Problem**: No version info, no link to source, no "what is this" context.

**Solution**: Add a minimal footer in the settings drawer.

### Changes

| File | Change |
|------|--------|
| `src/components/SettingsDrawer.tsx` | Add an "About" fieldset at the bottom with version, description, and GitHub link. |
| `src/index.css` | Style `.settings-about`. |

### SettingsDrawer addition

```tsx
<fieldset>
  <legend>About</legend>
  <div className="settings-about">
    <p><strong>JsonToXML</strong> v1.0.0</p>
    <p>Free, private JSON ↔ XML converter. All processing runs in your browser — nothing is sent to a server.</p>
    <p>
      <a href="https://github.com/..." target="_blank" rel="noopener">GitHub</a>
      <span className="settings-about-sep">·</span>
      <button className="btn-link" onClick={() => { /* open shortcuts modal */ }}>Keyboard shortcuts</button>
    </p>
  </div>
</fieldset>
```

### CSS

```css
.settings-about {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}
.settings-about p + p { margin-top: 6px; }
.settings-about a,
.btn-link {
  color: var(--accent);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  padding: 0;
}
.settings-about a:hover,
.btn-link:hover { text-decoration: underline; }
.settings-about-sep { margin: 0 6px; color: var(--border); }
```

---

## Fix 15: Auto Button Does Nothing When Clicked

**Problem**: When `autoConvert` is true, the convert button shows "Auto" with a clock icon and `auto-mode` styling. Clicking it still calls `manualConvert()`, which does the same thing that's already happening automatically. The button gives no useful affordance — it looks like a status indicator that happens to be clickable.

**Solution**: Repurpose the button. When auto-convert is on, clicking the button should **toggle auto-convert off** (switching to manual mode). This makes the button a meaningful toggle between auto and manual modes.

### Changes

| File | Change |
|------|--------|
| `src/components/Toolbar.tsx` | Add `onToggleAutoConvert` prop. When `autoConvert` is true, button click calls `onToggleAutoConvert()` instead of `onConvert()`. Change tooltip to explain this. |
| `src/App.tsx` | Pass `onToggleAutoConvert={() => updateSettings({ autoConvert: !settings.autoConvert })}`. |

### Toolbar changes

```tsx
// New prop:
onToggleAutoConvert: () => void;

// Button onClick:
onClick={autoConvert ? onToggleAutoConvert : onConvert}

// Tooltip:
title={autoConvert ? 'Auto-convert is on (click to switch to manual)' : 'Convert (Ctrl+Enter)'}
```

When the user clicks "Auto", it flips to "Convert" (manual mode). This makes the button always do something meaningful. The user can click "Convert" to run manually, or click it again while in manual mode to convert.

**Alternative considered**: Make "Auto" a separate toggle chip and always show a "Convert" button. But this uses more toolbar space and the toggle already exists in settings.

---

## Fix 16: Beautify/Minify Context Confusion

**Problem**: Beautify and Minify sit in the global toolbar and always operate on the **input** panel. When the input is XML (and the user is doing XML→JSON), the buttons say "Beautify" / "Minify" with no indication that they act on the XML input. Users might expect them to format the JSON output, especially since the output is the "result" they care about.

**Solution**: Two changes:

### A. Label the buttons with the format they act on

When input is detected as JSON, show "Beautify JSON" / "Minify JSON". When XML, show "Beautify XML" / "Minify XML". On mobile (where text is hidden), add a small format dot or badge next to the icon.

### B. Add format buttons to the output panel too

Add "Beautify" and "Copy" quick-action buttons in the output panel header. The output beautify reformats the output in-place (display only, doesn't change the conversion result).

### Changes

| File | Change |
|------|--------|
| `src/components/Toolbar.tsx` | Beautify/Minify buttons show format label: `Beautify {FORMAT}`. Accept `detectedFormat` prop. |
| `src/App.tsx` | Pass `detectedFormat` to Toolbar. |
| `src/index.css` | Style the format indicator on the buttons. |

### Toolbar changes

```tsx
// New prop:
detectedFormat: DetectedFormat;

// Beautify button:
<button className="btn btn-secondary" onClick={onBeautify} title={`Beautify ${detectedFormat.toUpperCase()}`}>
  <svg ... />
  <span>Beautify</span>
  {detectedFormat !== 'unknown' && (
    <span className="btn-format-badge">{detectedFormat.toUpperCase()}</span>
  )}
</button>
```

### CSS

```css
.btn-format-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-muted);
  letter-spacing: 0.3px;
}
```

On mobile, the format badge is still visible (it's tiny enough) even when the text label is hidden, giving context for what the icon-only button does.

---

## Implementation Order

| Priority | Fix | Dependencies | Estimated LOC |
|----------|-----|-------------|---------------|
| 1 | **#15** Auto button toggle | None | ~15 |
| 2 | **#3** Disabled Copy/Download | None | ~20 |
| 3 | **#1** Draggable resizer | New hook | ~80 |
| 4 | **#16** Beautify/Minify context | None | ~30 |
| 5 | **#5** Inline error banner | New component | ~50 |
| 6 | **#9** Pending indicator | useConversion change | ~30 |
| 7 | **#4** Theme transition | CSS + small JS | ~15 |
| 8 | **#12** Output panel distinction | CSS + small JSX | ~15 |
| 9 | **#11** Dynamic syntax themes | CM6 compartments | ~60 |
| 10 | **#2** Preserve undo on swap | CM6 compartments (shared with #11) | ~40 |
| 11 | **#13** Swap animation | Small state + CSS | ~20 |
| 12 | **#7** Empty state | New component | ~40 |
| 13 | **#6** Reset to defaults | Small addition | ~10 |
| 14 | **#10** Shortcuts modal | New component | ~60 |
| 15 | **#8** Real-time validation | New dep + CM6 lint | ~50 |
| 16 | **#14** About section | Small addition | ~20 |

Fixes #11 and #2 share the CM6 compartment refactor and should be done together.

**Total estimated**: ~555 lines of changes across ~12 files (6 existing + 4-5 new components/hooks + 1 new dependency).
