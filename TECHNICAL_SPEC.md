# JsonToXML — Technical Specification

## 1. Product Overview

JsonToXML is a client-side web application for bidirectional conversion between JSON and XML. It provides a modern, SaaS-like interface with syntax-highlighted editors, real-time conversion, input beautification, and robust error handling. All processing runs in the browser — no data leaves the user's machine.

## 2. Functional Requirements

### 2.1 Core Conversion

| ID | Requirement |
|----|-------------|
| F-1 | Convert valid JSON input to well-formed XML output |
| F-2 | Convert valid XML input to JSON output |
| F-3 | Support round-trip conversion with documented fidelity limitations |
| F-4 | Preserve XML attributes using a configurable key convention (default: `@_` prefix) |
| F-5 | Preserve XML text content using a configurable key (default: `#text`) |
| F-6 | Handle CDATA sections, converting to/from string values |
| F-7 | Handle XML comments (optionally preserve or strip, configurable) |
| F-8 | Handle XML declarations (`<?xml ... ?>`) on output |
| F-9 | Convert JSON arrays to repeated XML sibling elements |
| F-10 | Provide an option to always wrap single elements as arrays for consistent round-trip behavior |

### 2.2 Formatting & Beautification

| ID | Requirement |
|----|-------------|
| F-11 | Pretty-print JSON output with configurable indentation (2 or 4 spaces, tabs) |
| F-12 | Pretty-print XML output with configurable indentation |
| F-13 | Minify JSON (strip whitespace) on demand |
| F-14 | Minify XML (strip whitespace between tags) on demand |

### 2.3 Editor

| ID | Requirement |
|----|-------------|
| F-15 | Syntax-highlighted editor for both input and output panels |
| F-16 | Line numbers in both panels |
| F-17 | Inline error markers at the line/column where parsing fails |
| F-18 | Auto-detect input format (JSON vs XML) based on content |
| F-19 | Manual format override via toolbar toggle |

### 2.4 Input/Output

| ID | Requirement |
|----|-------------|
| F-20 | Paste text directly into the input editor |
| F-21 | Drag-and-drop file upload (.json, .xml) into the input panel |
| F-22 | Copy output to clipboard via button |
| F-23 | Download output as a file (.json or .xml) |
| F-24 | File size limit of 10 MB with user-facing warning |

### 2.5 Settings

| ID | Requirement |
|----|-------------|
| F-25 | Toggle: auto-convert on input change (debounced) vs manual convert button |
| F-26 | Toggle: preserve or strip XML comments |
| F-27 | Toggle: preserve or strip XML declarations |
| F-28 | Toggle: infer JSON types from XML string values (e.g., `"123"` → `123`) |
| F-29 | Select: attribute prefix convention (`@_`, `@`, `$`, custom) |
| F-30 | Select: indentation style (2 spaces, 4 spaces, tabs) |
| F-31 | Persist settings to `localStorage` |

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF-1 | Initial page load under 300 KB gzipped (excluding lazy-loaded chunks) |
| NF-2 | Conversion of a 1 MB input completes in under 500 ms |
| NF-3 | UI remains responsive during conversion (no main-thread blocking for inputs > 500 KB) |
| NF-4 | Works in latest versions of Chrome, Firefox, Safari, and Edge |
| NF-5 | Fully responsive layout from 375px (mobile) to 2560px (ultrawide) |
| NF-6 | Accessible: keyboard-navigable, ARIA labels, minimum contrast ratios (WCAG 2.1 AA) |
| NF-7 | Zero server-side dependencies — deployable as static files |

## 4. Structural Mismatches: JSON ↔ XML

These are inherent format incompatibilities that the application must handle. Each is a design decision, not a bug.

### 4.1 Attributes vs Properties

XML elements can carry attributes alongside child content. JSON has no attribute concept.

```xml
<book id="1" lang="en">Clean Code</book>
```
```json
{
  "book": {
    "@_id": "1",
    "@_lang": "en",
    "#text": "Clean Code"
  }
}
```

