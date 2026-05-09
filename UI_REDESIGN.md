# JsonToXML — UI Redesign Plan

## Current State Audit

### Problems Identified

**1. Dark theme is broken — editor uses `defaultHighlightStyle` only**
- CodeMirror's `defaultHighlightStyle` is a light-only syntax theme. In dark mode, code text is nearly invisible against the dark editor background.
- The editor theme uses CSS variables for background and gutter colors, but syntax token colors (keywords, strings, numbers) are hardcoded light-mode values from `defaultHighlightStyle`.
- Fix: create a custom CodeMirror highlight style that responds to the theme, or ship both a light and dark highlight style and swap them.

**2. No visual separation between panels**
- The two editor panels are only divided by a 1px border. There's no visual cue about which panel is input vs output.
- The panel headers are flat and blend into the toolbar — they don't anchor the eye.
- Fix: add subtle background differentiation, a visible center divider, and stronger panel header treatment.

**3. Toolbar is cluttered and flat**
- All buttons have the same visual weight — primary actions (Convert, Copy) look identical to secondary actions (Beautify, Minify).
- The direction toggle looks like generic pill buttons — it doesn't communicate "this is the core mode selector."
- Too many visible toolbar separators create visual noise.
- Fix: establish visual hierarchy — primary/secondary/ghost button tiers, group related actions, hide less-used actions behind overflow or contextual placement.

**4. Stale Vite scaffold assets**
- `favicon.svg` is still the Vite lightning bolt. `hero.png`, `react.svg`, `vite.svg` are scaffold leftovers that aren't used but still ship in the source tree.
- `index.html` title says "jsontoxml" (lowercase, no branding).
- `public/icons.svg` contains Vite community social icons, not app icons.
- Fix: create a proper favicon/logo, clean up unused assets, set proper page title and meta tags.

**5. Light theme is the default — dark should be**
- The app is a developer tool. Developer tools default to dark. Current default is light, which feels outdated and generic.
- The light theme itself is too white/washed — lacks the premium "SaaS" depth.
- Fix: make dark the default, refine both themes with more depth and contrast.

**6. Settings drawer feels like a form, not a panel**
- Native checkboxes and selects look different on every OS. No consistent visual style.
- No descriptions or hints under toggles — users don't know what "Always create arrays" means.
- Fix: custom toggle switches, help text under each option, consistent styling.

**7. Status bar is underutilized**
- The size badge has a confusing Blob-based calculation.
- "Ready" is generic — it should show conversion stats (e.g., "Converted in 3ms").
- Fix: show conversion timing, simplify size calculation, add more contextual info.

**8. No swap button**
- Converting in the opposite direction requires manually copying output, pasting into input, and switching direction. There should be a single swap button between the panels.

**9. No empty state**
- When input is empty, the output panel is a blank void. There should be visual guidance — a centered illustration or prompt.

**10. Toast is minimal**
- The copy-to-clipboard toast is a floating pill. It doesn't feel connected to the action. Better: brief inline feedback on the Copy button itself (checkmark animation).

**11. No keyboard shortcuts**
- No visible shortcut hints. Common actions like Convert (Ctrl+Enter), Copy (Ctrl+Shift+C), Swap (Ctrl+Shift+S) should be wired and discoverable.

**12. Mobile layout is an afterthought**
- Stacked panels with no way to toggle between input/output fullscreen.
- Toolbar wraps messily.
- Fix: tab-based panel switching on mobile, collapsible toolbar.

---

## Redesign Specification

### Phase 1: Dark-First Theme & Color System

**1.1 New color palette**

Replace the current CSS variable system with a refined dark-first palette:

```
Dark (default):
  --bg:          #0c0d12     (deeper, less blue than current #0f1117)
  --surface:     #14161e     (card/panel background)
  --surface-2:   #1a1d28     (elevated surface — toolbar, headers)
  --border:      #232736     (subtle, low-contrast borders)
  --border-hover:#2f3447
  --text:        #a0a6b6     (body text — higher contrast than current)
  --text-h:      #e8eaf0     (headings)
  --text-muted:  #565c6e
  --accent:      #7c8cf5     (slightly warmer blue-violet)
  --accent-hover:#9aa4f8
  --accent-glow: rgba(124,140,245,0.15)   (new: subtle glow for hover states)
  --error:       #f87171
  --success:     #4ade80
  --json-color:  #fbbf24     (amber badge for JSON)
  --xml-color:   #7c8cf5     (accent badge for XML)

Light (optional):
  --bg:          #f4f5f7
  --surface:     #ffffff
  --surface-2:   #f9fafb
  (... recalibrate all tokens for light)
```

**1.2 Editor syntax themes**

Create two CodeMirror `HighlightStyle` objects:

- **Dark theme**: token colors from a Dracula/One Dark Pro inspired palette:
  - keywords: `#c792ea` (soft purple)
  - strings: `#a5d6a7` (green)
  - numbers: `#f78c6c` (orange)
  - property names: `#82aaff` (blue)
  - comments: `#546e7a` (grey)
  - punctuation/brackets: `#89ddff` (cyan)
  - tag names (XML): `#f07178` (red)
  - attribute names (XML): `#ffcb6b` (yellow)
  - attribute values (XML): `#a5d6a7` (green)

- **Light theme**: recalibrated dark versions of the same hues.

Swap the highlight style based on the active theme using a CodeMirror `Compartment`.

**1.3 Default to dark**

Change `DEFAULT_SETTINGS.theme` from `'system'` to `'dark'`.

### Phase 2: Layout & Structure

**2.1 Redesigned toolbar**

Split into two rows on desktop:

```
┌──────────────────────────────────────────────────────────────┐
│  { } JsonToXML          [Auto] [JSON→XML] [XML→JSON]    [⚙] │
│  [▶ Convert]  [✨ Beautify] [— Minify]  │  [📋 Copy] [↓]   │
└──────────────────────────────────────────────────────────────┘
```

Changes:
- **Brand**: Add an inline SVG logo mark (curly brace + angle bracket icon) before the text.
- **Direction toggle**: Pill group with background highlight that slides (animated indicator).
- **Action buttons**: Split into two tiers:
  - Left group: transformation actions (Convert, Beautify, Minify)
  - Right group: output actions (Copy, Download)
- **Settings gear**: moves to far right of top row, uses a ghost button style.
- **Convert button**: always visible, styled as the primary CTA with a subtle glow ring. Disabled state when auto-convert is on (show as "Auto" with a lightning bolt icon instead of hiding).
- Remove the divider separators — use spacing and grouping instead.

**2.2 Panel headers with color coding**

- Input panel header: left-aligned label "INPUT" with a small colored dot indicator (amber for JSON, blue for XML).
- Output panel header: "OUTPUT" with the inverse dot.
- Per-panel action buttons in the header: input gets a "Clear" button, output gets "Copy" and "Download" buttons (relocate from toolbar).

**2.3 Center divider**

- Vertical divider between panels: 4px wide, `--border` color, with a centered swap button (two arrows icon) that swaps input/output content and flips the direction.
- On hover, the divider highlights to `--accent` color.

**2.4 Panel backgrounds**

- Input panel: `--surface` background
- Output panel: slightly different `--bg` background (very subtle differentiation)
- This gives a visual "from → to" reading direction.

### Phase 3: Button System

**3.1 Button variants**

Define three button tiers via CSS classes:

| Variant | Use | Style |
|---------|-----|-------|
| `.btn-primary` | Convert | Filled `--accent` background, white text, subtle `box-shadow` glow ring |
| `.btn-secondary` | Beautify, Minify, Copy, Download | Transparent background, `--border` border, `--text` color. On hover: `--surface-2` fill |
| `.btn-ghost` | Settings, Clear, inline actions | No border, no background. On hover: `--surface-2` background |

