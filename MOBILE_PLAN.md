# Mobile Adaptation Plan

A detailed plan to make JsonToXML fully usable and polished on mobile browsers (phones and small tablets).

---

## Current State Assessment

### What exists today (at `max-width: 768px`)
- **Mobile tabs**: Input/Output tab switcher shown, panels toggled via `.mobile-visible`
- **Toolbar**: Rows shrunk to 40px, action bar horizontally scrollable, button text labels hidden (icon-only)
- **Settings drawer**: Expanded to full width
- **Panel headers**: Hidden entirely
- **Center divider + swap button**: Hidden
- **Keyboard shortcuts badges**: Hidden

### Gaps and issues
1. **No viewport meta safety** — `initial-scale=1.0` is set, but `maximum-scale` and `user-scalable` are not controlled; double-tap zoom can accidentally trigger on toolbar buttons
2. **No touch target sizing** — Buttons are 32px tall (below the 44px Apple HIG / 48px Material minimum)
3. **No swipe gestures** — Users must tap tabs to switch panels; swipe between input/output would feel native
4. **Scrollable toolbar is invisible** — No scroll hint or fade gradient; users don't know they can scroll
5. **CodeMirror touch experience** — Default CM6 works on mobile but line numbers waste space; font size may be too small
6. **Status bar is cramped** — 28px height with 11px text is hard to read; error messages truncate
7. **Settings drawer UX** — No swipe-to-close; toggle targets are small on touch
8. **No safe area handling** — iPhone notch/home indicator overlap content
9. **File drop is useless on mobile** — Need a file-pick button instead
10. **No landscape consideration** — Landscape on phones leaves very little vertical space
11. **Toast position** — `bottom: 48px` may clash with the status bar on mobile
12. **Brand text wastes space** — Full "JsonToXML" text in toolbar takes horizontal room
13. **No pull-to-refresh prevention** — Overscroll can trigger browser refresh on Android

---

## Phase 1: Viewport and Safe Areas

**Goal**: Prevent accidental zoom, respect device safe areas (notch, home bar).

### Changes