**Decision:** Use `@_` prefix for attributes (fast-xml-parser default). Expose this as a configurable setting (F-29).

### 4.2 Repeated Elements vs Arrays

XML allows multiple sibling elements with the same tag. JSON must use an explicit array. A single `<item>` is ambiguous — is it a value or a one-element array?

```xml
<root>
  <item>A</item>
  <item>B</item>
</root>
```
```json
{ "root": { "item": ["A", "B"] } }
```

**Decision:** By default, multiple siblings become an array; a single element becomes a value. Provide an "always array" toggle (F-10) for users who need consistent round-trip behavior.

### 4.3 Mixed Content

XML supports text interleaved with child elements: `<p>Hello <b>world</b></p>`. No clean JSON mapping exists.

**Decision:** Represent as `#text` keys interleaved with element keys. Document this as a known limitation in the UI help text.

### 4.4 Namespaces

XML namespaces (`xmlns:`, prefixed tag names) have no JSON equivalent.

**Decision:** Preserve namespace prefixes in JSON key names (e.g., `"soap:Envelope"`). Do not attempt to resolve or dereference namespace URIs.

### 4.5 Type Information

XML values are always strings. JSON distinguishes strings, numbers, booleans, and null.

- **JSON → XML:** All values become text content (type info lost).
- **XML → JSON:** Values remain strings unless type inference is enabled (F-28).

**Decision:** Default to no type inference. When enabled, apply: `"true"`/`"false"` → boolean, numeric strings → number, `"null"` → null.

### 4.6 Root Element

XML requires exactly one root element. JSON can have an array or object at top level.

**Decision:** For JSON → XML, if the top-level JSON object has a single key, that key becomes the root element. If it has multiple keys or is an array, wrap in a `<root>` element. Allow the user to specify a custom root element name.

### 4.7 XML Declarations, Processing Instructions, and Comments

These have no JSON representation.

**Decision:** Strip by default, optionally preserve (F-26, F-27). When generating XML output, optionally prepend `<?xml version="1.0" encoding="UTF-8"?>`.

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 19 | Already in place, React Compiler enabled |
| Build tool | Vite 8 | Already in place, fast HMR |
| Language | TypeScript ~5.9 | Already in place |
| Conversion engine | fast-xml-parser | Most popular, handles all edge cases, configurable, <50 KB gzipped |
| Code editor | CodeMirror 6 | Lightweight (~150 KB), extensible, JSON + XML language support |
| Styling | CSS (native nesting) | Already in place, no preprocessor needed |
| State management | React state + context | Sufficient scope; no external state library needed |

### 5.2 Module Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root layout, settings context provider
├── components/
│   ├── Toolbar.tsx             # Direction toggle, convert button, settings gear
│   ├── EditorPanel.tsx         # Wraps CodeMirror instance (reused for input & output)
│   ├── StatusBar.tsx           # Error display, input size, format detection badge
│   └── SettingsDrawer.tsx      # Slide-out settings panel
├── hooks/
│   ├── useConversion.ts        # Debounced conversion logic, error state
│   ├── useAutoDetect.ts        # Sniff input format (JSON vs XML)
│   └── useSettings.ts          # Settings state + localStorage persistence
├── lib/
│   ├── converter.ts            # Wraps fast-xml-parser: jsonToXml(), xmlToJson()
│   ├── formatter.ts            # Pretty-print and minify helpers
│   └── validator.ts            # Pre-parse validation, error extraction with line/col
├── workers/
│   └── converter.worker.ts     # Web Worker for large-input conversion (>500 KB)
├── types/
│   └── settings.ts             # Settings interface, conversion options type
└── styles/
    ├── index.css               # Global styles, CSS variables, theme
    └── App.css                 # Layout styles