**3.2 Button anatomy**

All buttons get:
- `height: 32px` (consistent)
- `border-radius: 6px`
- `gap: 6px` between icon and label
- `font-size: 13px`, `font-weight: 500`
- `transition: all 0.15s ease`
- Icon size: 16x16 SVG, `stroke-width: 1.5`

**3.3 Hover/active states**

- Hover: background lightens, subtle `translateY(-1px)` lift
- Active: `translateY(0)`, background darkens slightly
- Focus-visible: `2px` outline ring in `--accent` with `2px` offset

**3.4 Copy button feedback**

When clicked, the copy icon morphs to a checkmark (CSS transition on the SVG path, or swap icon + text to "Copied!" for 1.5s). No floating toast needed.

### Phase 4: Custom Favicon & Branding

**4.1 New favicon**

Replace the Vite bolt with a custom SVG combining `{ }` and `< >`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <!-- Left: JSON brace -->
  <path d="M10 6C8 6 7 7.5 7 9v4c0 1.5-1 3-3 3 2 0 3 1.5 3 3v4c0 1.5 1 3 3 3"
        stroke="#fbbf24" fill="none" stroke-width="2" stroke-linecap="round"/>
  <!-- Right: XML bracket -->
  <path d="M22 6c2 0 3 1.5 3 3v4c0 1.5 1 3 3 3-2 0-3 1.5-3 3v4c0 1.5-1 3-3 3"
        stroke="#7c8cf5" fill="none" stroke-width="2" stroke-linecap="round"/>
  <!-- Center: arrow -->
  <path d="M13 16h6m0 0l-2-2m2 2l-2 2"
        stroke="#e8eaf0" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**4.2 Inline logo in toolbar**

Same design as favicon, rendered inline at 24x24 next to the "JsonToXML" brand text.

**4.3 Page metadata**

Update `index.html`:
- Title: `JsonToXML — JSON & XML Converter`
- Add `<meta name="description" content="Convert between JSON and XML instantly. Free, private, runs in your browser.">`
- Add `theme-color` meta tag: `#0c0d12`

**4.4 Clean up assets**

Delete unused scaffold files:
- `src/assets/hero.png`
- `src/assets/react.svg`
- `src/assets/vite.svg`
- `public/icons.svg` (Vite social icons)

### Phase 5: Settings Drawer Overhaul

**5.1 Custom toggle switches**

Replace native checkboxes with a CSS-only toggle switch:
- 36x20px track, 16px knob
- Track: `--border` when off, `--accent` when on
- Knob: white, slides with `transition: transform 0.15s`
- Uses a hidden `<input type="checkbox">` + `<span>` for the visual track.

**5.2 Help text**

Add a `<small>` under each toggle with a brief description:

| Setting | Help text |
|---------|-----------|
| Auto-convert | Convert automatically as you type (300ms debounce) |
| Infer types | Parse "123" as number, "true"/"false" as boolean |
| Always create arrays | Wrap single XML elements in arrays for consistent round-trips |
| Preserve comments | Include XML comments as #comment properties in JSON |
| Add XML declaration | Prepend `<?xml version="1.0"?>` to XML output |

**5.3 Styled selects**

Replace native `<select>` with a custom dropdown or at minimum apply consistent dark styling:
- Dark background, light text, accent border on focus
- Custom dropdown arrow icon

**5.4 Section spacing**

More generous padding between fieldsets. Add subtle horizontal rules between sections.

### Phase 6: Empty & Error States

**6.1 Empty input state**

When input is empty, show a centered prompt inside the input panel (below the CodeMirror placeholder):

```
     { } ↔ < >

  Paste JSON or XML to convert
  or drag & drop a file here
```

Rendered as a subtle, centered overlay with muted text and the logo icon at 48px.

**6.2 Error state**

When a parse error exists:
- Input panel header: dot indicator turns red
- Status bar error message: truncated with "..." and a tooltip on hover showing the full message
- Editor gutter: red line marker at the error line (requires mapping the error line to a CodeMirror `gutter-marker`)

