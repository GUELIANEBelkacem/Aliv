# Aliv Platform — Master Build Plan

This is the working document for transforming the current `JsonToXML` repo into the **Aliv** multi-app platform and shipping the **QR Code Generator** as the second app. All execution proceeds from this plan; deviations are fine but should be recorded back into this file.

**Source documents** (read alongside):
- `ALIV_PLATFORM.md` — platform vision, brand, decisions log
- `UTILITY_RESEARCH_REPORT.md` — market research that justified the QR + Hash picks
- `NEXT_STEPS.md` — high-level roadmap

---

## 0. Overview

### Goals
1. **Refactor** the existing JSON↔XML app into a pnpm monorepo (`apps/*` + `packages/ui`) without losing any tests, features, or behavior.
2. **Build a shared design system** (`@aliv/ui`) covering tokens, the `AppShell`, the `AppSwitcher`, the `Logo`, theme management, and reusable primitives.
3. **Re-skin** JSON↔XML to consume the shared shell and use its assigned indigo accent (`#7c8cf5`), without regressing the existing 201 tests.
4. **Ship a platform landing** (`apps/web`) at the apex domain that lists all apps.
5. **Ship the QR Code Generator** (`apps/qrcode`) with the full v1 feature set: all content types, gradients, logo embedding, PNG/SVG/clipboard export, and a marketing landing page.
6. Reach a test count of **≥ 350 passing unit tests** across the monorepo at the end of this plan.
7. **Real-browser end-to-end coverage** via Playwright (`packages/e2e`, ~25 specs spanning all three apps) so launch is gated on automated user-journey tests, not just unit tests + a manual checklist.

### Non-goals
- Hash generator (queued for after this plan completes)
- Final TLD / hosting decision (deferred per `ALIV_PLATFORM.md`)
- Any backend / API services
- Authentication, accounts, payments

### Acceptance criteria for the whole plan
- `pnpm install` at repo root succeeds.
- `pnpm -r build` at repo root builds all three apps and the shared package without errors.
- `pnpm -r test` runs all tests, ≥ 350 passing, 0 failing.
- `pnpm -r lint` reports zero errors.
- All four apps (json-xml, qrcode, web, plus the shared package) render with the unified `AppShell`, accent colors are visually distinct.
- App switcher in any app lists all three apps and opens each in a new tab.
- The leaf logo renders in each app's accent color.

---

## 1. Conventions

### Naming
- **Workspace package names**: `@aliv/ui`, `@aliv/json-xml`, `@aliv/qrcode`, `@aliv/web`.
- **App slugs** (used in subdomain + URLs + `app-registry.ts`): `json-xml`, `qrcode`, `web`, `hashgen` (future).
- **Subdomains**: `jsonxml.aliv.<tld>`, `qrcode.aliv.<tld>`, `hashgen.aliv.<tld>`. Apex `aliv.<tld>`.
- **Branch naming**: `phase/0.2-monorepo-skeleton`, `phase/q.3-color-controls`, etc.

### Commit conventions
- Conventional Commits (`feat(ui): add AppShell`, `chore(repo): pnpm workspace skeleton`, `test(qrcode): wifi builder coverage`).
- One commit per completed phase or sub-phase. Phases 0.x and Q.x in this plan map to commit boundaries.
- Every commit ends with the existing co-author trailer.

### Code style
- TypeScript strict mode, no implicit `any`.
- ESLint flat config inherited from root.
- React 19 + React Compiler stays on for all apps.
- No new comments unless documenting a non-obvious *why*. Self-naming first.
- CSS via native nesting + custom properties. No CSS-in-JS, no Tailwind, no preprocessor.

### Test strategy
- **Vitest + Testing Library**. Co-locate component tests next to components as `*.test.tsx`; pure-logic tests under `src/__tests__/`.
- Each phase has explicit test deliverables. Every PR-equivalent commit must keep the suite green.
- Aim for **behavior-driven** tests, not implementation tests. Test what the component renders + responds to, not internal state shape.
- Coverage target: ≥ 80% on `lib/`, `hooks/`, and all builder/validator code. Components: smoke + key interactions.

---

# Part A — Platform Refactor

## Phase 0.1 — Pre-flight

**Goal**: Establish a reproducible baseline before destructive moves.

**Steps**
1. Verify clean working tree: `git status` shows nothing pending.
2. Run baseline: `cd JsonToXML && npm install && npm run build && npm run lint && npm run test`. Record results in commit message body.
3. Confirm 201 tests pass.
4. Install pnpm globally if not present: `npm install -g pnpm` (or use the `corepack enable` path).
5. Create branch `phase/0.1-preflight`. Commit a single `BASELINE.md` capturing the test count, build size, and node/pnpm versions used.

**Acceptance**
- `BASELINE.md` exists at repo root with the recorded numbers.
- pnpm `--version` ≥ 9.

---

## Phase 0.2 — Monorepo skeleton

**Goal**: Convert root from a one-app repo to a pnpm workspace with the JSON↔XML app moved into `apps/json-xml/` *but otherwise unchanged*. Tests must still pass after the move.

**File deliverables**
- `package.json` (root) — workspace root, scripts orchestration.
- `pnpm-workspace.yaml` — declares `apps/*` and `packages/*`.
- `tsconfig.base.json` (root) — shared TypeScript compiler options inherited by all apps.
- `eslint.config.js` (root) — base ESLint flat config; apps extend.
- `apps/json-xml/` — moved contents of `JsonToXML/`.
- Updated `.gitignore` (already permissive enough but verify `apps/*/dist`, `apps/*/node_modules` covered).

**Steps**
1. Create branch `phase/0.2-monorepo-skeleton`.
2. Write root `package.json`:
   ```jsonc
   {
     "name": "aliv",
     "private": true,
     "version": "0.0.0",
     "packageManager": "pnpm@9.0.0",
     "scripts": {
       "dev": "pnpm --filter @aliv/json-xml dev",
       "dev:json": "pnpm --filter @aliv/json-xml dev",
       "dev:qr":   "pnpm --filter @aliv/qrcode dev",
       "dev:web":  "pnpm --filter @aliv/web dev",
       "build":    "pnpm -r build",
       "test":     "pnpm -r test",
       "lint":     "pnpm -r lint",
       "typecheck":"pnpm -r typecheck"
     }
   }
   ```
3. Write `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - apps/*
     - packages/*
   ```
4. Move directory: `mv JsonToXML apps/json-xml`. Delete `apps/json-xml/node_modules` and `apps/json-xml/package-lock.json`.
5. Edit `apps/json-xml/package.json`: rename to `@aliv/json-xml`, keep version, scripts unchanged for now.
6. Add `tsconfig.base.json` at root with the strict-mode baseline; have `apps/json-xml/tsconfig.app.json` extend it.
7. Run `pnpm install` at root. Resolve any peer-dep warnings.
8. Run `pnpm --filter @aliv/json-xml test` — must show 201 passing.
9. Run `pnpm --filter @aliv/json-xml build` — must succeed.
10. Commit.

**Tests to add**
- None new at this phase. Verifying the existing 201 still pass *is* the test.

**Risks**
- Path-relative imports break after the move. Mitigation: the move is a directory rename only; nothing inside changes.
- React Compiler babel plugin may complain about new resolver paths. Mitigation: inspect `vite.config.ts` and adjust roots if needed.

**Acceptance**
- `pnpm install` clean.
- `pnpm test` runs 201 tests, all green.
- `pnpm build` produces `apps/json-xml/dist/`.
- App still runs at `pnpm dev:json` with no visible change.

---

## Phase 0.3 — Logo SVG conversion + brand assets