```

### 5.3 Component Hierarchy

```
App
├── SettingsProvider (context)
│   ├── Toolbar
│   │   ├── DirectionToggle        [JSON→XML | XML→JSON | Auto]
│   │   ├── ConvertButton          (visible when auto-convert is off)
│   │   ├── FormatButton           (beautify / minify)
│   │   └── SettingsButton         (opens drawer)
│   ├── EditorPanel (input)
│   │   └── CodeMirror instance    (lang-json or lang-xml, editable)
│   ├── EditorPanel (output)
│   │   └── CodeMirror instance    (lang-xml or lang-json, read-only)
│   ├── StatusBar
│   │   ├── ErrorDisplay           (inline parse errors with line:col)
│   │   ├── SizeBadge              (input byte count)
│   │   └── FormatBadge            (detected: JSON / XML / Unknown)
│   └── SettingsDrawer
│       ├── IndentationSelector
│       ├── AttributePrefixInput
│       ├── ToggleGroup            (comments, declarations, type inference, always-array)
│       └── AutoConvertToggle
```

### 5.4 Data Flow

```
User types/pastes input
        │
        ▼
EditorPanel (input) ──onChange──▶ useAutoDetect()
        │                              │
        │                     detectedFormat
        │                              │
        ▼                              ▼
useConversion(input, format, settings)
        │
        ├─ input < 500 KB ──▶ converter.ts (main thread)
        │
        └─ input ≥ 500 KB ──▶ converter.worker.ts (Web Worker)
                                       │
                                       ▼
                              { result, error }
                                       │
                         ┌─────────────┴──────────────┐
                         ▼                            ▼
                  EditorPanel (output)          StatusBar (errors)
```

### 5.5 Conversion Engine Wrapper

`lib/converter.ts` encapsulates all `fast-xml-parser` configuration:

```typescript
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

interface ConversionOptions {
  attributePrefix: string;       // default "@_"
  textNodeName: string;          // default "#text"
  preserveComments: boolean;
  preserveDeclaration: boolean;
  inferTypes: boolean;
  alwaysArray: boolean;
  indentation: string;           // "  ", "    ", or "\t"
}