1. **`index.html`** — Update viewport meta:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
   ```

2. **`index.css`** — Add safe area padding:
   ```css
   .app {
     padding-top: env(safe-area-inset-top);
     padding-bottom: env(safe-area-inset-bottom);
   }
   .toolbar-row:first-child {
     padding-left: max(12px, env(safe-area-inset-left));
     padding-right: max(12px, env(safe-area-inset-right));
   }
   .status-bar {
     padding-bottom: env(safe-area-inset-bottom);
   }
   ```

3. **Prevent overscroll refresh** in `index.css`:
   ```css
   html { overscroll-behavior: none; }
   ```

**Files**: `index.html`, `index.css`

---

## Phase 2: Touch Target Sizing

**Goal**: All interactive elements meet the 44px minimum touch target.

### Changes

1. **Toolbar buttons** — Increase mobile height to 44px:
   ```css
   @media (max-width: 768px) {
     .btn { height: 44px; min-width: 44px; padding: 0 10px; }
     .btn-icon { width: 44px; }
   }
   ```

2. **Mobile tabs** — Increase padding to 14px (total height ~46px):
   ```css
   @media (max-width: 768px) {
     .mobile-tab { padding: 14px 10px; font-size: 14px; }
   }
   ```

3. **Settings toggle tracks** — Enlarge to 44×24px:
   ```css
   @media (max-width: 768px) {
     .toggle-track { width: 44px; height: 24px; }
     .toggle-slider::after { width: 20px; height: 20px; }
     .toggle-track input:checked + .toggle-slider::after { transform: translateX(20px); }
     .setting-row { padding: 14px 0; }
     .setting-row select { height: 40px; font-size: 14px; }
   }
   ```

4. **Direction toggle buttons** — Larger padding:
   ```css
   @media (max-width: 768px) {
     .direction-btn { padding: 8px 12px; font-size: 12px; }
   }
   ```

**Files**: `index.css`

---

## Phase 3: Toolbar Redesign for Mobile

**Goal**: Compact, usable toolbar that doesn't require horizontal scrolling.

### Changes

1. **Single-row compact toolbar** on mobile — Merge the two rows:
   - Row 1 content (brand + direction toggle) collapses: hide brand text, keep brand icon
   - Direction toggle moves inline with action buttons
   - All fits in one 48px row

2. **Scroll fade indicator** — Add gradient masks to show more content exists:
   ```css
   @media (max-width: 768px) {
     .toolbar-row:last-child {
       mask-image: linear-gradient(to right, black 90%, transparent);
       -webkit-mask-image: linear-gradient(to right, black 90%, transparent);
     }
   }
   ```

3. **Hide brand text on mobile**, keep icon only:
   ```css
   @media (max-width: 768px) {
     .toolbar-brand span { display: none; }
   }
   ```

4. **Merge into single toolbar row** on mobile:
   ```css
   @media (max-width: 768px) {
     .toolbar { flex-direction: row; flex-wrap: wrap; }
     .toolbar-row:first-child { border-bottom: none; flex: 0 0 auto; }
     .toolbar-row { height: 48px; }
   }
   ```

**Files**: `index.css`, possibly `Toolbar.tsx` for layout restructure

---

## Phase 4: Swipe Gesture Navigation

**Goal**: Allow swiping left/right to switch between Input and Output panels.

### Changes

1. **New hook: `useSwipe.ts`** — Lightweight touch gesture detector:
   ```typescript
   interface UseSwipeOptions {
     onSwipeLeft?: () => void;
     onSwipeRight?: () => void;
     threshold?: number; // px, default 50
   }
   export function useSwipe(ref: RefObject<HTMLElement>, options: UseSwipeOptions): void;
   ```
   - Track `touchstart` → `touchend` delta
   - Only fire if horizontal delta > threshold and horizontal > vertical (prevent scroll hijack)
   - Passive event listeners for performance

2. **`App.tsx`** — Attach swipe to `editor-container`:
   ```typescript
   const editorRef = useRef<HTMLDivElement>(null);
   useSwipe(editorRef, {
     onSwipeLeft: () => setMobileTab('output'),
     onSwipeRight: () => setMobileTab('input'),
   });
   ```
   - Add `ref={editorRef}` to `<main className="editor-container">`

3. **Slide animation** — CSS transition on panel switch:
   ```css
   @media (max-width: 768px) {
     .editor-container {
       position: relative;
       overflow: hidden;
     }
     .panel {
       position: absolute;
       inset: 0;
       transform: translateX(-100%);
       transition: transform 0.25s ease;
       display: flex !important;
     }
     .panel.mobile-visible {
       transform: translateX(0);
     }
     .panel.panel-output {
       transform: translateX(100%);
     }
     .panel.panel-output.mobile-visible {
       transform: translateX(0);
     }
   }
   ```

4. **Dot indicator** under tabs — Small dots showing which panel is active (reinforce swipe affordance):
   ```css
   .mobile-tabs::after {
     content: '';
     position: absolute;
     bottom: 0;
     width: 40px;
     height: 3px;
     background: var(--accent);
     border-radius: 3px;
     transition: left 0.25s ease;
   }
   ```

**Files**: `src/hooks/useSwipe.ts` (new), `App.tsx`, `index.css`

---

## Phase 5: Mobile Editor Improvements

**Goal**: Optimize CodeMirror 6 for small screens.

### Changes

1. **Smaller line numbers or hide them** on mobile:
   ```css
   @media (max-width: 768px) {
     .cm-gutters { display: none; }
   }
   ```
   This gives back ~40px of horizontal space. Line numbers are less useful on mobile where screen width is precious.

2. **Increase editor font size** to prevent iOS auto-zoom on focus:
   ```css
   @media (max-width: 768px) {
     .cm-editor { font-size: 16px !important; }
   }
   ```
   iOS Safari auto-zooms on `<input>` or editable fields with font-size < 16px.

3. **Adjust line height and padding**:
   ```css
   @media (max-width: 768px) {
     .cm-content { padding: 8px 0; }
     .cm-line { padding: 0 8px; }
     .cm-scroller { line-height: 1.5; }
   }
   ```

4. **Placeholder text** — Shorter on mobile: update `App.tsx` to pass shorter placeholder on small screens, or use CSS to hide long text and show short via `::placeholder` (CodeMirror uses its own placeholder div, so CSS approach is simpler):
   ```css
   @media (max-width: 768px) {
     .cm-placeholder { font-size: 14px; }
   }
   ```

**Files**: `index.css`, `EditorPanel.tsx` (optional conditional line numbers)

---

## Phase 6: File Input for Mobile

**Goal**: Replace drag-and-drop (useless on mobile) with a file picker button.

### Changes

1. **Add file input button to mobile tabs bar** or toolbar:
   - Hidden `<input type="file" accept=".json,.xml,.txt">` element
   - Small "Open File" icon button visible only on mobile
   - On file select: read via `FileReader`, call `setInput(text)`

2. **`App.tsx`** — Add file picker logic:
   ```typescript
   const fileInputRef = useRef<HTMLInputElement>(null);
   const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }
     const reader = new FileReader();
     reader.onload = () => setInput(reader.result as string);
     reader.readAsText(file);
     e.target.value = ''; // reset for re-selection
   }, []);
   ```

3. **Mobile tabs area** — Add file button:
   ```tsx
   <div className="mobile-tabs">
     <button className="mobile-tab ..." onClick={() => setMobileTab('input')}>Input</button>
     <button className="mobile-tab ..." onClick={() => setMobileTab('output')}>Output</button>
     <button className="mobile-file-btn" onClick={() => fileInputRef.current?.click()}>
       <FileIcon /> {/* small upload icon */}
     </button>
     <input ref={fileInputRef} type="file" accept=".json,.xml,.txt" hidden onChange={handleFileSelect} />
   </div>
   ```

4. **CSS** for file button:
   ```css
   .mobile-file-btn {
     display: none; /* shown in @media */
     width: 44px; height: 44px;
     /* icon-only styling */
   }
   @media (max-width: 768px) {
     .mobile-file-btn { display: flex; }
   }
   ```

**Files**: `App.tsx`, `index.css`

---

## Phase 7: Status Bar and Error Display

**Goal**: Make status information readable on mobile.

### Changes

1. **Increase status bar height** on mobile:
   ```css
   @media (max-width: 768px) {
     .status-bar {
       height: auto;
       min-height: 32px;
       padding: 6px 12px;
       flex-wrap: wrap;
       gap: 4px;
       font-size: 12px;
     }
   }
   ```

2. **Error messages** — Show full error on tap (expandable):
   - Currently truncated with `text-overflow: ellipsis`
   - On mobile, make `.status-error` tappable to expand:
   ```css
   @media (max-width: 768px) {
     .status-error {
       white-space: normal;
       -webkit-line-clamp: 2;
       display: -webkit-box;
       -webkit-box-orient: vertical;
       overflow: hidden;
     }
     .status-error.expanded {
       -webkit-line-clamp: unset;
     }
   }
   ```
   - `StatusBar.tsx` — Add tap-to-expand toggle state

3. **Toast position** — Move above status bar:
   ```css
   @media (max-width: 768px) {
     .toast {
       bottom: calc(40px + env(safe-area-inset-bottom));
     }
   }
   ```

**Files**: `index.css`, `StatusBar.tsx`

---

## Phase 8: Settings Drawer Mobile Polish

**Goal**: Full-screen, native-feeling settings on mobile.

### Changes

1. **Full-screen drawer** (already `width: 100%`), but improve:
   ```css
   @media (max-width: 768px) {
     .settings-drawer {
       width: 100%;
       max-width: 100%;
       border-left: none;
       border-radius: 0;
     }
     .settings-header {
       padding: 16px 16px;
       padding-top: calc(16px + env(safe-area-inset-top));
     }
     .settings-body {
       padding: 16px;
       -webkit-overflow-scrolling: touch;
     }
   }
   ```

2. **Swipe-to-close** — Reuse `useSwipe` hook on the drawer:
   - Swipe right on the settings drawer → close
   - Apply to `.settings-drawer` element

3. **Larger touch targets** (covered in Phase 2)

4. **Close button** — Enlarge to 44px:
   ```css
   @media (max-width: 768px) {
     .close-btn { width: 44px; height: 44px; }
   }
   ```

**Files**: `index.css`, `SettingsDrawer.tsx`

---

## Phase 9: Landscape Mode

**Goal**: Handle landscape orientation on phones where vertical space is very limited.

### Changes

1. **Detect landscape** and reduce chrome:
   ```css
   @media (max-width: 768px) and (orientation: landscape) {
     .toolbar-row { height: 36px; }
     .mobile-tabs { display: none; }
     .status-bar { height: 24px; min-height: 24px; font-size: 10px; }
     /* Show both panels side-by-side in landscape */
     .panel { display: flex !important; transform: none !important; }
     .editor-container { flex-direction: row; }
     .center-divider { display: flex; width: 3px; }
   }
   ```

2. **Revert to side-by-side** layout in landscape — since landscape gives width but takes height, the desktop layout is actually better. Hide mobile tabs and show both panels.

**Files**: `index.css`

---

## Phase 10: Performance Optimizations

**Goal**: Ensure smooth 60fps interactions on mid-range mobile devices.

### Changes

1. **Debounce input more aggressively on mobile** — Increase from 300ms to 500ms:
   - `useConversion.ts` — Accept a `debounceMs` parameter
   - `App.tsx` — Pass `500` on mobile (detect via `window.matchMedia`)

2. **Reduce CodeMirror extensions on mobile**:
   - Disable `highlightActiveLine()` (unnecessary visual overhead)
   - Disable `highlightSelectionMatches()` (expensive on large docs)
   - `EditorPanel.tsx` — Accept `mobile` prop or detect internally

3. **`will-change` hints** for animated elements:
   ```css
   .panel { will-change: transform; }
   .settings-drawer { will-change: transform; }
   ```

4. **Passive event listeners** — Ensure all touch handlers are passive where possible (swipe hook)

5. **Limit input size warning** — On mobile, warn at 1MB instead of 10MB (slower parsing on phone):
   - `EditorPanel.tsx` `handleDrop` and new file picker

**Files**: `useConversion.ts`, `EditorPanel.tsx`, `App.tsx`, `index.css`

---

## Phase 11: Progressive Web App (PWA) Basics

**Goal**: Allow "Add to Home Screen" for a native app feel.

### Changes

1. **`public/manifest.json`** — Basic PWA manifest:
   ```json
   {
     "name": "JsonToXML",
     "short_name": "JsonToXML",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0c0d12",
     "theme_color": "#0c0d12",
     "icons": [
       { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
     ]
   }
   ```

2. **`index.html`** — Link manifest:
   ```html
   <link rel="manifest" href="/manifest.json" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
   ```

3. **No service worker** needed — the app is fully client-side and doesn't need offline caching for now. The manifest alone enables "Add to Home Screen" on most browsers.

**Files**: `public/manifest.json` (new), `index.html`

---

## Implementation Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 1 — Viewport & Safe Areas | Small | High — prevents broken layout on notch devices |
| 2 | Phase 2 — Touch Target Sizing | Small | High — usability baseline |
| 3 | Phase 5 — Mobile Editor | Small | High — prevents iOS auto-zoom, reclaims space |
| 4 | Phase 3 — Toolbar Redesign | Medium | High — eliminates scroll confusion |
| 5 | Phase 7 — Status Bar | Small | Medium — readability |
| 6 | Phase 6 — File Input | Medium | Medium — critical missing feature |
| 7 | Phase 4 — Swipe Gestures | Medium | Medium — polish and feel |
| 8 | Phase 9 — Landscape Mode | Small | Medium — covers second orientation |
| 9 | Phase 8 — Settings Drawer | Small | Low — already works, just polish |
| 10 | Phase 10 — Performance | Medium | Medium — smoother on low-end |
| 11 | Phase 11 — PWA | Small | Low — nice-to-have |

---

## Testing Checklist

- [ ] iPhone SE (375px) — smallest common phone
- [ ] iPhone 14 Pro (393px) — notch + Dynamic Island
- [ ] iPhone 14 Pro Max (430px) — large phone
- [ ] Pixel 7 (412px) — Android baseline
- [ ] Samsung Galaxy Fold (280px folded / 717px unfolded) — extreme widths
- [ ] iPad Mini (768px) — breakpoint boundary
- [ ] All devices in landscape orientation
- [ ] iOS Safari, Chrome, Firefox
- [ ] Android Chrome, Samsung Internet
- [ ] Test with browser dev tools throttling (4x CPU slowdown)
- [ ] Test with keyboard visible (virtual keyboard reduces viewport)
- [ ] Test "Add to Home Screen" on iOS and Android