**Goal**: Convert the PNG logo into a clean, single-color SVG that can be tinted per app via `currentColor`. Place in the source-of-truth location (`Design/`) and the project (`packages/ui/assets/`).

**Steps**
1. Open `C:\Users\moham\Desktop\projects\Design\logo_green.png`. Visually inspect the silhouette.
2. Path-trace the logo. Two viable approaches:
   - **Manual trace** in vector software (Illustrator / Figma / Inkscape) — preferred for clean curves.
   - **Automated trace** with `potrace` or `svg-trace` then hand-cleanup. Faster but rougher.
3. Output requirements:
   - ViewBox `0 0 1024 1024` (matches PNG aspect).
   - Single `<path>` (or one `<g>` of merged paths), `fill="currentColor"`.
   - No embedded styles, no extraneous metadata, no XML namespaces beyond `xmlns="http://www.w3.org/2000/svg"`.
   - Optimized via SVGO.
4. Write the SVG to:
   - `C:\Users\moham\Desktop\projects\Design\logo.svg` (master)
   - `packages/ui/assets/logo.svg` (in-repo, consumed by Logo component)
5. Generate a 32×32 favicon variant at `packages/ui/assets/favicon-base.svg` (same path, just smaller viewbox-fitted version if needed).
6. Commit on branch `phase/0.3-logo-svg`.

**Tests to add**
- `packages/ui/__tests__/logo.test.tsx` — once Logo component exists in 0.4, smoke-test that the SVG renders and that `currentColor` propagates from the parent's CSS color.

**Acceptance**
- `logo.svg` is < 4 KB.
- Visual fidelity to the PNG is acceptable (no leaf is missing, no stray points).
- The SVG renders correctly at 16px, 32px, 64px, and 256px without artifacts.
- Setting CSS `color: red` on a parent makes the leaf turn red (currentColor works).

---

## Phase 0.4 — `@aliv/ui` shared design system

**Goal**: Stand up the shared package that hosts tokens, the AppShell, the AppSwitcher, the Logo, theme management, and reusable primitives. Nothing yet consumes it; we validate via unit + component tests.

**File deliverables**
```
packages/ui/
├── package.json                       # name "@aliv/ui", "exports" map
├── tsconfig.json
├── src/
│   ├── index.ts                       # public exports
│   ├── tokens/
│   │   ├── tokens.css                 # all shared CSS custom properties
│   │   └── accents.css                # per-app accent declarations
│   ├── theme/
│   │   ├── theme-store.ts             # cookie/localStorage cross-subdomain sync
│   │   ├── useTheme.ts                # hook
│   │   └── ThemeToggle.tsx
│   ├── components/
│   │   ├── AppShell.tsx               # header + slots + drawer container
│   │   ├── AppSwitcher.tsx            # popover grid of apps
│   │   ├── Logo.tsx                   # inlined SVG, color via currentColor
│   │   ├── Button.tsx                 # extracted Button primitive
│   │   ├── IconButton.tsx
│   │   ├── Drawer.tsx                 # generic slide-out drawer
│   │   └── ShortcutsModal.tsx         # extracted from json-xml
│   ├── hooks/
│   │   ├── useShortcuts.ts            # composable keyboard-shortcut hook
│   │   ├── useCopyFeedback.ts         # extracted morph-to-checkmark feedback
│   │   └── useMediaQuery.ts
│   ├── registry/
│   │   ├── app-registry.ts            # source of truth: list of all Aliv apps
│   │   └── types.ts                   # AppDefinition type
│   └── assets/
│       ├── logo.svg
│       └── favicon-base.svg
└── __tests__/                         # cross-cutting tests; component tests co-located
```

**Steps**

### 0.4.a — Package scaffolding
1. Create `packages/ui/package.json`:
   ```jsonc
   {
     "name": "@aliv/ui",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts",
       "./tokens.css": "./src/tokens/tokens.css",
       "./accents.css": "./src/tokens/accents.css",
       "./assets/logo.svg": "./src/assets/logo.svg"
     },
     "scripts": {
       "test": "vitest run",
       "test:watch": "vitest",
       "lint": "eslint .",
       "typecheck": "tsc --noEmit"
     }
   }
   ```
2. Add `vitest.config.ts` configured for jsdom + Testing Library.
3. Add `peerDependencies`: `react`, `react-dom`.
4. Add devDeps: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `vitest`.

### 0.4.b — Tokens
1. `tokens.css` (shared chassis):
   ```css
   :root {
     /* Backgrounds */
     --bg: #0c0d12;
     --surface: #14161e;
     --surface-elevated: #1a1d27;
     --border: #2a2e3d;
     --border-subtle: #1f2230;

     /* Text */
     --text: #e9eaef;
     --text-muted: #9ea3b3;
     --text-faint: #5d6276;

     /* Status */
     --danger: #ef4444;
     --warning: #f59e0b;
     --success: #4ade80;

     /* Geometry */
     --radius-sm: 4px;
     --radius: 6px;
     --radius-lg: 10px;
     --space-1: 4px;
     --space-2: 8px;
     --space-3: 12px;
     --space-4: 16px;
     --space-6: 24px;
     --transition: 0.15s ease;

     /* Type */
     --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
     --font-mono: ui-monospace, "JetBrains Mono", "Fira Code", Consolas, monospace;
   }

   :root[data-theme="light"] {
     --bg: #fafbfc;
     --surface: #ffffff;
     /* …rest of light recalibration */
   }
   ```
2. `accents.css`:
   ```css
   :root[data-app="web"]      { --accent: #4ade80; }
   :root[data-app="json-xml"] { --accent: #7c8cf5; }
   :root[data-app="qrcode"]   { --accent: #22d3ee; }
   :root[data-app="hashgen"]  { --accent: #f59e0b; }

   :root {
     --accent-hover: color-mix(in oklch, var(--accent) 90%, white);
     --accent-muted: color-mix(in oklch, var(--accent) 40%, transparent);
     --accent-glow:  color-mix(in oklch, var(--accent) 50%, transparent);
   }
   ```
3. **Tests**:
   - `tokens.test.ts` — JSDOM mounts a `<style>` import + a probe `<div>`, asserts `getComputedStyle(...).getPropertyValue('--bg')` returns the expected value, and that switching `data-app` changes `--accent`.

### 0.4.c — App registry
1. `registry/types.ts`:
   ```ts
   export type AppId = 'web' | 'json-xml' | 'qrcode' | 'hashgen';

   export interface AppDefinition {
     id: AppId;
     name: string;          // "JSON ↔ XML"
     tagline: string;       // "Convert and validate"
     subdomain: string;     // "jsonxml"
     accent: string;        // "#7c8cf5"
     comingSoon?: boolean;
   }
   ```