### Phase 7: Swap Button & Keyboard Shortcuts

**7.1 Swap button**

Centered in the vertical divider between panels:
- Circular button, 32x32, `--surface-2` background, `--border` border
- Contains a bidirectional horizontal arrow icon (⇄)
- On click: moves output text to input, clears output, swaps direction
- On hover: rotates the icon 180deg, border goes `--accent`

**7.2 Keyboard shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Convert (manual trigger) |
| `Ctrl+Shift+C` | Copy output to clipboard |
| `Ctrl+Shift+S` | Swap input/output |
| `Ctrl+Shift+B` | Beautify input |
| `Ctrl+Shift+M` | Minify input |
| `Ctrl+,` | Open/close settings drawer |

Register via a `useEffect` on `window.addEventListener('keydown', ...)`.

Show shortcut hints as small `<kbd>` badges on toolbar button tooltips.

### Phase 8: Responsive & Mobile

**8.1 Mobile layout (< 768px)**

- Panels switch from side-by-side to a **tabbed** layout:
  - Two tabs at the top of the editor area: "Input" / "Output"
  - Only one panel visible at a time, full width
  - Active tab has an accent underline

- Toolbar collapses:
  - Top row: logo + direction toggle
  - Bottom row: action buttons in a horizontally scrollable strip
  - Settings accessible via a bottom sheet instead of side drawer

**8.2 Tablet (768–1024px)**

- Same side-by-side layout but tighter padding
- Toolbar buttons drop their text labels, show icons only

### Phase 9: Micro-Interactions & Polish

**9.1 Direction toggle animation**

The active indicator behind the direction buttons slides smoothly using `transform: translateX()` and `transition: transform 0.2s ease`. Background highlight pill moves, not snaps.

**9.2 Panel header transitions**

When the detected format changes (e.g., user pastes XML into what was JSON), the format badge does a brief `scale(1.1)` pulse and color transition.

**9.3 Conversion flash**

When conversion completes, the output panel does a very subtle background flash (`--accent-glow` for 200ms then fades) to signal "new content."

**9.4 Settings drawer animation**

Current slide-in is fine. Add backdrop blur to the overlay: `backdrop-filter: blur(4px)`.

**9.5 Smooth scroll in editors**

Ensure CodeMirror has smooth scrolling enabled.

---

## Implementation Order

| Step | Changes | Files Touched |
|------|---------|---------------|
| 1 | New color system, dark-first default | `index.css`, `types/settings.ts` |
| 2 | Custom CodeMirror dark/light syntax themes | `components/EditorPanel.tsx` |
| 3 | New favicon, clean up assets, update page meta | `public/favicon.svg`, `index.html`, delete scaffold assets |
| 4 | Redesigned toolbar (two-tier, button variants, logo) | `components/Toolbar.tsx`, `index.css` |
| 5 | Panel header redesign, center divider, swap button | `App.tsx`, `index.css` |
| 6 | Button system (primary/secondary/ghost, hover states) | `index.css` |
| 7 | Settings drawer (toggle switches, help text, styled selects) | `components/SettingsDrawer.tsx`, `index.css` |
| 8 | Status bar improvements (timing, simplified size) | `components/StatusBar.tsx`, `hooks/useConversion.ts` |
| 9 | Empty state overlay | `components/EditorPanel.tsx` or new `EmptyState.tsx` |
| 10 | Copy button inline feedback (replace toast) | `App.tsx`, `components/Toolbar.tsx` |
| 11 | Keyboard shortcuts | `App.tsx` (new `useEffect`) |
| 12 | Mobile tab layout | `App.tsx`, `index.css` |
| 13 | Micro-interactions (direction slide, conversion flash, format pulse) | `index.css`, component tweaks |

**Estimated file count**: 8 files modified, 2 new files, 4 files deleted.