function xmlToJson(xml: string, options: ConversionOptions): string;
function jsonToXml(json: string, options: ConversionOptions): string;
```

### 5.6 Web Worker Strategy

For inputs exceeding 500 KB, conversion offloads to a Web Worker to keep the UI responsive.

- The worker imports `fast-xml-parser` and exposes `xmlToJson` / `jsonToXml`.
- Communication uses `postMessage` with structured clone (input string + options in, result string or error out).
- The `useConversion` hook manages the worker lifecycle: spawns on first large input, reuses across conversions, terminates on unmount.
- A loading spinner overlays the output panel while the worker processes.

### 5.7 CodeMirror Integration

Each `EditorPanel` instance manages a CodeMirror `EditorView`:

- **Language extension** swapped dynamically based on detected/selected format (`@codemirror/lang-json` or `@codemirror/lang-xml`).
- **Diagnostics** pushed via CodeMirror's `linter` extension — parse errors from `validator.ts` mapped to `{from, to, severity, message}`.
- **Theme** applied via CSS variables to match the application theme (light/dark).
- **Read-only** flag set on the output panel; optionally editable for manual tweaks.
- **Lazy-loaded** via `React.lazy()` + `Suspense` to keep initial bundle small.

### 5.8 Auto-Detection Logic

`useAutoDetect(input: string): "json" | "xml" | "unknown"`

1. Trim whitespace.
2. If starts with `{` or `[` → JSON.
3. If starts with `<` → XML.
4. Otherwise → unknown (show prompt to user to select manually).

This is a fast heuristic. Full validation happens during conversion.

## 6. UI / UX Design

### 6.1 Layout

- **Desktop (>1024px):** Horizontal split — input left, output right, 50/50 default with draggable divider.
- **Tablet (768–1024px):** Same horizontal split, narrower panels.
- **Mobile (<768px):** Vertical stack — input on top, output below, with tab toggle to switch between full-screen views.

### 6.2 Theme

- Support light and dark modes via CSS custom properties.
- Respect `prefers-color-scheme` system preference with manual override.
- Persist theme choice to `localStorage`.

### 6.3 Interactions

| Action | Behavior |
|--------|----------|
| Type in input | Auto-convert after 300ms debounce (if enabled), or wait for button click |
| Click direction toggle | Swap input/output content and re-convert |
| Click "Beautify" | Re-format current output with configured indentation |
| Click "Minify" | Strip whitespace from current output |
| Click "Copy" | Copy output to clipboard, show brief confirmation toast |
| Click "Download" | Browser download with appropriate filename and extension |
| Drag file onto input | Read file, populate input editor, trigger conversion |
| Parse error occurs | Red underline at error location in input, error message in status bar |

### 6.4 Error States

| State | Display |
|-------|---------|
| Empty input | Output panel shows placeholder text: "Paste or type JSON/XML to convert" |
| Invalid JSON | Status bar: red error with message and line:col. Input editor: red squiggly at error position |
| Invalid XML | Same as above, using fast-xml-parser's validation error |
| File too large (>10 MB) | Toast warning, input rejected |
| Unknown format | Status bar: amber warning, prompt to select format manually |

## 7. Dependencies to Add

| Package | Version | Purpose | Size (gzipped) |
|---------|---------|---------|----------------|
| `fast-xml-parser` | ^5.x | JSON↔XML conversion and validation | ~45 KB |
| `@codemirror/view` | ^6.x | Editor view layer | ~45 KB |
| `@codemirror/state` | ^6.x | Editor state management | ~20 KB |
| `@codemirror/lang-json` | ^6.x | JSON syntax + validation | ~5 KB |
| `@codemirror/lang-xml` | ^6.x | XML syntax highlighting | ~5 KB |
| `@codemirror/language` | ^6.x | Language infrastructure | ~15 KB |
| `@codemirror/commands` | ^6.x | Keybindings (copy, select all, etc.) | ~10 KB |
| `@codemirror/search` | ^6.x | Find/replace in editor | ~10 KB |
| `codemirror` | ^6.x | Convenience bundle (basic setup) | — (re-exports) |

**Estimated total added bundle:** ~155 KB gzipped (before tree-shaking and code splitting).

## 8. Performance Budget

| Metric | Target |
|--------|--------|
| Initial JS bundle (gzipped) | < 300 KB |
| Largest Contentful Paint | < 1.5 s |
| Conversion (1 MB input, main thread) | < 500 ms |
| Conversion (1 MB input, Web Worker) | < 800 ms (includes message overhead) |
| Debounce delay (auto-convert) | 300 ms |
| Editor input latency | < 16 ms (60fps) |

### Optimization strategies

- Lazy-load CodeMirror and fast-xml-parser via dynamic `import()` — they are not needed until the user interacts.
- Use Vite's automatic code splitting for lazy routes/components.
- Web Worker for inputs > 500 KB.
- Debounce conversion on keystroke to avoid redundant work.

## 9. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | `converter.ts`, `formatter.ts`, `validator.ts` — pure functions, edge cases for all structural mismatches in §4 |
| Component | Vitest + React Testing Library | `EditorPanel`, `Toolbar`, `SettingsDrawer` — user interactions, state changes |
| Integration | Vitest | Full conversion flow: input → useConversion → output, including error paths |
| E2E | Playwright | Critical paths: paste JSON → get XML, paste XML → get JSON, drag-drop file, copy output, settings persistence |

### Key test cases for conversion

- Empty input
- Minimal valid JSON (`{}`, `[]`, `"string"`, `123`)
- Minimal valid XML (`<root/>`, `<root></root>`)
- Attributes, nested elements, arrays, mixed content
- CDATA sections
- XML namespaces
- Deeply nested structures (>100 levels)
- Large input (1 MB+) — timing assertion
- Malformed JSON (missing bracket, trailing comma)
- Malformed XML (unclosed tag, invalid character)
- Round-trip fidelity: JSON → XML → JSON should equal original for supported structures

## 10. Deployment

Static files only. Build output (`dist/`) can be served from any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, GitHub Pages).

```bash
cd JsonToXML
npm run build    # outputs to dist/
```

No environment variables, no server, no API keys.