2. `registry/app-registry.ts`:
   ```ts
   export const APPS: AppDefinition[] = [
     { id: 'web',      name: 'Aliv',         tagline: 'Privacy-first dev utilities', subdomain: '',        accent: '#4ade80' },
     { id: 'json-xml', name: 'JSON ↔ XML',   tagline: 'Convert and validate',         subdomain: 'jsonxml', accent: '#7c8cf5' },
     { id: 'qrcode',   name: 'QR Generator', tagline: 'Customizable QR codes',        subdomain: 'qrcode',  accent: '#22d3ee' },
     { id: 'hashgen',  name: 'Hash',         tagline: 'Multi-algorithm hasher',       subdomain: 'hashgen', accent: '#f59e0b', comingSoon: true },
   ];

   export function appUrl(app: AppDefinition, tld = 'aliv.local'): string {
     return app.subdomain ? `https://${app.subdomain}.${tld}` : `https://${tld}`;
   }
   ```
3. **Tests**: `app-registry.test.ts`
   - All ids unique
   - All accents are valid 7-char hex
   - `appUrl` returns correct shape for apex vs subdomain

### 0.4.d — Logo component
1. `Logo.tsx` — inlines the SVG via Vite's `?raw` import or as a JSX component, sets `fill="currentColor"`, accepts `size`, `title` props.
2. **Tests**: `logo.test.tsx`
   - Renders with `<svg>` element
   - `currentColor` inheritance works (set parent CSS, query computed fill)
   - Size prop applies width/height
   - `title` prop sets `<title>` for a11y

### 0.4.e — Theme store + useTheme
1. `theme-store.ts`: persists theme + language to a cookie scoped to the apex domain (`Domain=.aliv.<tld>`, `Path=/`, `SameSite=Lax`) when `window.location.hostname` ends with `.aliv.<tld>`. Falls back to `localStorage` in dev / when no cookie domain matches.
2. Exposes `getTheme()`, `setTheme(theme)`, `subscribe(listener)`.
3. `useTheme.ts`: React hook; re-renders on cookie/storage changes (uses a polling-fallback or `storage` event listener).
4. `ThemeToggle.tsx`: button that flips dark↔light, applies to `<html data-theme="…">`.
5. **Tests**: `theme-store.test.ts`
   - Set/get round-trip in localStorage path
   - Cookie path: mock `document.cookie`, set theme, assert correct cookie string written (with `Domain=`)
   - subscribe fires on change
   - `useTheme` returns updated value after `setTheme`

### 0.4.f — Drawer + IconButton + Button + ShortcutsModal
1. Extract these from `apps/json-xml/src/components/`. Generalize where they were tightly coupled.
2. `Button` accepts `variant: 'primary' | 'secondary' | 'ghost'` (already an established convention).
3. `Drawer` is generic: `open`, `onClose`, `side: 'right' | 'left'`, `children`.
4. `ShortcutsModal` accepts a `shortcuts: Shortcut[]` prop.
5. **Tests** (one file per component, co-located):
   - `Button.test.tsx`: each variant renders correct className, onClick fires, disabled prevents click.
   - `Drawer.test.tsx`: opens, closes on backdrop click, closes on Escape, focus trap (loose check), backdrop blur class applied.
   - `ShortcutsModal.test.tsx`: renders all provided shortcuts, modifier formatting (Ctrl on Windows, ⌘ on Mac).

### 0.4.g — useShortcuts hook
1. `useShortcuts.ts`: accepts an array of `{ keys: string, handler: () => void, scope?: string }`. Composes — multiple consumers register simultaneously. Supports modifier keys (Ctrl/Cmd, Shift, Alt). Skips when an input/textarea has focus unless `whenInInput` is true.
2. **Tests**: `useShortcuts.test.ts`
   - Single shortcut fires
   - Modifier-aware (Ctrl+Enter only fires with Ctrl)
   - Multiple consumers compose
   - Disabled when input focused (unless override)
   - Cleanup on unmount

### 0.4.h — AppShell
1. `AppShell.tsx`:
   ```tsx
   <AppShell appId="json-xml" settings={<JsonXmlSettings />} shortcuts={…}>
     {/* app content */}
   </AppShell>
   ```
2. Sets `<html data-app={appId} data-theme={theme}>` on mount.
3. Renders header: `[<Logo color="var(--accent)" /> <Wordmark>aliv</Wordmark> <Divider /> <AppName>{app.name}</AppName>] … [<ShortcutsButton/> <SettingsButton/> <AppSwitcherButton/> <ThemeToggle/>]`.
4. Slots: `children` for the app content; `settings` prop for the drawer body; `shortcuts` prop for the keyboard list.
5. Renders the `Drawer` (settings) and `ShortcutsModal` itself; apps don't manage that state.
6. Mobile responsive: header collapses below 600px (logo + app name + a single overflow menu).
7. **Tests**: `AppShell.test.tsx`
   - Renders correct app name from registry
   - Sets `data-app` on `<html>`
   - Settings button opens drawer, `Esc` closes
   - Theme toggle flips `data-theme`
   - App switcher button opens AppSwitcher

### 0.4.i — AppSwitcher
1. `AppSwitcher.tsx`: popover anchored to its trigger button. Grid of app tiles (3 columns on desktop, 2 on mobile). Each tile: leaf logo in app's accent + app name + tagline below on hover.
2. Each tile is `<a href={appUrl(app)} target="_blank" rel="noopener">`.
3. Current app is marked with a subtle outline.
4. Coming-soon apps render a "Soon" badge and `aria-disabled="true"`.
5. Keyboard nav: arrow keys move focus, Enter activates, Esc closes.
6. **Tests**: `AppSwitcher.test.tsx`
   - All apps from registry are rendered
   - Current app marked
   - Coming-soon apps have correct attribute and badge
   - Tile links have `target="_blank"` and proper href
   - Arrow-key navigation works
   - Esc closes

### 0.4.j — Public exports
1. `index.ts` re-exports the public surface:
   ```ts
   export { AppShell } from './components/AppShell';
   export { AppSwitcher } from './components/AppSwitcher';
   export { Logo } from './components/Logo';
   export { Button } from './components/Button';
   export { Drawer } from './components/Drawer';
   export { ShortcutsModal } from './components/ShortcutsModal';
   export { ThemeToggle } from './theme/ThemeToggle';
   export { useTheme } from './theme/useTheme';
   export { useShortcuts } from './hooks/useShortcuts';
   export { useCopyFeedback } from './hooks/useCopyFeedback';
   export { APPS, appUrl } from './registry/app-registry';
   export type { AppId, AppDefinition } from './registry/types';
   ```

**Test deliverables for this phase**: ~50 new tests across components, hooks, theme store, registry.

**Acceptance**
- `pnpm --filter @aliv/ui test` runs ≥ 50 tests, all green.
- `pnpm --filter @aliv/ui typecheck` clean.
- Storybook is **not** required at this stage; verification happens via component tests + integration in Phase 0.5.

---

## Phase 0.5 — Refactor JSON↔XML to consume `@aliv/ui`

**Goal**: Replace JSON↔XML's bespoke chrome with `AppShell` + shared primitives. Visual parity is the primary goal — the user shouldn't notice anything except the new app switcher button and the leaf logo.

**Steps**
1. Create branch `phase/0.5-json-xml-shell`.
2. In `apps/json-xml/package.json`, add `"@aliv/ui": "workspace:*"` as a dependency. Run `pnpm install`.
3. In `apps/json-xml/src/main.tsx`, import `@aliv/ui/tokens.css` and `@aliv/ui/accents.css` before the app's own CSS. Remove duplicated tokens from `apps/json-xml/src/index.css`.
4. Wrap the app body in `<AppShell appId="json-xml" settings={<SettingsDrawerBody/>} shortcuts={shortcutList}>…</AppShell>`.
5. Delete the bespoke `Toolbar` brand row (logo + app name moved into AppShell). Keep the second toolbar row (action buttons) as the app's own content.
6. Delete `apps/json-xml/src/components/ShortcutsModal.tsx` — use `@aliv/ui`'s.
7. Refactor `SettingsDrawer.tsx`: it now renders just the *contents* of the drawer; the drawer itself is owned by `AppShell`.
8. Replace bespoke `Button`s with `<Button variant="…">` from `@aliv/ui`.
9. Replace bespoke shortcut hook with `useShortcuts` from `@aliv/ui`.
10. Run all 201 tests. Fix any that break due to removed components (some tests may reference the old SettingsDrawer/Modal — adapt or move them to `@aliv/ui`).
11. Manual smoke: dark and light theme, mobile layout, every keyboard shortcut, settings persistence, conversion timing display.

**Tests to add / move**
- App-shell-integration test for json-xml: `app-shell-integration.test.tsx` mounts `<App/>`, asserts the leaf renders in indigo (computed style), the app name says "JSON ↔ XML", the app switcher opens with a click, conversion still works end-to-end (paste JSON → see XML).
- Move any tests that test extracted components into `@aliv/ui/__tests__/`.

**Acceptance**
- All 201 original tests still pass (some may relocate but their count holds).
- ≥ 5 new integration tests added for the AppShell-on-json-xml.
- Visual parity verified manually on the 5 critical surfaces: convert, swap, copy, settings, mobile tabs.
- Lighthouse score on the local dev preview ≥ 90 across the board (no regression from current).

---

## Phase 0.6 — Cross-app theme sync

**Goal**: Ensure that switching theme in one app persists when navigating to another Aliv subdomain. Per the decision log, this uses a cookie scoped to the apex domain, not an iframe broker. Simpler and good enough for theme + language.

**Steps**
1. The implementation already lives in `theme-store.ts` from 0.4.e. This phase **validates** it end-to-end.
2. Add `apps/json-xml/src/__tests__/theme-sync.test.ts`: mock `document.cookie`, mock `window.location.hostname = 'jsonxml.aliv.local'`, call `setTheme('light')`, assert cookie string has `Domain=.aliv.local`, `SameSite=Lax`.
3. Document in `ALIV_PLATFORM.md` that for local dev across subdomains we use `*.aliv.local` mapped via `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts`) so cookies span subdomains. Add a `docs/local-subdomains.md` with setup steps.
4. Optional later: a tiny iframe-based broker if cookie SameSite proves insufficient. Track as a deferred item.

**Acceptance**
- Cookie path tested.
- Cross-subdomain sync **assumed** working (cannot verify in dev without DNS); this is acceptable until Phase 1 deploy.

---

## Phase 0.7 — Platform landing (`apps/web`)

**Goal**: Ship `aliv.<tld>` as a polished landing page that lists all apps and reuses `AppShell`.

**File deliverables**
```
apps/web/
├── package.json            # @aliv/web
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx             # uses AppShell with appId="web"
│   ├── pages/
│   │   ├── Home.tsx        # hero + app grid + about
│   │   └── About.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── AppGrid.tsx     # consumes APPS registry
│   │   ├── Manifesto.tsx   # privacy-first, no-upload, etc.
│   │   └── Footer.tsx
│   └── styles.css
└── __tests__/              # smoke + content tests
```

**Steps**
1. Scaffold Vite + React + TS, identical config pattern to json-xml.
2. Wrap in `<AppShell appId="web">`. Accent will be `#4ade80` (emerald) by virtue of the registry.
3. Write `Hero`: large leaf in emerald + headline ("Privacy-first dev utilities. No accounts, no uploads.") + subhead + CTA scrolling to AppGrid.
4. Write `AppGrid`: maps over `APPS`, renders `<a>` cards with leaf in app's accent, name, tagline. Coming-soon cards have a badge.
5. Write `Manifesto`: 3-4 paragraphs on the platform philosophy (no tracking, no uploads, dark-first, free).
6. Write `Footer`: copyright, source link, contact.
7. Add SEO meta: title, description, OG tags, Twitter card, sitemap, structured data (`SoftwareApplication`).
8. Write content (real copy, not lorem).

