# Dev Tools Platform — Full Spec & Implementation Plan

> **Date**: 2025-03-25
> **Scope**: Expand the existing JsonToXML converter into a multi-app developer utilities platform, with each tool living on its own subdomain.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Refactoring Plan — Extracting the Shared Layer](#3-refactoring-plan--extracting-the-shared-layer)
4. [New App Specifications](#4-new-app-specifications)
5. [Subdomain & Routing Strategy](#5-subdomain--routing-strategy)
6. [Design System Evolution](#6-design-system-evolution)
7. [Style & Code Quality Recommendations](#7-style--code-quality-recommendations)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [File Tree — Final State](#9-file-tree--final-state)

---

## 1. Current State Analysis

### 1.1 What's Good

| Area | Details |
|------|---------|
| **TypeScript** | Strict mode, `noUnusedLocals`, `erasableSyntaxOnly` — zero implicit any |
| **React patterns** | Hooks, Context, `useSyncExternalStore` for pending state, React Compiler enabled |
| **Testing** | 201 tests across 7 files, strong edge-case coverage for conversion logic |
| **CSS design system** | CSS custom properties, dark-first theming, native nesting — no preprocessor needed |
| **Mobile** | Responsive breakpoints, swipe gestures, safe-area insets, touch targets |
| **Performance** | 300 ms debounced auto-convert, CodeMirror compartments for non-destructive reconfig |
| **Accessibility** | Focus-visible outlines, ARIA labels, semantic HTML, 44 px touch targets |

### 1.2 What Needs Attention

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **App.tsx is 434 lines** | Hard to scan; mixes layout, handlers, keyboard shortcuts, animation logic | Extract handlers into `useAppActions` hook; extract keyboard shortcut registration into `useKeyboardShortcuts` |
| **EditorPanel.tsx is 338 lines** | Two full highlight style definitions + theme observer + linting + drag-drop in one file | Extract highlight styles to `lib/editorThemes.ts`, drag-drop to `hooks/useFileDrop.ts`, linting config to `lib/editorLinting.ts` |
| **Duplicate error extraction** | `converter.ts` and `validator.ts` both parse JSON position strings into line/column | Extract `extractJsonErrorPosition(error: unknown): { line?: number; column?: number }` into `lib/errorUtils.ts` |
| **No shared infrastructure** | Everything is one monolithic app — nothing is reusable across future tools | Restructure into a monorepo with shared packages (see Section 3) |
| **index.css is 1104 lines** | Single file for the entire design system + component styles + responsive rules | Split into layers: `tokens.css`, `reset.css`, `components.css`, `layout.css`, `responsive.css` |
| **No E2E tests** | Only unit tests; no integration coverage of the full convert-and-display flow | Add Playwright for critical user flows |
| **localStorage keys are app-specific** | `jsontoxml-settings`, `jsontoxml-panel-offset` — fine for one app, but needs a convention for multi-app | Namespace as `devtools:<app>:<key>` (e.g., `devtools:jsonxml:settings`) |
| **Settings type coupling** | `AppSettings extends ConversionOptions` — conversion options are JsonToXML-specific but AppSettings (theme, autoConvert) are generic | Separate `BaseAppSettings` (theme, autoConvert) from tool-specific options |
| **No routing** | Single-page app with no router — fine today, but the platform will need it | Add `react-router` for cross-tool navigation (landing page, shared header) |
| **Brand is tool-specific** | "JsonToXML" brand icon is baked into Toolbar.tsx | Extract brand into a shared `<AppHeader>` with per-tool name/icon |
| **No SEO or meta** | Single `index.html` with minimal meta tags | Each subdomain/tool needs its own `<title>`, `<meta description>`, OpenGraph tags |

### 1.3 Codebase Metrics

| Metric | Value |
|--------|-------|
| Source code (excl. tests) | ~2,593 lines |
| Test code | ~1,327 lines |
| Test count | 201 |
| Components | 7 (`App`, `EditorPanel`, `Toolbar`, `StatusBar`, `SettingsDrawer`, `ErrorBanner`, `EmptyState`, `ShortcutsModal`) |
| Hooks | 5 (`useSettings`, `useAutoDetect`, `useConversion`, `usePanelResize`, `useSwipe`) |
| Library modules | 3 (`converter`, `formatter`, `validator`) |
| Dependencies | React 19, fast-xml-parser, CodeMirror 6, Vite 8, Vitest, TypeScript 5.9 |

---

## 2. Target Architecture

### 2.1 Vision

A suite of client-side developer utilities under a shared brand (e.g., **DevKit** or **ToolForge**), each accessible at its own subdomain:

| Tool | Subdomain | Status |
|------|-----------|--------|
| JSON ↔ XML Converter | `jsonxml.devkit.tools` | Existing — refactor |
| JSON ↔ CSV Converter | `jsoncsv.devkit.tools` | New |
| JWT Decoder/Inspector | `jwt.devkit.tools` | New |
| *(future)* Base64 Encode/Decode | `base64.devkit.tools` | Planned |
| *(future)* URL Encoder/Decoder | `url.devkit.tools` | Planned |
| *(future)* Hash Generator | `hash.devkit.tools` | Planned |
| Landing / Hub | `devkit.tools` | New |

All tools are **fully client-side** — zero backend, zero data leaves the browser.

### 2.2 Monorepo Structure

Use **npm workspaces** (no Turborepo or Nx needed at this scale) with Vite's library mode for the shared package:

```
devkit/                             # Repo root
├── package.json                    # Workspaces config
├── tsconfig.base.json              # Shared TS settings
├── eslint.config.js                # Shared ESLint (one flat config)
├── vitest.workspace.ts             # Vitest workspace config
├── packages/
│   └── shared/                     # @devkit/shared
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts            # Public API barrel
│       │   ├── types/
│       │   │   └── settings.ts     # BaseAppSettings, BaseConversionResult, etc.
│       │   ├── lib/
│       │   │   ├── errorUtils.ts   # Error position extraction
│       │   │   ├── formatter.ts    # prettifyJson, minifyJson (generic)
│       │   │   └── storage.ts      # Namespaced localStorage helpers
│       │   ├── hooks/
│       │   │   ├── useSettings.ts  # Generic settings with BaseAppSettings
│       │   │   ├── usePanelResize.ts
│       │   │   ├── useSwipe.ts
│       │   │   ├── useFileDrop.ts
│       │   │   └── useKeyboardShortcuts.ts
│       │   ├── components/
│       │   │   ├── AppShell.tsx     # Header + footer + content slot
│       │   │   ├── EditorPanel.tsx  # CodeMirror wrapper (reusable)
│       │   │   ├── StatusBar.tsx
│       │   │   ├── ErrorBanner.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── SettingsDrawer.tsx  # Generic (accepts settings schema)
│       │   │   ├── ShortcutsModal.tsx
│       │   │   └── ToolNav.tsx     # Cross-tool navigation strip
│       │   └── styles/
│       │       ├── tokens.css      # Color, spacing, typography tokens
│       │       ├── reset.css       # Normalize + base styles
│       │       ├── components.css  # Buttons, toggles, badges, modals
│       │       ├── editor.css      # CodeMirror theme overrides
│       │       ├── layout.css      # AppShell, panels, dividers
│       │       └── responsive.css  # Breakpoints, mobile tabs, safe areas
│       └── __tests__/
│           └── ...                 # Tests for shared utilities
├── apps/
│   ├── jsonxml/                    # Existing app (refactored)
│   │   ├── package.json            # Depends on @devkit/shared
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json           # Extends ../../tsconfig.base.json
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx             # Slim: wires shared shell + tool-specific logic
│   │   │   ├── app.css             # Tool-specific overrides only
│   │   │   ├── types/
│   │   │   │   └── conversion.ts   # JsonXmlOptions extends ConversionOptions
│   │   │   ├── lib/
│   │   │   │   ├── converter.ts    # xmlToJson, jsonToXml
│   │   │   │   ├── xmlFormatter.ts # prettifyXml, minifyXml
│   │   │   │   └── validator.ts    # validateXml
│   │   │   ├── hooks/
│   │   │   │   ├── useConversion.ts
│   │   │   │   └── useAutoDetect.ts
│   │   │   └── components/
│   │   │       └── Toolbar.tsx     # Tool-specific actions (direction toggle)
│   │   └── __tests__/
│   │       └── ...                 # Existing 201 tests (adapted)
│   ├── jsoncsv/                    # New app
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── types/
│   │       │   └── conversion.ts
│   │       ├── lib/
│   │       │   ├── converter.ts    # jsonToCsv, csvToJson
│   │       │   ├── csvParser.ts    # RFC 4180 compliant parser
│   │       │   └── validator.ts    # validateCsv, validateJson
│   │       ├── hooks/
│   │       │   ├── useConversion.ts
│   │       │   └── useAutoDetect.ts
│   │       └── components/
│   │           ├── Toolbar.tsx
│   │           ├── CsvPreview.tsx   # Table preview of CSV data
│   │           └── ColumnMapper.tsx # Map JSON keys to CSV columns
│   ├── jwt/                        # New app
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── types/
│   │       │   └── jwt.ts
│   │       ├── lib/
│   │       │   ├── decoder.ts      # Base64url decode, parse header/payload
│   │       │   ├── validator.ts    # Expiry, structure, claim checks
│   │       │   └── formatter.ts    # Pretty-print decoded sections
│   │       ├── hooks/
│   │       │   └── useJwtDecode.ts
│   │       └── components/
│   │           ├── Toolbar.tsx
│   │           ├── TokenInput.tsx   # Single editor for JWT string
│   │           ├── DecodedView.tsx  # Header | Payload | Signature panels
│   │           ├── ClaimInspector.tsx # Expiry countdown, issuer info
│   │           └── SignatureStatus.tsx # Valid/invalid/unverified badge
│   └── hub/                        # Landing page
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           └── App.tsx             # Grid of tool cards linking to subdomains
```

### 2.3 Dependency Graph

```
@devkit/shared (0 app-specific deps)
    ↑
    ├── apps/jsonxml   (fast-xml-parser)
    ├── apps/jsoncsv   (papaparse or custom)
    ├── apps/jwt       (no external deps — pure JS base64)
    └── apps/hub       (no extra deps)
```

Each app is independently buildable and deployable.

---

## 3. Refactoring Plan — Extracting the Shared Layer

### Phase 1: Prepare the monorepo skeleton

1. Create `devkit/` as the new repo root (or restructure in-place).
2. Add root `package.json` with `"workspaces": ["packages/*", "apps/*"]`.
3. Create `tsconfig.base.json` with shared compiler options.
4. Move the shared ESLint flat config to the root.

### Phase 2: Extract `@devkit/shared`

Move these items from the current `JsonToXML/src/` into `packages/shared/src/`:

| Current location | New location | Changes needed |
|-----------------|--------------|----------------|
| `types/settings.ts` | `types/settings.ts` | Remove `ConversionOptions` (app-specific). Keep `BaseAppSettings { theme, autoConvert }`, `ConversionResult`, `ConversionError`. Add generics: `AppSettings<TOptions>`. |
| `lib/formatter.ts` → JSON functions only | `lib/formatter.ts` | Keep `prettifyJson`, `minifyJson`. XML formatting stays in `apps/jsonxml`. |
| `lib/validator.ts` → JSON validation only | `lib/validator.ts` | Keep `validateJson`. XML validation stays in `apps/jsonxml`. |
| Error position extraction (from converter + validator) | `lib/errorUtils.ts` | New shared util. |
| `hooks/useSettings.ts` | `hooks/useSettings.ts` | Generalize: `useSettings<T extends BaseAppSettings>(key: string, defaults: T)`. |
| `hooks/usePanelResize.ts` | `hooks/usePanelResize.ts` | Parameterize localStorage key. |
| `hooks/useSwipe.ts` | `hooks/useSwipe.ts` | No changes. |
| `components/EditorPanel.tsx` | `components/EditorPanel.tsx` | Extract highlight themes to `lib/editorThemes.ts`. Remove drag-drop (move to `hooks/useFileDrop.ts`). Accept `lintSource` as prop instead of building it internally. |
| `components/StatusBar.tsx` | `components/StatusBar.tsx` | Generalize slot content via children/render props. |
| `components/ErrorBanner.tsx` | `components/ErrorBanner.tsx` | No changes. |
| `components/EmptyState.tsx` | `components/EmptyState.tsx` | Accept `icon`, `title`, `hints`, `actions` as props. |
| `components/SettingsDrawer.tsx` | `components/SettingsDrawer.tsx` | Accept a `sections` prop (array of setting descriptors) instead of hardcoded fields. Render dynamically. |
| `components/ShortcutsModal.tsx` | `components/ShortcutsModal.tsx` | Accept `shortcuts` as prop (array of `{ keys, description }`). |
| `index.css` (design system) | `styles/*.css` (split into layers) | See Section 6. |

### Phase 3: Slim down `apps/jsonxml`

After extraction, `apps/jsonxml` retains only:

- `lib/converter.ts` (fast-xml-parser wrapper — unchanged)
- `lib/xmlFormatter.ts` (prettifyXml, minifyXml — renamed from formatter.ts XML portion)
- `lib/validator.ts` → `validateXml` only
- `hooks/useConversion.ts` (debounced conversion orchestration — tool-specific)
- `hooks/useAutoDetect.ts` (JSON vs XML heuristic — tool-specific)
- `components/Toolbar.tsx` (direction toggle, format badges — tool-specific)
- `types/conversion.ts` (JsonXmlConversionOptions, JsonXmlDirection)
- `App.tsx` — now ~150 lines, wrapping `<AppShell>` with tool-specific panels
- All existing tests (adapted for new import paths)

### Phase 4: Verify

- All 201 existing tests still pass.
- `npm run build` produces a working `apps/jsonxml` bundle.
- Design system looks identical before and after.

---

## 4. New App Specifications

### 4.1 JSON ↔ CSV Converter (`apps/jsoncsv`)

#### Core Features

| Feature | Details |
|---------|---------|
| **JSON → CSV** | Flatten nested JSON objects into tabular CSV. Handle arrays of objects (each object = row). Configurable delimiter (comma, semicolon, tab, pipe). Optional header row. |
| **CSV → JSON** | Parse CSV with configurable delimiter/quote char. Produce array of objects (header = keys). Optional type inference (string → number/boolean). |
| **Auto-detect** | First char `{`/`[` → JSON, otherwise assume CSV. |
| **Nested key handling** | Flatten with dot notation (`user.name.first`) or bracket notation (`user[name][first]`). Configurable max depth. |
| **Preview table** | Below the output editor, show a scrollable HTML table preview of the CSV data (max 100 rows). |
| **Column mapper** | UI to reorder, rename, include/exclude JSON keys before conversion. |
| **Array handling** | JSON arrays of primitives → single column. Arrays of objects → expanded rows. |
| **Large files** | Stream processing for files > 1 MB. Web Worker for parsing to keep UI responsive. |
| **Download** | `.csv` or `.json` with correct MIME type. |

#### Conversion Options (Settings Drawer)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiter` | `','` \| `';'` \| `'\t'` \| `'\|'` | `','` | CSV field separator |
| `quoteChar` | `'"'` \| `"'"` | `'"'` | Character used to quote fields |
| `header` | `boolean` | `true` | Include/use header row |
| `flattenStyle` | `'dot'` \| `'bracket'` | `'dot'` | How to flatten nested keys |
| `maxFlattenDepth` | `number` | `10` | Max nesting levels to flatten |
| `inferTypes` | `boolean` | `false` | Parse "123" as number in CSV→JSON |
| `nullValue` | `string` | `''` | What empty CSV cells become in JSON |
| `arrayHandling` | `'expand'` \| `'stringify'` | `'expand'` | How to handle JSON arrays |

#### Edge Cases

- **Inconsistent objects**: JSON array where objects have different keys → union of all keys, missing values become `nullValue`.
- **Nested arrays**: `[{a: [1,2,3]}]` → expand to 3 rows (with `arrayHandling: 'expand'`) or stringify as `"[1,2,3]"`.
- **Special chars in values**: Commas, newlines, quotes inside values → properly escaped per RFC 4180.
- **BOM**: Detect and strip UTF-8 BOM (`\uFEFF`) from CSV input.
- **Empty input**: Show empty state with sample data button.
- **Single value**: `"hello"` → single-cell CSV.

#### Library Approach

**Option A — PapaParse**: Battle-tested, handles streaming, RFC 4180 compliant. ~30 KB gzipped. Handles edge cases (BOM, line endings, quoted fields) out of the box.

**Option B — Custom parser**: Smaller bundle, full control. More work. Risk of RFC compliance gaps.

**Recommendation**: Use **PapaParse** for CSV parsing (it's the industry standard) and write a custom JSON→CSV flattener since that's the novel logic.

#### Test Plan

| Category | Tests |
|----------|-------|
| JSON→CSV basics | Flat object, array of objects, nested objects, primitives |
| Delimiter options | Comma, semicolon, tab, pipe |
| Flatten styles | Dot notation, bracket notation, max depth |
| Array handling | Expand vs stringify, mixed arrays |
| CSV→JSON basics | Simple CSV, with headers, without headers |
| Type inference | Numbers, booleans, nulls from CSV strings |
| Special characters | Commas in values, newlines, quotes, unicode |
| Edge cases | Empty input, BOM, inconsistent objects, single value |
| Round-trip | JSON→CSV→JSON, CSV→JSON→CSV |
| Large files | Performance with 10k rows |

**Target: ~80 tests.**

---

### 4.2 JWT Decoder/Inspector (`apps/jwt`)

#### Core Features

| Feature | Details |
|---------|---------|
| **Decode** | Split JWT into header, payload, signature. Base64url-decode header and payload. Display as pretty-printed JSON. |
| **Color-coded input** | The JWT input uses 3 colors for the 3 parts (header = red, payload = purple, signature = cyan) — similar to jwt.io. |
| **Claim inspection** | Parse standard claims: `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`. Show human-readable values (timestamps → dates). |
| **Expiry status** | Real-time countdown: "Expires in 2h 14m" or "Expired 3 days ago". Color-coded (green/yellow/red). |
| **Structure validation** | Check: 3 parts separated by dots, valid base64url, valid JSON in header/payload. Show clear error if not. |
| **Algorithm display** | Show `alg` from header (RS256, HS256, ES256, etc.) with description. Warn on `none` algorithm. |
| **Signature status** | Cannot verify server-side signatures client-side (no secret). Show "Unverified" with explanation. For HMAC (HS256), offer optional secret input to verify. |
| **Copy sections** | Copy individual sections (header JSON, payload JSON, full token). |
| **Share via URL** | Encode token in URL hash (`#token=eyJ...`) for sharing. Warning: tokens may contain sensitive data. |
| **Sample tokens** | Pre-built sample JWTs for demonstration. |

#### Layout

Unlike the two-panel converter layout, the JWT tool has a **single-input, multi-output** layout:

```
┌─────────────────────────────────────────────────┐
│  [JWT Decoder]        [Paste]  [Sample]  [⚙]   │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │  eyJhbGciOi...  (color-coded, single line   ││
│  │  or wrapped input)                          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │   HEADER     │ │   PAYLOAD    │ │ SIGNATURE││
│  │   (JSON)     │ │   (JSON)     │ │ (hex/b64)││
│  │              │ │              │ │          ││
│  │  alg: RS256  │ │  sub: "123"  │ │ Status:  ││
│  │  typ: JWT    │ │  exp: ...    │ │ Unverif. ││
│  └──────────────┘ └──────────────┘ └──────────┘│
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │  CLAIMS INSPECTOR                           ││
│  │  Issued:    2025-03-20 10:30 UTC            ││
│  │  Expires:   2025-03-25 10:30 UTC (in 5h)   ││
│  │  Issuer:    auth.example.com                ││
│  │  Subject:   user-123                        ││
│  │  Audience:  api.example.com                 ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  ✓ Valid structure  │  RS256  │  552 bytes      │
└─────────────────────────────────────────────────┘
```

#### Library Approach

**Zero dependencies**. JWT decoding is simple:

```typescript
function decodeJwt(token: string) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  return { header, payload, signature: signatureB64 };
}
```

For optional HMAC verification, use the Web Crypto API (`crypto.subtle.verify`).

#### Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoDecodeOnPaste` | `boolean` | `true` | Decode immediately when pasting |
| `showRawBase64` | `boolean` | `false` | Show raw base64 alongside decoded JSON |
| `timestampFormat` | `'relative'` \| `'absolute'` \| `'both'` | `'both'` | How to display timestamps |
| `warnOnNoneAlg` | `boolean` | `true` | Highlight `alg: "none"` as security risk |
| `shareViaHash` | `boolean` | `false` | Auto-update URL hash with token |

#### Edge Cases

- **Not a JWT**: No dots, or not 3 parts → clear error with format guide.
- **Invalid base64url**: Corrupted characters → show which part failed.
- **Invalid JSON**: Valid base64 but decoded string isn't JSON → show raw decoded string.
- **Expired token**: `exp` in the past → red "Expired" badge with time since expiry.
- **No exp claim**: Some tokens don't expire → show "No expiry" info.
- **Huge payload**: Some tokens have large payloads (e.g., permissions) → handle gracefully.
- **Nested JWT**: A claim value that is itself a JWT → detect and offer to decode recursively.
- **JWS vs JWE**: This tool handles JWS (signed). JWE (encrypted) has 5 parts → detect and inform user.

#### Test Plan

| Category | Tests |
|----------|-------|
| Decoding basics | Valid JWT, each section correctly parsed |
| Base64url | Padding variations, URL-safe characters |
| Claim parsing | All standard claims, missing claims, extra claims |
| Timestamp handling | Future (valid), past (expired), no exp, edge (now) |
| Error cases | Not a JWT, invalid base64, invalid JSON, empty |
| Algorithm detection | HS256, RS256, ES256, none (with warning) |
| Structure validation | 2 parts, 3 parts, 4+ parts, empty parts |
| URL hash | Encode/decode token from hash |
| HMAC verification | Correct secret, wrong secret, non-HMAC alg |

**Target: ~50 tests.**

---

## 5. Subdomain & Routing Strategy

### 5.1 Deployment Model

Each app builds to its own static bundle. Deployment options:

**Option A — Separate deployments (Recommended)**:
Each `apps/*` deploys independently to its subdomain. Simple, isolated, independent deploy cycles.

```
jsonxml.devkit.tools  →  apps/jsonxml/dist/
jsoncsv.devkit.tools  →  apps/jsoncsv/dist/
jwt.devkit.tools      →  apps/jwt/dist/
devkit.tools          →  apps/hub/dist/
```

Platform: **Cloudflare Pages** (free tier supports unlimited sites + custom domains) or **Vercel** (preview deploys per PR).

**Option B — Single deployment with subdomain routing**:
One build output, server/CDN routes subdomains to paths. More complex, tighter coupling.

**Recommendation: Option A** — independent builds. The shared package is a build-time dependency, not runtime. Each app ships its own optimized bundle.

### 5.2 Cross-Tool Navigation

Every app includes a `<ToolNav>` component (from `@devkit/shared`) — a thin strip at the top:

```
[ DevKit ]   JSON↔XML  |  JSON↔CSV  |  JWT Decoder  |  More ▾
```

- Current tool is highlighted.
- Links are `<a href="https://jsonxml.devkit.tools">` (full URLs, not SPA routes).
- "More ▾" dropdown for future tools.
- On mobile: hamburger menu or horizontal scroll.

### 5.3 Shared State Across Subdomains

Subdomains are different origins → no shared `localStorage`. Options:

- **Theme preference**: Each app stores its own. Use `prefers-color-scheme` as default so all apps feel consistent on first visit. Or use a shared cookie on `.devkit.tools` domain for theme sync.
- **No cross-tool data sharing needed**: Each tool is independent.

### 5.4 SEO & Meta

Each `index.html` gets tool-specific meta:

```html
<!-- jsonxml.devkit.tools -->
<title>JSON ↔ XML Converter — DevKit</title>
<meta name="description" content="Convert JSON to XML and XML to JSON instantly in your browser. Free, private, no data leaves your device.">
<meta property="og:title" content="JSON ↔ XML Converter — DevKit">
<meta property="og:description" content="...">
<meta property="og:image" content="/og-jsonxml.png">
```

---

## 6. Design System Evolution

### 6.1 CSS Split

The current 1104-line `index.css` becomes:

| File | Contents | ~Lines |
|------|----------|--------|
| `tokens.css` | CSS custom properties (colors, spacing, typography, shadows, radii) for both themes | ~120 |
| `reset.css` | `*, *::before, *::after { box-sizing: border-box; margin: 0 }`, base body/html styles, font stack | ~40 |
| `components.css` | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.badge`, `.toggle`, `.modal`, `.drawer` | ~250 |
| `editor.css` | CodeMirror overrides: `.cm-editor`, `.cm-gutters`, `.cm-activeLine`, syntax highlighting vars | ~150 |
| `layout.css` | `.app`, `.toolbar`, `.editor-container`, `.panel`, `.divider`, `.status-bar`, `.panel-header` | ~200 |
| `responsive.css` | `@media` queries, mobile tabs, safe areas, landscape overrides | ~200 |

Each app imports: `@devkit/shared/styles/tokens.css` + `reset.css` + `components.css` + `layout.css` + `responsive.css`, plus `editor.css` only if it uses CodeMirror.

### 6.2 Token Refinements

| Current | Proposed | Reason |
|---------|----------|--------|
| `--bg: #0c0d12` | `--color-bg-primary` | Semantic naming, avoid collisions |
| `--surface: #14161e` | `--color-bg-surface` | Clearer hierarchy |
| `--accent: #7c8cf5` | `--color-accent-default` | Support accent variants (hover, active, muted) |
| `--json-color` / `--xml-color` | `--color-format-a` / `--color-format-b` | Generic; each app maps its own format pair |
| `--radius-sm` | `--radius-sm: 6px` | Keep — already good |
| *(new)* | `--space-1` through `--space-8` | 4px scale (4, 8, 12, 16, 20, 24, 32, 48) for consistent spacing |
| *(new)* | `--font-mono`, `--font-sans` | Explicit font stack tokens |
| *(new)* | `--transition-fast: 0.15s ease` | Shared transition shorthand |
| *(new)* | `--z-dropdown: 100`, `--z-modal: 200`, `--z-toast: 300` | Z-index scale |

### 6.3 Shared Brand Elements

- **Logo**: A minimal SVG mark (wrench + bracket, or similar) that works at 16px (favicon) and 32px (nav).
- **Typography**: System font stack for UI, monospace for editors. Same as current.
- **Favicon**: Each tool gets a unique favicon variant (different accent color or icon overlay).

### 6.4 New Components Needed

| Component | Used By | Description |
|-----------|---------|-------------|
| `<ToolNav>` | All apps | Cross-tool navigation strip |
| `<AppShell>` | All apps | `<ToolNav>` + `<main>` + `<StatusBar>` layout wrapper |
| `<TablePreview>` | jsoncsv | Scrollable HTML table with sticky header, zebra stripes |
| `<TokenInput>` | jwt | Single-line or wrapped input with 3-color segmentation |
| `<DecodedView>` | jwt | Tabbed or triptych panel (header/payload/signature) |
| `<ClaimBadge>` | jwt | Pill badge for claim status (valid/expired/warning) |
| `<CountdownTimer>` | jwt | Live-updating relative time display |

---

## 7. Style & Code Quality Recommendations

### 7.1 Code Conventions to Adopt

| Convention | Current State | Recommendation |
|------------|---------------|----------------|
| **File naming** | PascalCase components, camelCase lib | Keep — consistent with React conventions |
| **Exports** | Named exports everywhere | Keep — tree-shakeable, explicit |
| **Hook return type** | Inferred | Add explicit return types to custom hooks for better DX |
| **Error types** | `ConversionError \| null` | Consider `Result<T, E>` pattern for converter returns |
| **Constants** | `SAMPLE_JSON` in App.tsx | Move to `lib/samples.ts` per app |
| **Magic numbers** | `300` (debounce), `100_000` (threshold), `1500` (copy feedback), `150` (swap animation) | Extract to named constants in a `constants.ts` file |
| **CSS class naming** | Flat BEM-ish (`.btn-primary`, `.panel-header`) | Keep — simple and works. No need for CSS modules at this scale. |

### 7.2 Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| **Unit** | Vitest | All `lib/` functions (converters, formatters, validators, decoders) |
| **Component** | Vitest + Testing Library | Shared components (EditorPanel, SettingsDrawer, etc.) |
| **Integration** | Playwright | Critical flows: paste input → see output, change settings → see effect, swap → direction flips |
| **Visual regression** | Playwright screenshots | Catch unintended CSS changes across themes |

### 7.3 Performance Budget

| Metric | Target | Current (jsonxml) |
|--------|--------|-------------------|
| First Contentful Paint | < 1.0s | ~0.8s (estimated) |
| JS bundle (gzipped) | < 100 KB per app | ~85 KB (CodeMirror is heavy) |
| CSS (gzipped) | < 10 KB | ~8 KB |
| Lighthouse Performance | > 95 | Not measured |

**CodeMirror note**: CodeMirror 6 is ~60 KB gzipped. The JWT app doesn't need full CodeMirror — a simple `<textarea>` with CSS coloring is sufficient. This saves ~60 KB for that tool.

### 7.4 Accessibility Improvements

| Current Gap | Fix |
|-------------|-----|
| No `aria-live` regions | Add `aria-live="polite"` to StatusBar for conversion results |
| No skip navigation | Add "Skip to editor" link (hidden until focused) |
| Color-only format indicators | Add text labels alongside color dots |
| No reduced-motion support | Add `@media (prefers-reduced-motion: reduce)` to disable animations |
| Keyboard trap in settings drawer | Ensure focus trap with Escape to close |

---

## 8. Implementation Roadmap

### Phase 1: Monorepo Setup & Shared Extraction (est. scope: medium)

**Goal**: Restructure into monorepo, extract shared package, existing app works identically.

1. Initialize monorepo structure (root `package.json`, workspaces).
2. Create `packages/shared` with extracted types, hooks, components, styles.
3. Refactor `apps/jsonxml` to import from `@devkit/shared`.
4. Split `index.css` into style layers.
5. Verify all 201 tests pass.
6. Verify visual parity (manual check in both themes).

**Exit criteria**: `npm run build` and `npm test` succeed from repo root. App looks and works identically.

### Phase 2: Shared Navigation & AppShell

**Goal**: Build the cross-tool navigation and app shell.

1. Build `<ToolNav>` component.
2. Build `<AppShell>` layout wrapper.
3. Integrate into `apps/jsonxml`.
4. Build `apps/hub` landing page (tool grid with descriptions).
5. Generalize `<SettingsDrawer>` to accept dynamic settings schema.
6. Generalize `<ShortcutsModal>` to accept shortcuts array.

**Exit criteria**: JsonToXML renders inside AppShell with working ToolNav. Hub page shows tool cards.

### Phase 3: JSON ↔ CSV Converter

**Goal**: Build and ship the JSON-CSV tool.

1. Create `apps/jsoncsv` scaffold.
2. Implement `csvToJson` and `jsonToCsv` in `lib/converter.ts`.
3. Implement CSV validator.
4. Build `<CsvPreview>` table component.
5. Build `<ColumnMapper>` UI.
6. Wire up `useConversion` hook (adapt pattern from jsonxml).
7. Build tool-specific Toolbar (delimiter selector, header toggle).
8. Write ~80 tests.
9. Mobile-optimize the table preview.

**Exit criteria**: Full bidirectional conversion with preview, all tests passing.

### Phase 4: JWT Decoder

**Goal**: Build and ship the JWT decoder tool.

1. Create `apps/jwt` scaffold.
2. Implement `decodeJwt` (pure JS, zero deps).
3. Implement claim parsing with timestamp handling.
4. Build `<TokenInput>` with 3-color segmentation.
5. Build `<DecodedView>` triptych layout.
6. Build `<ClaimInspector>` with live countdown.
7. Build signature status display.
8. Optional: HMAC verification via Web Crypto API.
9. URL hash encoding for sharing.
10. Write ~50 tests.

**Exit criteria**: Paste JWT → see decoded sections with claim inspection. All tests passing.

### Phase 5: Polish & Deploy

**Goal**: Production-ready deployment of all tools.

1. Add Playwright E2E tests for critical flows (all 3 tools).
2. Add `@media (prefers-reduced-motion)` support.
3. Add `aria-live` regions and skip-navigation links.
4. Add OpenGraph images and per-tool meta tags.
5. Performance audit (Lighthouse) — optimize if needed.
6. Configure Cloudflare Pages (or Vercel) for subdomain deployment.
7. Set up CI/CD (GitHub Actions): lint → test → build → deploy.
8. Add shared cookie for theme sync across subdomains.

**Exit criteria**: All tools live on subdomains, CI green, Lighthouse > 95.

---

## 9. File Tree — Final State

```
devkit/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + test + build
│       └── deploy.yml              # Deploy to Cloudflare/Vercel
├── package.json                    # { workspaces: ["packages/*", "apps/*"] }
├── tsconfig.base.json
├── eslint.config.js
├── vitest.workspace.ts
├── CLAUDE.md
├── README.md
│
├── packages/
│   └── shared/
│       ├── package.json            # { name: "@devkit/shared" }
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types/
│           │   └── settings.ts     # BaseAppSettings, ConversionResult, ConversionError
│           ├── lib/
│           │   ├── errorUtils.ts
│           │   ├── formatter.ts    # JSON prettify/minify
│           │   ├── storage.ts      # Namespaced localStorage
│           │   └── editorThemes.ts # Dark + light highlight styles
│           ├── hooks/
│           │   ├── useSettings.ts
│           │   ├── usePanelResize.ts
│           │   ├── useSwipe.ts
│           │   ├── useFileDrop.ts
│           │   └── useKeyboardShortcuts.ts
│           ├── components/
│           │   ├── AppShell.tsx
│           │   ├── ToolNav.tsx
│           │   ├── EditorPanel.tsx
│           │   ├── StatusBar.tsx
│           │   ├── ErrorBanner.tsx
│           │   ├── EmptyState.tsx
│           │   ├── SettingsDrawer.tsx
│           │   └── ShortcutsModal.tsx
│           └── styles/
│               ├── tokens.css
│               ├── reset.css
│               ├── components.css
│               ├── editor.css
│               ├── layout.css
│               └── responsive.css
│
├── apps/
│   ├── jsonxml/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx             # ~150 lines
│   │       ├── app.css
│   │       ├── types/conversion.ts
│   │       ├── lib/
│   │       │   ├── converter.ts
│   │       │   ├── xmlFormatter.ts
│   │       │   ├── validator.ts
│   │       │   └── samples.ts
│   │       ├── hooks/
│   │       │   ├── useConversion.ts
│   │       │   └── useAutoDetect.ts
│   │       ├── components/
│   │       │   └── Toolbar.tsx
│   │       └── __tests__/          # 201 tests
│   │
│   ├── jsoncsv/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── app.css
│   │       ├── types/conversion.ts
│   │       ├── lib/
│   │       │   ├── converter.ts    # jsonToCsv, csvToJson
│   │       │   ├── csvParser.ts    # RFC 4180 parser
│   │       │   ├── flattener.ts    # Nested JSON → flat keys
│   │       │   ├── validator.ts
│   │       │   └── samples.ts
│   │       ├── hooks/
│   │       │   ├── useConversion.ts
│   │       │   └── useAutoDetect.ts
│   │       ├── components/
│   │       │   ├── Toolbar.tsx
│   │       │   ├── CsvPreview.tsx
│   │       │   └── ColumnMapper.tsx
│   │       └── __tests__/          # ~80 tests
│   │
│   ├── jwt/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── app.css
│   │       ├── types/jwt.ts
│   │       ├── lib/
│   │       │   ├── decoder.ts
│   │       │   ├── claims.ts       # Standard claim parsing
│   │       │   ├── validator.ts
│   │       │   ├── hmac.ts         # Optional HMAC verify via Web Crypto
│   │       │   └── samples.ts
│   │       ├── hooks/
│   │       │   └── useJwtDecode.ts
│   │       ├── components/
│   │       │   ├── Toolbar.tsx
│   │       │   ├── TokenInput.tsx
│   │       │   ├── DecodedView.tsx
│   │       │   ├── ClaimInspector.tsx
│   │       │   └── SignatureStatus.tsx
│   │       └── __tests__/          # ~50 tests
│   │
│   └── hub/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx             # Tool grid + brand
│           └── app.css
```

---

## Appendix A: Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | npm workspaces | Simplest option at this scale; no extra tooling needed |
| CSS approach | CSS custom properties + native nesting | Already in use, zero build cost, good browser support |
| CSV library | PapaParse | Industry standard, handles RFC 4180 edge cases |
| JWT library | None (custom) | Decoding is trivial; avoids unnecessary dependency |
| Deployment | Independent static builds per subdomain | Decoupled deploy cycles, no routing complexity |
| Cross-tool nav | Full URL links (not SPA router) | Subdomains are different origins; SPA routing doesn't work across them |
| State sharing | Shared cookie for theme only | Minimal cross-origin state needed |
| CodeMirror for JWT | No — use styled textarea | JWT input is single-string; CodeMirror is overkill (saves ~60 KB) |

## Appendix B: Migration Checklist for Existing App

- [ ] All 201 tests pass after refactor
- [ ] No visual regression in dark theme
- [ ] No visual regression in light theme
- [ ] Mobile layout still functional (tabs, swipe, responsive)
- [ ] Settings persist correctly with new localStorage key scheme
- [ ] Keyboard shortcuts still work
- [ ] File drag-drop still works
- [ ] Copy/download still work
- [ ] Auto-convert still debounces at 300ms
- [ ] Panel resize still works with drag and double-click reset
- [ ] Theme transition animation still smooth
- [ ] Build output size within ±5% of current