**Tests**
- `Home.test.tsx`: renders the hero headline; AppGrid lists every app from APPS exactly once; clicking a non-coming-soon card has `target="_blank"`.
- `AppGrid.test.tsx`: coming-soon cards have aria-disabled, badge text "Soon".
- `meta.test.tsx`: required meta tags exist (title, og:title, og:description, og:image).
- ~10 tests total.

**Acceptance**
- `pnpm --filter @aliv/web build` succeeds.
- `pnpm --filter @aliv/web test` green.
- Manual review: copy reads cleanly, no lorem ipsum left.

---

## Phase 0.8 — Repo-wide CI sanity

**Goal**: Confirm `pnpm install / build / test / lint` works at the root and produces the expected output.

**Steps**
1. From repo root run `pnpm install` clean (delete pnpm-lock.yaml first to confirm reproducibility, then commit the new lock).
2. `pnpm -r typecheck` — all green.
3. `pnpm -r lint` — zero errors.
4. `pnpm -r test` — record total test count, must be ≥ 256 (201 from json-xml + ~50 from @aliv/ui + ~5 from web + ~5 integration).
5. `pnpm -r build` — produces `apps/web/dist`, `apps/json-xml/dist`, `packages/ui` is source-only (no dist needed for monorepo internal package).
6. Add a top-level `README.md` documenting the monorepo: layout, common commands, how to add a new app.
7. Commit the lock file + README.

**Tests**: none new; this phase is verification.

**Acceptance**
- One-shot `pnpm install && pnpm -r build && pnpm -r test && pnpm -r lint` from a fresh clone succeeds.

---

# Part B — QR Code Generator (`apps/qrcode`)

## Phase Q.0 — App scaffold

**Goal**: A new Vite + React + TS app that opens with the AppShell rendering in cyan. No QR rendering yet — just the shell.

**File deliverables**
```
apps/qrcode/
├── package.json            # @aliv/qrcode, deps: react, @aliv/ui, qr-code-styling
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
├── public/
│   └── favicon.svg         # leaf in cyan
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles.css
    └── (more in later phases)
```

**Steps**
1. Branch `phase/q.0-scaffold`.
2. `mkdir apps/qrcode`. Scaffold via copy of `apps/json-xml`'s minimal config files, renamed.
3. `App.tsx`:
   ```tsx
   import { AppShell } from '@aliv/ui';
   export default function App() {
     return (
       <AppShell appId="qrcode" settings={null} shortcuts={[]}>
         <main className="qr-app">{/* placeholder */}</main>
       </AppShell>
     );
   }
   ```
4. Verify accent is `#22d3ee` cyan and leaf renders in cyan.
5. `pnpm install` adds `qr-code-styling` as a dep.

**Tests**
- `App.test.tsx`: renders without crashing, `<html data-app="qrcode">` is set, leaf computed fill matches `#22d3ee` (or computed equivalent).

**Acceptance**
- `pnpm dev:qr` opens the app in a browser; the shell looks identical to json-xml except cyan.

---

## Phase Q.1 — Core QR rendering

**Goal**: Live preview of a QR code from a single string input. Foundation for everything that follows.

**File deliverables**
```
apps/qrcode/src/
├── lib/
│   └── qr-engine.ts        # thin wrapper around qr-code-styling
├── hooks/
│   └── useQrPreview.ts     # debounced re-render orchestration
├── components/
│   ├── QrPreview.tsx       # canvas/svg target + scaling container
│   ├── ContentInput.tsx    # plain textarea for v1 of this phase
│   ├── ErrorCorrectionPicker.tsx
│   └── SizeMarginControls.tsx
└── App.tsx                 # composes the above
```

**Steps**
1. `qr-engine.ts`: exports `createQr(opts: QrOptions)`, `updateQr(instance, partialOpts)`, `renderToCanvas`, `renderToSvgString`. Hides qr-code-styling specifics behind our own `QrOptions` type.
2. `QrOptions` type:
   ```ts
   export interface QrOptions {
     data: string;
     errorCorrection: 'L' | 'M' | 'Q' | 'H';
     size: number;        // pixels, square
     margin: number;      // pixels
     // (color/shape/logo come in later phases)
   }
   ```
3. `useQrPreview(options)`: debounces option changes by 50ms, returns a ref to attach to a container `<div>`. On change, calls `updateQr`.
4. Simple side-by-side layout: left = controls, right = QR preview centered.
5. Real-time preview as user types.

**Tests**
- `qr-engine.test.ts` (jsdom): `createQr({ data: 'hello' })` produces an instance; `renderToSvgString` returns a string starting with `<svg`; changing `errorCorrection` produces a different SVG.
- `useQrPreview.test.ts`: debounces multiple rapid changes into one render.
- `ContentInput.test.tsx`: typing emits onChange.
- `ErrorCorrectionPicker.test.tsx`: each of L/M/Q/H selectable; default is "M".
- ~15 tests.

**Acceptance**
- Type "hello" → see a QR. Switch to "https://example.com" → preview updates within 100ms. Change EC level → visible density change.

---

## Phase Q.2 — Color controls

**Goal**: Foreground/background colors, plus linear and radial gradients on the foreground. Eye color override.

**File deliverables**
```
apps/qrcode/src/
├── components/
│   ├── ColorControls.tsx
│   ├── ColorPicker.tsx          # custom dark-themed picker
│   └── GradientEditor.tsx       # type, two stops, angle
└── lib/
    └── color-utils.ts            # parse, validate, hex/rgba, contrast check
```

**Steps**
1. `QrOptions` extended:
   ```ts
   foreground: { type: 'solid'; color: string }
              | { type: 'linear-gradient'; stops: [string, string]; angle: number }
              | { type: 'radial-gradient'; stops: [string, string] };
   background: { type: 'solid'; color: string };
   eyeColor?: string;             // optional override of foreground for the three eye markers
   ```
2. `ColorPicker`: hex input + native `<input type="color">` styled to match the dark theme + saved-recent palette.
3. `GradientEditor`: type selector (linear/radial), two color pickers, angle slider for linear.
4. `color-utils.ts`: `isValidHex`, `hexToRgb`, `contrastRatio(fg, bg)`. Used for the contrast warning in Q.7.

**Tests**
- `color-utils.test.ts`: ~12 tests covering parsing edge cases, contrast formula correctness against known WCAG values.
- `ColorPicker.test.tsx`: invalid hex shows error, valid hex emits onChange, recent-color list updates.
- `GradientEditor.test.tsx`: switching type updates options, angle slider value reflected.
- ~20 tests this phase.

**Acceptance**
- Solid red foreground works. Switch to linear gradient blue→purple at 45° works. Background change works. Eye color override visibly differentiates the three corner markers.

---

## Phase Q.3 — Shape controls

**Goal**: Module shapes, eye frame shapes, eye ball shapes — the visual personality of the QR.

**File deliverables**
```
apps/qrcode/src/
├── components/
│   ├── ShapeControls.tsx
│   ├── ModuleShapePicker.tsx
│   └── EyeShapePicker.tsx
└── lib/
    └── shape-options.ts          # mapping our shape ids to qr-code-styling values
```

**Steps**
1. `QrOptions` extended:
   ```ts
   moduleShape: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
   eyeFrameShape: 'square' | 'rounded' | 'leaf' | 'circle';
   eyeBallShape: 'square' | 'rounded' | 'leaf' | 'circle';
   ```
2. Visual picker: each shape rendered as a tiny preview thumbnail (a 40×40 mini-QR-fragment).
3. `shape-options.ts` maps our names to qr-code-styling's options shape.

**Tests**
- `shape-options.test.ts`: every shape id maps to a valid qr-code-styling value.
- `ModuleShapePicker.test.tsx`: clicking a thumbnail updates selection; current selection has visual marker.
- `EyeShapePicker.test.tsx`: same for both frame and ball.
- ~12 tests.

**Acceptance**
- Switching module shape from "square" to "dots" → instant visible change. Eye frame → "leaf" looks distinct. Eye ball independent of frame.

---

## Phase Q.4 — Logo embedding

**Goal**: Drag-and-drop a logo image into the QR center with size, padding, and shape controls. Auto-bump error correction when logo is large.

**File deliverables**
```
apps/qrcode/src/
├── components/
│   ├── LogoUpload.tsx          # drop-zone + file picker + preview
│   ├── LogoControls.tsx        # size %, padding, shape (square/round/circle), bg
│   └── LogoEcWarning.tsx       # "We bumped EC to H to keep this scannable"
└── lib/
    └── logo-utils.ts           # file → data URL, MIME validation, size guard
```

**Steps**
1. `QrOptions` extended:
   ```ts
   logo?: {
     src: string;       // data URL
     sizeRatio: number; // 0..0.5 of QR size
     padding: number;   // px around the logo
     shape: 'square' | 'rounded' | 'circle';
     backgroundColor?: string;  // for transparent logos
   };
   ```
2. `LogoUpload`: drag/drop or click; accepts `image/png, image/svg+xml, image/jpeg, image/webp`; rejects > 2 MB; emits data URL.
3. Auto-bump rule: when `logo.sizeRatio > 0.2`, force `errorCorrection = 'H'` and surface a non-blocking notice via `LogoEcWarning`.
4. Allow user to override the auto-bump if they accept the risk.

**Tests**
- `logo-utils.test.ts`: file→data-URL round-trip, MIME validation rejects `.exe`, size limit enforced.
- `LogoUpload.test.tsx`: drop event → onChange fires with data URL; oversize file → shows error.
- `LogoControls.test.tsx`: size slider, padding, shape change all reflected in options.
- Auto-EC bump rule: integration test in `App.test.tsx` (set ratio to 0.3, assert EC becomes H, warning visible).
- ~15 tests.

**Acceptance**
- Drag a 200x200 PNG into the drop zone → logo appears in QR center. Move size slider → live update. Shape → circle clips the logo. With logo > 20% size, EC bumps to H automatically and a banner explains why.

---

## Phase Q.5 — Content type system

**Goal**: A tabbed/segmented set of content types with proper builders for each. This is the most test-heavy phase because each builder needs careful coverage.

### Types to support
1. **Text** — raw string
2. **URL** — `https://…` with auto-prefixing if missing scheme
3. **Wi-Fi** — `WIFI:T:WPA;S:<ssid>;P:<pass>;H:<hidden>;;`
4. **vCard** — vCard 3.0 standard
5. **Email** — `mailto:address?subject=…&body=…`
6. **SMS** — `sms:<number>?body=…`
7. **Phone** — `tel:<number>`
8. **Geo** — `geo:<lat>,<lon>?q=<label>`
9. **Calendar event** — VEVENT block per RFC 5545

**File deliverables**
```
apps/qrcode/src/
├── content/
│   ├── types.ts                # union of ContentType, type-specific shapes
│   ├── builders/
│   │   ├── text.ts
│   │   ├── url.ts
│   │   ├── wifi.ts
│   │   ├── vcard.ts
│   │   ├── email.ts
│   │   ├── sms.ts
│   │   ├── phone.ts
│   │   ├── geo.ts
│   │   ├── calendar.ts
│   │   └── index.ts            # barrel + buildContent(type, data) dispatcher
│   ├── forms/
│   │   ├── TextForm.tsx
│   │   ├── UrlForm.tsx
│   │   ├── WifiForm.tsx
│   │   ├── VCardForm.tsx
│   │   ├── EmailForm.tsx
│   │   ├── SmsForm.tsx
│   │   ├── PhoneForm.tsx
│   │   ├── GeoForm.tsx
│   │   └── CalendarForm.tsx
│   └── ContentTabs.tsx         # segmented control
```

**Steps**
1. Define discriminated-union `ContentData`:
   ```ts
   export type ContentData =
     | { type: 'text'; text: string }
     | { type: 'url'; url: string }
     | { type: 'wifi'; ssid: string; password: string; auth: 'WPA' | 'WEP' | 'nopass'; hidden: boolean }
     | { type: 'vcard'; firstName: string; lastName: string; org?: string; title?: string; phone?: string; email?: string; url?: string; address?: string }
     | { type: 'email'; to: string; subject?: string; body?: string }
     | { type: 'sms'; phone: string; body?: string }
     | { type: 'phone'; phone: string }
     | { type: 'geo'; lat: number; lon: number; label?: string }
     | { type: 'calendar'; title: string; description?: string; location?: string; start: string; end: string };
   ```
2. Each builder returns `{ ok: true, value: string } | { ok: false, error: string }`. Properly escape special chars per format spec (Wi-Fi escapes `\`, `;`, `,`, `:`, `"`; vCard escapes `\`, `,`, `;`, newlines).
3. `buildContent(data)` dispatches.
4. Each form is a controlled component emitting `ContentData`.
5. `ContentTabs` is a horizontal segmented control; on mobile becomes a `<select>`.

**Tests** (heaviest phase)
- `text.test.ts`: empty string returns ok with empty (or rejects? — pick), passthrough.
- `url.test.ts`: `example.com` → `https://example.com`; `http://x` passes through; `mailto:` rejected (use email form).
- `wifi.test.ts`: ~15 tests — escaping, auth types, hidden flag, SSID/password with special chars.
- `vcard.test.ts`: ~10 tests — minimal card, full card, escaping, line folding (vCard requires CRLF).
- `email.test.ts`: ~8 tests — required `to`, optional subject/body, URL-encoded special chars.
- `sms.test.ts`: ~5 tests — phone normalization, optional body.
- `phone.test.ts`: ~5 tests — international format passthrough.
- `geo.test.ts`: ~6 tests — lat/lon range validation (-90..90, -180..180), optional label.
- `calendar.test.ts`: ~10 tests — VEVENT format, DTSTART/DTEND ISO conversion, escaping.
- `dispatcher.test.ts`: each type routes to the right builder; unknown type errors.
- Form component tests (smoke): each form renders, fields update state, validation errors appear.
- **Target: ~80 tests this phase.**

**Acceptance**
- Switching to "Wi-Fi" tab → entering SSID + password → QR encodes a working `WIFI:` string. Test by scanning with a phone (manual smoke test for Q.5 acceptance).
- vCard scans into the user's contacts on iOS/Android.
- Calendar event imports into Google Calendar.

---

## Phase Q.6 — Export system

**Goal**: PNG, SVG, and copy-to-clipboard exports.

**File deliverables**
```
apps/qrcode/src/
├── components/
│   ├── ExportPanel.tsx
│   └── ResolutionPicker.tsx
└── lib/
    └── export.ts             # downloadPng, downloadSvg, copyPngToClipboard
```

**Steps**
1. `downloadPng(opts: { qr, resolution: number, filename: string })`: renders to canvas at requested resolution, triggers `<a download>` blob.
2. `downloadSvg(opts: { qr, filename })`: emits the SVG string, downloads as `.svg`.
3. `copyPngToClipboard(qr)`: uses `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`. Shows morph feedback via `useCopyFeedback`.
4. Resolutions: 256, 512, 1024, 2048, custom.
5. Filename: derived from the QR content (sanitized first 30 chars) or default `aliv-qrcode-<timestamp>.png`.

**Tests**
- `export.test.ts`:
  - `downloadPng` produces a `Blob` with `type: 'image/png'` and reasonable byte size.
  - `downloadSvg` emits well-formed XML starting with `<svg`.
  - `copyPngToClipboard` calls `navigator.clipboard.write` (mocked).
  - Filename sanitization: spaces → `-`, drops slashes/colons.
- `ResolutionPicker.test.tsx`: each preset selectable, custom input accepts number, rejects > 8192.
- ~12 tests.

**Acceptance**
- "Download PNG (1024)" → file appears, opens correctly. "Download SVG" → opens in browser at any zoom. "Copy" → paste into Slack/Figma/Photoshop produces the QR.

---

## Phase Q.7 — Scannability + UX polish (lite)

**Goal**: Catch scenarios where the user's customization will produce an unscannable QR, and guide them. (Note: full "scannability warning" was deferred from v1, but a lightweight version is essential because the gradient + logo combination can produce unscannable codes.)

**File deliverables**
```
apps/qrcode/src/
├── lib/
│   └── scannability.ts       # heuristic checks
└── components/
    └── ScannabilityNotice.tsx
```

**Steps**
1. `scannability.ts` — pure function `assess(opts: QrOptions): { level: 'ok' | 'warn' | 'fail'; messages: string[] }`. Heuristics:
   - Contrast ratio (foreground vs background, gradient avg vs background) < 3.0 → warn.
   - Logo size ratio > 0.3 with EC < H → warn.
   - Foreground/background HSL lightness too close → warn.
   - Eye color contrast vs background < 3.0 → fail (most likely unscannable).
2. `ScannabilityNotice` shows a single banner with the most severe message. Never blocks the user — warnings are advisory.

**Tests**
- `scannability.test.ts`:
  - White-on-white → fail.
  - Black-on-white → ok.
  - Light-blue on white → warn.
  - Logo at 0.4 with EC L → warn.
  - Logo at 0.4 with EC H → ok.
  - Eye color matching background → fail.
- ~10 tests.

**Acceptance**
- Setting white-on-white fg/bg shows a clear warning. Setting a sane palette has no banner.

---

## Phase Q.8 — Settings drawer + presets

**Goal**: A settings drawer (using the shared `Drawer`) for non-content options that don't belong in the main panel — defaults, theme override, etc. Plus a small built-in preset gallery (4-6 curated styles).

**File deliverables**
```
apps/qrcode/src/
├── settings/
│   ├── QrSettings.tsx        # drawer body
│   └── presets.ts            # array of named QrOptions
└── components/
    └── PresetGallery.tsx
```

**Steps**
1. Drawer body: defaults (default EC level, default size), preset gallery, "reset to defaults" button.
2. Built-in presets: Classic Black, Cyan Brand (Aliv accent), Sunset Gradient, Mono Dots, Rounded Pastel, High-Contrast Print.
3. Click preset → applies to current QR (with confirm if user has custom unsaved edits).

**Tests**
- `presets.test.ts`: every preset is a valid `QrOptions` instance; no preset has scannability `fail`.
- `PresetGallery.test.tsx`: clicking a preset emits onApply with that preset's options; current preset highlighted.
- ~10 tests.

**Acceptance**
- Open settings → see preset grid → click "Sunset Gradient" → QR adopts those colors and shapes instantly.

---

## Phase Q.9 — Keyboard shortcuts + mobile + a11y

**Goal**: Match the JSON↔XML app's polish on keyboard, mobile, and accessibility.

**Steps**
1. Shortcuts: `Ctrl+Enter` (re-render / regenerate), `Ctrl+Shift+C` (copy PNG), `Ctrl+Shift+S` (cycle to next content type tab), `Ctrl+,` (open settings drawer), `?` (open shortcuts modal).
2. Mobile (< 768px): controls collapse into a vertically scrolling stack; preview moves to top, controls below; export buttons become a sticky footer.
3. A11y:
   - Every form input has a `<label>`.
   - Color pickers expose hex value as text alternative.
   - QR preview has `<img>` `alt` (or `<svg>` `<title>`) describing the encoded value.
   - Focus rings visible on all interactive elements.
   - No reliance on color alone for state (selected preset, error states use icons + text too).
4. Run axe-core in tests on the main routes.

**Tests**
- `shortcuts.test.ts`: each shortcut fires the expected handler.
- `accessibility.test.ts`: axe-core run on `<App/>` returns 0 violations.
- Mobile layout snapshot test (loose): at 320×800, no horizontal overflow.
- ~10 tests.

**Acceptance**
- Lighthouse a11y ≥ 95.
- All interactive elements reachable by keyboard, focus order is sensible.

---

## Phase Q.10 — Marketing landing content

**Goal**: Convert the bare app into a polished page with above-the-fold hero, feature explanations, FAQ, and use cases. SEO meta complete.

**File deliverables**
```
apps/qrcode/src/
├── sections/
│   ├── Hero.tsx              # short headline + the actual generator inline
│   ├── Features.tsx          # 6-tile feature grid
│   ├── UseCases.tsx          # Wi-Fi share, vCard, marketing campaigns, restaurant menu
│   └── Faq.tsx
└── App.tsx                   # composes sections + the generator
```

**Steps**
1. Hero: tagline ("Beautiful, customizable QR codes. Free. No login. No watermarks.") + the working generator beneath, immediately usable without scrolling.
2. Features grid: All content types · Custom colors & gradients · Shape control · Logo embedding · PNG/SVG export · Scannability check.
3. Use cases: 4 paragraphs with example QR images.
4. FAQ: 8 entries (file size limits, scannability, why no batch yet, privacy, etc.).
5. SEO meta + structured data (`SoftwareApplication`).
6. Sitemap + robots.txt.

**Tests**
- `Faq.test.tsx`: each FAQ item renders, click toggles expanded.
- `meta.test.tsx`: required SEO tags present.
- ~8 tests.

**Acceptance**
- Page passes a manual content review (no lorem, headlines ring true).
- Lighthouse: Performance ≥ 90, SEO ≥ 95, A11y ≥ 95, Best Practices ≥ 95.

---

# Part C — End-to-end coverage

## Phase E.1 — Playwright e2e suite

**Goal**: Real-browser, multi-app end-to-end coverage so the launch is gated on something stronger than unit tests + a manual checklist. Replaces most of the manual smoke pass that was originally in Q.11.

**Why a separate phase / Part C?** E2E sits above all three apps and runs against real builds — it doesn't belong inside any single app workspace. Treating it as its own workspace package (`packages/e2e`) keeps app deps clean and lets the suite be run independently in CI (`pnpm --filter @aliv/e2e test:e2e`).

**File deliverables**
```
packages/e2e/
├── package.json                # @aliv/e2e, devDeps: @playwright/test
├── playwright.config.ts        # 3 projects: chromium, firefox, webkit
├── tsconfig.json
├── fixtures/
│   ├── server.ts               # spins up vite preview for each app on fixed ports
│   └── theme.ts                # cookie helpers for cross-app theme tests
├── tests/
│   ├── shell/
│   │   ├── app-switcher.spec.ts        # opens switcher in each app, links open in new tab
│   │   ├── theme-toggle.spec.ts        # toggles theme, asserts data-theme attr + persistence
│   │   ├── shortcuts-modal.spec.ts     # `?` opens modal, `Esc` closes
│   │   └── settings-drawer.spec.ts     # opens, persists, closes on backdrop
│   ├── json-xml/
│   │   ├── conversion.spec.ts          # paste JSON → see XML, swap, copy, clear
│   │   ├── validation-errors.spec.ts   # invalid input → status bar shows line/col
│   │   ├── settings.spec.ts            # toggle attribute prefix, format mode
│   │   └── mobile.spec.ts              # 375×812 viewport, tabs, no horizontal overflow
│   ├── qrcode/
│   │   ├── generate-text.spec.ts       # text → QR svg renders → download PNG
│   │   ├── generate-wifi.spec.ts       # fill Wi-Fi form → QR encodes WIFI: string
│   │   ├── generate-vcard.spec.ts      # vCard form → QR encodes BEGIN:VCARD
│   │   ├── colors-shapes.spec.ts       # change color/shape → preview updates
│   │   ├── logo-upload.spec.ts         # drop logo → EC auto-bumps to H, banner shows
│   │   ├── export.spec.ts              # PNG download triggers, SVG download triggers, copy works
│   │   └── presets.spec.ts             # apply preset → options reflect
│   ├── web/
│   │   ├── home.spec.ts                # hero + app grid render, every app linked
│   │   └── seo.spec.ts                 # meta + og + structured data present
│   └── cross-app/
│       └── theme-cookie.spec.ts        # set theme on one app, navigate to another, theme persists
└── README.md                   # how to run, how to debug, how to add tests
```

**Steps**

### E.1.a — Scaffold
1. Branch `phase/e.1-playwright`.
2. `mkdir -p packages/e2e/{tests,fixtures}`.
3. `pnpm --filter @aliv/e2e add -D @playwright/test`.
4. `pnpm exec playwright install --with-deps chromium firefox webkit` (CI installs only chromium by default; full set on demand).
5. Add root scripts to `package.json`:
   ```jsonc
   {
     "scripts": {
       "e2e":         "pnpm --filter @aliv/e2e test:e2e",
       "e2e:ui":      "pnpm --filter @aliv/e2e test:e2e:ui",
       "e2e:debug":   "pnpm --filter @aliv/e2e test:e2e:debug"
     }
   }
   ```

### E.1.b — Test server fixture
1. `fixtures/server.ts` builds each app once (`vite build`) then runs `vite preview` on fixed ports — `4001` (json-xml), `4002` (qrcode), `4003` (web). Lifecycle: start before suite, stop after.
2. Use Playwright's `webServer` config (multiple entries supported) so tests don't need to manage processes themselves.
3. Each spec has a `BASE` constant pointing at its app's port. No tests cross-app-navigate via real DNS; cross-app theme test uses `localStorage` + same-origin nav under the apex setup.

### E.1.c — Shell tests (run against each app)
- Test factory pattern: a single `defineShellTests(appBaseUrl, appName, accent)` produces the same suite for every app, parameterized by URL.
- Asserts: app name in header, leaf has expected accent (computed style), switcher opens, all 3 apps listed, theme toggle round-trip, shortcuts modal opens via `?`.

### E.1.d — App-specific happy paths
- json-xml: type `{"a":1}` → expect `<a>1</a>` in output panel within 500ms; `Ctrl+Shift+S` swaps; `Ctrl+Shift+C` copies (assert clipboard via `navigator.clipboard.readText` exposure or `page.evaluate`).
- qrcode: per content type, fill the form and assert the rendered SVG contains an expected fingerprint (a hash of the resulting `data` string, NOT visual diff — visual is too flaky).
- web: navigate, assert link count matches `APPS.length`, every link has `target="_blank"`.

### E.1.e — Cross-app theme cookie test
- Set theme to `light` on json-xml's port, navigate to qrcode's port, assert `<html data-theme="light">` is set on load. Requires the dev test setup to use the same apex hostname for all three (e.g. all served on `localhost` and the test sets `Domain=localhost` via the cookie helper). Document the limitation: real cross-subdomain only works with `*.aliv.local` hosts entries (covered in Phase 0.6 docs).

### E.1.f — Visual regression
- **Out of scope for v1.** No snapshot/visual-diff tests; they're flaky and high-maintenance. We rely on assertion-based tests + manual review for visual quality. Track as deferred for a v0.2 follow-up.

### E.1.g — CI integration
- Add a top-level `pnpm e2e` script.
- The DoD's "fresh-clone install" check now runs: `pnpm install && pnpm -r build && pnpm -r test && pnpm -r lint && pnpm e2e`.
- E2E runs only against chromium in CI by default; firefox + webkit are opt-in via `pnpm e2e --project=firefox`.

**Tests to add**
- Target: **~25 e2e specs**, each with 1–4 assertions. Counted separately from unit tests.

**Risks**
- Playwright + Vite preview port collisions in dev. Mitigation: fixed ports, `webServer.reuseExistingServer: true`.
- Clipboard API in webkit needs the `--enable-features=ClipboardAPI` flag. Mitigation: skip clipboard assertions on webkit, document in spec.
- React Compiler + Playwright sometimes log noisy warnings. Mitigation: filter known warnings in a `console.warn` listener; fail only on errors.

**Acceptance**
- `pnpm e2e` green on chromium locally and in CI.
- All 3 critical user journeys covered end-to-end: convert JSON↔XML, generate scannable QR (Wi-Fi + vCard), navigate via app switcher.
- Cross-app theme persistence verified by automated test (no longer "assumed").
- Manual phone-scanning smoke (Wi-Fi connects, vCard imports) is the *only* remaining manual step for Q.11.

---

## Phase Q.11 — Final integration & launch checklist

**Goal**: Whole-platform validation before declaring v1 done.

**Steps**
1. Add qrcode to the `APPS` registry — set `comingSoon` to `false`.
2. Verify the platform landing (`apps/web`) now lists QR as live, not coming-soon.
3. Verify the app switcher in json-xml correctly links to the qrcode subdomain.
4. Run full suite: `pnpm -r test` — must show ≥ 350 passing.
5. Run `pnpm e2e` — all e2e specs green on chromium.
6. Run `pnpm -r build`; record bundle sizes; flag any chunk > 500 KB for follow-up.
7. Manual phone-scanning smoke test (the only manual step left after Phase E.1):
   - Generate Wi-Fi QR → scan with a phone → connects.
   - Generate vCard QR → scan → contact created.
   - Generate styled QR with logo → scan → still works.
8. Update `CLAUDE.md` to reflect the new state (qrcode shipped, hash next).
9. Tag release `v0.1.0`.

**Acceptance**
- ≥ 350 passing unit tests across the monorepo.
- ≥ 25 e2e specs green on chromium.
- Three working apps each on their own subdomain (or path during dev).
- App switcher works in all three.
- Cross-app theme persistence verified by Playwright (no longer "assumed").

---

# Cross-cutting concerns

## Security
- Never embed user input into the DOM as raw HTML. All inputs are React-rendered text.
- Sanitize file uploads (logo): MIME check, size cap, optionally re-encode through a canvas to drop EXIF/script payloads in malicious SVGs.
- For SVG logo uploads specifically: parse and reject any `<script>`, `<foreignObject>`, or external references before embedding.
- Set `Content-Security-Policy` meta in each app's `index.html` (`script-src 'self'`, `style-src 'self' 'unsafe-inline'` initially, tighten later).

## Privacy
- Zero analytics in v1. (If we add later, it's privacy-preserving — Plausible, Umami, or self-hosted only. No Google Analytics.)
- Zero third-party CDN font loads. System fonts only.
- `localStorage` and the apex-domain theme cookie are the only client-side storage. No tracking IDs.

## Performance budgets
- Each app's main JS bundle: < 200 KB gzipped.
- LCP < 2.5s on a Moto G4 / Slow 4G simulation.
- CodeMirror in json-xml is the heaviest dep — accept ~150 KB gz for it.
- qr-code-styling is ~50 KB gz; comfortable.

## Accessibility
- Target Lighthouse a11y ≥ 95 on every app.
- Keyboard navigation works without mouse for the entire flow.
- Color is never the only state indicator.

## Browser support
- Last two versions of Chrome, Firefox, Safari, Edge.
- iOS Safari 16+, Chrome Android last two.
- No IE; no legacy Edge.

## Test inventory target

| Layer | Approx new tests |
|---|---|
| `@aliv/ui` (components, hooks, registry) | 50 |
| json-xml integration with shell | 5 |
| `@aliv/web` landing | 10 |
| qrcode core engine | 15 |
| qrcode color | 20 |
| qrcode shapes | 12 |
| qrcode logo | 15 |
| qrcode content builders | 80 |
| qrcode export | 12 |
| qrcode scannability | 10 |
| qrcode presets | 10 |
| qrcode shortcuts/a11y | 10 |
| qrcode marketing | 8 |
| **New tests added** | **~257** |
| **Existing (json-xml)** | **201** |
| **Total unit-test target** | **≥ 350** *(buffer of ~100 for slippage)* |
| Playwright e2e specs (separate suite) | ~25 |

---

# Definition of Done (whole plan)

- [ ] `pnpm install` clean from a fresh clone.
- [ ] `pnpm -r build` succeeds for all apps.
- [ ] `pnpm -r test` ≥ 350 passing, 0 failing.
- [ ] `pnpm -r lint` 0 errors.
- [ ] `pnpm e2e` green on chromium (≥ 25 specs).
- [ ] All three apps render with the AppShell, accents distinct, leaf logo color-coded.
- [ ] App switcher works in every app, links open in new tab.
- [ ] Cross-subdomain theme cookie verified by unit test **and** by Playwright.
- [ ] QR generator: every content type produces a scannable QR (manual phone-scan for Wi-Fi + vCard).
- [ ] Lighthouse: each app ≥ 90 on every category.
- [ ] CLAUDE.md and ALIV_PLATFORM.md updated to reflect ship state.
- [ ] Tagged `v0.1.0`.

---

# Risks & mitigations

| Risk | Mitigation |
|---|---|
| Logo PNG → SVG path-trace produces ugly curves | Allocate proper time in 0.3; fallback to manual hand-trace in Figma; accept iteration. |
| pnpm + React Compiler + Vite quirks at the workspace root | Test 0.2 thoroughly; if React Compiler breaks, downgrade to per-app build first, fix in a follow-up. |
| qr-code-styling is unmaintained / has bugs | Wrapper layer (`qr-engine.ts`) lets us swap to `qrcode` + manual styling later without touching app code. |
| Cross-subdomain cookie sync flaky in real DNS | Document the iframe-broker fallback, ship with cookie + per-app localStorage redundancy. Iframe broker becomes Phase 0.6.b if needed. |
| Scope creep in QR (presets, batch, advanced styles) | Anything not in this plan is **deferred**. Park ideas in `NEXT_STEPS.md` under a "QR v2" section. |
| Test count target too aggressive | 350 is a target, not a gate. The DoD requires green tests, not a specific count. Treat the target as a planning aid. |

---

# Working order summary

```
[Part A — Refactor]
0.1  Pre-flight + baseline
0.2  Monorepo skeleton (move JsonToXML → apps/json-xml)
0.3  Logo PNG → SVG
0.4  @aliv/ui: tokens, registry, theme, components, hooks
0.5  Refactor json-xml onto AppShell
0.6  Cross-app theme sync validation
0.7  apps/web platform landing
0.8  Repo-wide CI sanity

[Part B — QR Generator]
Q.0  Scaffold apps/qrcode
Q.1  Core QR rendering
Q.2  Color controls + gradients
Q.3  Shape controls
Q.4  Logo embedding
Q.5  Content type system (8 builders, 80 tests)
Q.6  Export system
Q.7  Scannability check
Q.8  Settings drawer + presets
Q.9  Keyboard / mobile / a11y
Q.10 Marketing landing content

[Part C — End-to-end]
E.1  Playwright e2e suite (packages/e2e, ~25 specs across 3 apps)

[Launch]
Q.11 Final integration + launch checklist (now gated on `pnpm e2e` green)
```

Each phase is one branch and one commit (or a small handful for the larger phases). Always green between phases.
