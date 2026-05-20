# QR Code App — Fix Plan & E2E Test Spec

Branch target: `phase/0.1-preflight` (or a child branch
`phase/0.2-qrcode-fixes`)
Source of bugs: [`apps/qrcode/REVIEW.md`](./REVIEW.md)
E2E target: `packages/e2e/tests/qrcode.*.spec.ts`
Date: 2026-05-10

---

## 0. Goals & non-goals

**Goals**
1. Land every P0 / P1 fix from `REVIEW.md` with a regression test that
   would have caught the bug.
2. Ship a Playwright suite that exercises the qrcode app end-to-end
   across the failure modes the unit tests can't model — DOM-level
   stickiness across `update()` calls, real download bytes, real
   keyboard input, real focus / scroll behaviour.
3. Keep the existing 124 unit tests green and grow them where a
   focused unit test is cheaper than an e2e (builder output, option
   mapping, validators).
4. No regressions in `@aliv/json-xml` and `@aliv/web` — their existing
   suites must stay green.

**Non-goals**
- Redesigning the chrome / `@aliv/ui` surface. Fixes stay inside
  `apps/qrcode` unless the bug is genuinely in `packages/ui`.
- Lazy-loading `qr-code-styling` (REVIEW §6) — deferred to a later
  perf pass; current 86 KB gzipped is inside budget.
- DOMParser-based SVG sanitisation (REVIEW §5) — defence-in-depth
  task, scheduled in P3 below but not blocking 0.2 release.
- Switching the engine library, adding telemetry, or changing the
  app registry.

**Definition of done**
- [ ] Every checkbox in §3 (fixes) and §4 (tests) ticked.
- [ ] `pnpm -r typecheck && pnpm -r lint && pnpm -r test` clean from
      repo root.
- [ ] `pnpm -r build` succeeds.
- [ ] `pnpm e2e` green locally on chromium (Playwright default).
- [ ] No new bundle entries in `apps/qrcode` over 10 KB gzipped without
      a comment justifying it.
- [ ] `REVIEW.md` items P0+P1 each crossed off with a one-line reference
      to the commit that fixed them; P2 items either resolved or
      explicitly punted with a note.

---

## 1. Working agreement

- **One conventional-commit per logical fix.** Commits read like
  `fix(qrcode): re-instantiate qr instance on fill-type change (§8.1)`.
  Bundle a fix and its test in the same commit so bisect lands you on
  a working state.
- **Test-first whenever feasible.** For each fix: write a failing test
  reproducing the bug, then write the fix until it goes green. For
  bugs the existing unit harness can't reach, write the Playwright
  spec first.
- **Pure logic → unit test. Browser-only behaviour → e2e.** If the
  bug lives in `lib/` or a builder, prefer Vitest. If it lives in
  `qr-code-styling`'s `update()` mergeDeep behaviour, in CSS, in real
  keyboard handling, in download bytes, or in focus order, use
  Playwright.
- **Page Object pattern for the e2e suite.** Everything in §4 leans on
  a single `QrcodePage` helper (see §4.0) so selectors don't fan out
  across specs.
- **No screenshots-as-truth.** Visual regression is out of scope for
  0.2. Assertions are DOM / attribute / file-bytes based.

---

## 2. Test infrastructure changes

Before writing any new spec we lay the rails so individual specs stay
short.

### 2.1 Split the existing `qrcode.spec.ts`
The current file mixes smoke + interaction. Replace it with:

```
packages/e2e/tests/
  qrcode/
    smoke.spec.ts          # renders, keyboard nav, no console errors
    content-types.spec.ts  # all 9 content tabs round-trip
    colors.spec.ts         # solid ↔ gradient, eye color, hex input UX
    frame-and-shape.spec.ts# frame shapes, module shapes, eye shapes
    logo.spec.ts           # upload, drag, keyboard, EC auto-bump
    export.spec.ts         # PNG/SVG download, copy, parity with preview
    presets.spec.ts        # apply / current highlight / reset
    shortcuts.spec.ts      # rail keys, modal focus trap, body scroll
    a11y.spec.ts           # axe-core scan, label/required, aria-live
```

Why split: each file gets its own worker in parallel, and a failure
points at the area immediately.

### 2.2 Add helpers
`packages/e2e/tests/qrcode/_fixtures/` containing:

- `qrcode-page.ts` — `QrcodePage` class with `goto()`,
  `selectRail(id)`, `setContentType(id)`, `previewSvg()`,
  `previewCanvas()`, `applyPreset(id)`, `openSettings()`,
  `download(format)`, `expectScannableNotice(state)`, etc.
- `download-helpers.ts` — `waitForDownload(page, action)` returns a
  `Buffer` plus filename. Used to assert PNG dimensions and SVG
  contents.
- `a11y.ts` — wraps `@axe-core/playwright` (added as a devDep) with a
  project-tuned ruleset (allow-list: `color-contrast` warnings on
  shadcn-style focus rings; disallow: missing labels, role mismatches).
- `sample-logo.svg` and `sample-logo.png` (small fixtures, ~1 KB each)
  used by the logo upload tests.

### 2.3 New devDependency
- `@axe-core/playwright` (≈18 KB, MIT) for §4.9 a11y scans. No runtime
  impact — devDep only.

### 2.4 Stable selectors

Where REVIEW touches a flow and the JSX has no stable hook, add
`data-testid` rather than relying on text or class names. New testids
introduced (and the only ones the e2e suite is allowed to lean on):

| testid                    | Element                                  |
|---------------------------|------------------------------------------|
| `qr-preview`              | already exists, keep                     |
| `qr-preview-canvas`       | the `<svg>` / `<canvas>` qr-code-styling produces |
| `qr-scannability-notice`  | `ScannabilityNotice` root                |
| `qr-export-feedback`      | the `<p>` showing copy/error feedback in `ExportPanel` |
| `qr-frame-stage`          | `.qr-preview-stage` (drives frame styling) |
| `qr-content-form`         | the active content form wrapper          |
| `qr-preset-card`          | each preset gallery card                 |
| `qr-export-resolution`    | the resolution segmented control         |
| `qr-logo-dropzone`        | `LogoUpload` clickable region            |
| `qr-modal-faq`            | the FAQ modal root                       |

Text-content assertions (e.g. "Live preview · scannable") stay where
the literal copy is part of the user contract, but `getByTestId` is
preferred for structure.

---

## 3. Fixes

Each entry below is structured:

> **§ref — Title**
> *File(s).* What's wrong. The fix. Verification (unit + e2e refs).
> Risk notes if any.

The order matches REVIEW's recommended P0 → P2 list.

### P0 — broken core flows

#### F1. §8.1 — Foreground gradient → solid sticks
**Files:** `apps/qrcode/src/hooks/useQrPreview.ts`,
`apps/qrcode/src/lib/qr-engine.ts`,
`apps/qrcode/src/__tests__/qr-engine.test.ts` (new),
`apps/qrcode/src/components/QrPreview.tsx` (only if ref handling moves).

**Bug:** `qr-code-styling`'s `update()` deep-merges and skips
`undefined`. When the user switches `foreground.type` from
`gradient → solid`, the new options pass `{ color }` with no
`gradient` key, so the previous `gradient` survives the merge and
the lib continues to render it. The unit test inspects only the
mapped options object; it never observes the rendered SVG.

**Fix (chosen approach: 1 from REVIEW):**
1. Track `lastFillType` and `lastBackgroundFillType` inside
   `useQrPreview`. When either changes between renders, dispose the
   current `QRCodeStyling` instance and `createQr(options)` afresh
   instead of calling `update()`. Mount the new SVG node in place of
   the old one.
2. Same logic applies to changes that touch the **structural** shape
   of options: `eyeColor` going from `undefined → set` or back, and
   logo `image` going from `undefined → set`. Track those too — same
   underlying mergeDeep limitation.
3. Keep `update()` as the fast path for color values, size, margin,
   data, and shape changes.

**Unit test (Vitest, jsdom):**
- `qr-engine.test.ts` — given `solid → linear-gradient → solid`,
  assert the rendered SVG of a fresh `createQr(...)` contains zero
  `<linearGradient>`/`<radialGradient>` elements. Use the library's
  `getRawData('svg')` or read the in-memory SVG via the canvas-like
  helper.

**E2E:** §4.3 covers it end-to-end (`colors.spec.ts → "switching from
gradient back to solid renders no gradient stop"`).

**Risk:** re-instantiating churns layout for one frame. Acceptable
because it only happens on *structural* changes (rare). Add a
`beforeEach`/`afterEach` log-spy in unit tests to assert no
`console.warn` from the lib.

---

#### F2. §8.3 + §8.4 — Frame shape doesn't reshape the QR and isn't exported
**Files:** new `apps/qrcode/src/lib/frame-shapes.ts`,
`apps/qrcode/src/lib/export.ts`,
`apps/qrcode/src/components/QrPreview.tsx`,
`apps/qrcode/src/styles.css`,
`apps/qrcode/src/lib/qr-engine.ts` (read `frameShape` in
`toStylingOptions` only if needed for the `applyExtension` route).

**Bug:** the frame shape is CSS on the card (`.qr-preview-stage`).
The actual QR module grid stays a 280×280 square inside it; on a
"Circle" the corners poke out / the QR floats in the middle. Worse,
`qr-engine.ts:toStylingOptions` ignores `frameShape`, so PNG/SVG
exports come out as a plain square QR.

**Fix:**
1. Add `lib/frame-shapes.ts` exporting:
   ```ts
   export type FrameShape =
     | 'none' | 'square' | 'rounded' | 'circle' | 'hex' | 'badge' | 'scallop';
   export function frameSvgPath(shape: FrameShape, size: number): {
     path: string;       // SVG `d` attribute for the frame outline
     inscribe: { x: number; y: number; size: number }; // QR placement
     viewBox: { w: number; h: number };
   };
   ```
   For each shape, the QR is placed at the largest inscribed square,
   with a configurable safety inset (default 8 px at 1024 px export).
2. **Preview path:** in `QrPreview.tsx`, render an outer `<svg>` with
   the frame `<path>` and a `<g transform>` containing the
   qr-code-styling output node (read it via `qrRef.current.append(...)`
   into a `<foreignObject>` or via `getRawData('svg')` and inline).
   Ditch `.qr-preview-stage[data-frame=...]` CSS rules — they were
   the wrong layer.
3. **Export path:** in `lib/export.ts`, build the same outer SVG and
   either:
   - For SVG export, emit the composed SVG directly.
   - For PNG export, rasterise via an offscreen canvas (the existing
     PNG path) but feed it the composed SVG.
4. Add `'none'` as a valid choice. Update the `FrameShape` segmented
   control.

**Unit tests:**
- `frame-shapes.test.ts` — for each shape, the inscribed square fits
  inside the path's bounding box (geometric assertion) and the QR
  data area never extends outside the frame at module level (a
  conservative bbox check).
- `export.test.ts` — composed SVG starts with `<svg` and contains
  exactly one nested `<g>` for the QR.

**E2E:** §4.4 (`frame-and-shape.spec.ts`) — pick each frame, assert
preview SVG has the frame `<path>`, download the SVG and assert the
file content also contains it.

**Risk:** non-trivial geometry. Land §F2 behind a dev branch; gate
on screenshot-free assertions only. Consider splitting into:
- `F2a` — refactor `QrPreview` to host an outer SVG (no behaviour
  change, frame still CSS).
- `F2b` — implement frame-shapes module + wire to preview.
- `F2c` — wire to export.
Each is independently mergeable.

---

#### F3. §8.2 — Wi-Fi auth picker rebuilt with `<SegmentedControl>`
**Files:** `apps/qrcode/src/content/forms.tsx`,
`apps/qrcode/src/__tests__/forms.test.tsx` (existing or new).

**Bug:** the `qr-segmented` class was never defined in `styles.css`;
the auth picker renders as raw browser buttons.

**Fix:** import `SegmentedControl` from `@aliv/ui`, supply
`options=[{value:'WPA',label:'WPA / WPA2'},{value:'WEP',label:'WEP'},
{value:'nopass',label:'None'}]`, drop the hand-rolled markup. Match
exactly the pattern in `content/ContentTabs.tsx`.

**Unit test:** snapshot the rendered control to verify it uses
`@aliv/ui`'s `[data-segmented]` attribute (or whatever the shared
component emits).

**E2E:** §4.2 (`content-types.spec.ts → "Wi-Fi auth uses the shared
segmented control"`) — assert the segmented control's role / data
attribute matches the one produced for content tabs.

---

#### F4. §1.1 — Export resolution distorts the live preview
**Files:** `apps/qrcode/src/components/ExportPanel.tsx`,
`apps/qrcode/src/lib/export.ts`,
`apps/qrcode/src/__tests__/ExportPanel.test.tsx` (new).

**Bug:** `qrRef.current.update({ width, height })` mutates the shared
preview instance to the export size and never restores it.

**Fix:** clone for export. In `lib/export.ts` add
`exportPng(stylingOptions, width)` and `exportSvg(stylingOptions)`
that build a **fresh** `new QRCodeStyling(...)` from the same
`toStylingOptions(...)`, render to buffer, return. `ExportPanel`
passes `options` (the source of truth) into those, never touches
`qrRef`.

**Unit test:** mock `QRCodeStyling`, assert the constructor is
called with the requested size and the existing preview ref's
`update` is **not** called during export.

**E2E:** §4.6 (`export.spec.ts → "exporting at 2048 doesn't change
the preview size"`) — read the preview SVG's `viewBox` before and
after a 2048 PNG export; assert unchanged.

---

#### F5. §1.3 — Calendar payload missing VCALENDAR envelope
**Files:** `apps/qrcode/src/content/builders/calendar.ts`,
`apps/qrcode/src/__tests__/calendar.test.ts`.

**Fix:** wrap with
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Aliv//qrcode//EN
BEGIN:VEVENT
UID:<crypto.randomUUID()>@aliv
DTSTAMP:<now in UTC>
SUMMARY:...
DTSTART:...
DTEND:...
END:VEVENT
END:VCALENDAR
```
Use `\r\n` line endings (RFC 5545).

**Unit test:** parse the output with a tiny ICS regex matcher (don't
add a runtime dep — `ical.js` only as devDep if needed; otherwise
match against a hand-rolled grammar). Assert envelope, UID format,
DTSTAMP format, that DTSTART < DTEND.

**E2E:** not needed — pure builder. But §4.2 still includes a smoke
test that switching to Calendar produces a non-empty preview.

---

### P1 — visible quality issues

#### F6. §1.2 — `Ctrl+1..6` shortcuts conflict with browser tabs
**Files:** `apps/qrcode/src/App.tsx`, `packages/ui` shortcut handler
if shared.

**Fix:** move to `Alt+1..6`. Update the shortcut definitions, the
shortcuts modal copy, and the docstring near `useShortcuts(...)`.

**E2E:** §4.8 (`shortcuts.spec.ts`) — press `Alt+2`, assert the
Colors rail becomes active. Press `Ctrl+2`, assert nothing changes
(rail stays where it was) — guards against the conflict ever coming
back.

---

#### F7. §1.4 — Logo drop zone has no keyboard activation
**Files:** `apps/qrcode/src/components/LogoUpload.tsx`.

**Fix:** add `onKeyDown` that calls `inputRef.current?.click()` on
`Enter` or `Space` (preventDefault on Space to avoid page scroll).

**Unit test:** `@testing-library` keyboard event triggers the click.

**E2E:** §4.5 (`logo.spec.ts → "drop zone is reachable & activatable
by keyboard"`) — Tab to the dropzone, press Enter, assert the file
chooser would be triggered. Playwright's `page.on('filechooser', …)`
catches it.

---

#### F8. §1.5 — Email body encodes spaces as `+`
**Files:** `apps/qrcode/src/content/builders/email.ts`,
`apps/qrcode/src/__tests__/email.test.ts`.

**Fix:** build the query string manually with `encodeURIComponent`
for `subject` and `body`. Concat as
`mailto:${to}?subject=${encS}&body=${encB}`.

**Unit test:** body containing `Hello world & Co.` round-trips to
`Hello%20world%20%26%20Co.` not `Hello+world+%26+Co.`.

---

#### F9. §1.6 — Export error message clobbered when QR isn't ready
**Files:** `apps/qrcode/src/components/ExportPanel.tsx`.

**Fix:** distinguish "withQr returned undefined because not ready"
from "operation returned undefined because failure". Either return a
`{ ok: boolean, error?: string }` discriminated union from `withQr`,
or check `qrRef.current` directly inside `handleCopy` before going
near `withQr`. Simpler: refactor `handleCopy` /`handleDownload` to
share an `ensureReady()` that early-returns the right message.

**E2E:** §4.6 — race: open the page, immediately click Copy PNG
before the engine settles (use `page.evaluate` to null the ref via a
test hook — or simpler, assert that the message after a successful
copy is "Copied!" and never "Clipboard not available", since the
clobber path produces the wrong message).

---

#### F10. §8.7 — Live preview claims "scannable" for invalid input
**Files:** `apps/qrcode/src/App.tsx`,
`apps/qrcode/src/components/QrPreview.tsx`,
`apps/qrcode/src/components/ScannabilityNotice.tsx`.

**Fix:** hoist the `built.ok` decision into `App.tsx`. When false:
- Pass `valid={false}` to `QrPreview`. The preview renders a faded
  placeholder ("Enter content to preview · fix the error to export").
- Pass `valid={false}` to `ScannabilityNotice`, which then renders
  *no badge* (or a "—" badge), never green "scannable".
- Disable Copy/Download buttons in `ExportPanel`.

**E2E:** §4.2 — pick Wi-Fi, leave SSID empty, assert
`qr-scannability-notice` does **not** contain text "scannable" and
that Copy PNG is `disabled`.

---

#### F11. §8.5 + §8.6 — Dead `data-shape` / `data-content-type` and
unstyled `qr-content-form` / `qr-tab-label` / `qr-segmented`.

**Fix:** delete the dead attributes (the simplest move) **except**
`data-content-type` which the existing e2e suite uses as a stable
selector — keep that one and document it, and either:
- Add CSS that paints the tiny preview indicator each label hints
  at; or
- Drop the `data-shape` attributes and the `qr-tab-label` /
  `qr-content-form` classes entirely.

Recommendation: **delete now, build later.** Cheaper, and the user's
review explicitly calls them rot. Open a follow-up issue for the
"tiny preview icons next to each shape label" if we want them.

**Unit test:** snapshot the relevant components to lock the cleanup.

---

#### F12. §8.9 — `data-app="qrcode"` missing on `<html>` at first paint
**Files:** `apps/qrcode/index.html`.

**Fix:** `<html lang="en" data-app="qrcode">`. Mirror the same change
in `apps/json-xml/index.html` (`json-xml`) and `apps/web/index.html`
(`web`) so the FOUC fix is uniform across apps.

**E2E:** §4.1 — on first navigation, assert
`document.documentElement.dataset.app === 'qrcode'` *before* the JS
bundle has had a chance to run (we evaluate it directly after
`page.goto` with `domcontentloaded` wait state; pre-existing logic in
`AppShell` would only set it after hydration).

---

### P2 — polish

#### F13. §1.7 — `currentPresetId` is never wired
**File:** `apps/qrcode/src/App.tsx`,
`apps/qrcode/src/settings/PresetGallery.tsx`.

**Fix:** track `currentPresetId` in `App` state. Set it on apply,
clear it on any manual control change (subscribe to `options`
changes via a `useEffect` that resets to `null` when the options
diverge from the preset).

**E2E:** §4.7 — apply preset, assert `is-current` class. Tweak a
color, assert the class disappears.

---

#### F14. §1.8 — "Reset to defaults" only resets QR options
**File:** `apps/qrcode/src/App.tsx`.

**Fix:** `handleReset` resets `options`, `contentMap`, `contentType`,
`userTouchedEc`, and `currentPresetId`.

**E2E:** §4.7 — apply preset, switch content type, type some text,
hit Reset; assert preview is back to default URL preview and no
preset is highlighted.

---

#### F15. §8.8 — Preset apply leaves stale `eyeColor`
**File:** `apps/qrcode/src/settings/presets.ts`.

**Fix:** `applyPreset` shallow-merges with explicit
`eyeColor: undefined` (or omits it from the merge). Equivalent: spec
every preset to include `eyeColor: undefined` so the merge clears.

**Unit test:** set a custom eye color, apply preset, assert
resulting options have `eyeColor === undefined`.

---

#### F16. §8.10 — Preset swatches don't represent the preset
**File:** `apps/qrcode/src/settings/PresetGallery.tsx`.

**Fix:** render a static 64×64 SVG QR per preset (use
`createQr(...)` with a fixed sample payload, e.g. `'Aliv'`,
`getRawData('svg')`, render once via `useMemo`, cache for the life of
the app). Replace the 1-color swatch.

**Unit test:** snapshot one preset card; assert it contains an
`<svg>` of the expected size.

---

#### F17. §8.11 — `optionsRef` sync effect with no deps
**File:** `apps/qrcode/src/hooks/useQrPreview.ts`.

**Fix:** assign in render body: `optionsRef.current = options;`. Add
a comment that this is intentional and equivalent to the prior
no-deps effect, minus the post-commit churn.

---

#### F18. §8.12 — No "no frame" option
**File:** rolled into F2 (frame shapes ship with `'none'`).

---

#### F19. §3.4 — Reconcile autoBump (>0.2) and scannability (>0.3)
thresholds.
**Files:** `apps/qrcode/src/lib/scannability.ts`,
`apps/qrcode/src/App.tsx`.

**Fix:** adopt 0.20 as the single threshold and update the
scannability assessor accordingly. Document the choice in a comment
referencing the `qr-code-styling` recommended max logo size of 30%
of the QR area minus quiet zone.

---

#### F20. §3.5 — Drop `size` from preset options
**File:** `apps/qrcode/src/settings/presets.ts`.

**Fix:** the type already says `Omit<QrOptions, 'data' | 'logo'>`,
but the runtime values still include `size: 280`. Strip it; a future
size control then gets to keep its value across preset application.

---

#### F21. §4 — A11y polish (modal scroll lock, focus trap, autoFocus,
aria-live, hex input).
- `FaqLauncher` body-scroll lock: toggle
  `document.body.style.overflow = 'hidden'` on open.
- Focus trap: use the small focus-trap helper that already exists in
  `packages/ui` (or `focus-trap-react` if not — adds 2 KB; verify
  before introducing).
- `autoFocus` on first input: pass `autoFocus` to the first input in
  every `forms.tsx` form, or call `firstInputRef.current?.focus()`
  in `ContentEditor` after a tab change.
- `ScannabilityNotice` `role="status"` so SR announces changes.
- `ColorPicker` hex draft state: keep typed value local until blur or
  Enter; only commit on those events.

**E2E:** §4.9 covers each.

---

#### F22. §2.x — Validators and form semantics
Functional / payload polish: §2.1 (cal end<start), §2.2 (label
calendar UTC), §2.3 (rename ADR), §2.4 (geo defaults empty), §2.5
(deny `javascript:`/`data:`/`file:`), §2.6 (`required` /
`aria-invalid` on form inputs).

**Tests:** add a `validators.test.ts` per builder (most exist; just
extend). E2E covers form behaviour at the integration level (§4.2,
§4.9).

---

### P3 — defence in depth, perf (out of scope for 0.2 unless time)

- §5 — DOMParser-based SVG sanitisation in `logo-utils.ts`.
- §3.1 — `LogoControls` re-clip dedupe.
- §3.2 — drop redundant 50ms initial `update()` in `useQrPreview`.
- §6 — bump preview debounce to 120-150ms for textarea inputs.
- §6 — coalesce localStorage writes for recent-colors.

These are scheduled but **not blocking** the 0.2 release. Each gets
its own ticket.

---

## 4. End-to-end test battery

All paths are inside `packages/e2e/tests/qrcode/`. Each spec opens
the qrcode preview server (already configured in
`playwright.config.ts:31`) and uses the `QrcodePage` helper from
§4.0.

Conventions:
- `test.beforeEach(...)` does `await qr.goto()`.
- No spec depends on another. Every spec sets its own state.
- Console errors are captured via `page.on('console', ...)`. Any
  `error` (not warning) fails the test.

### 4.0 `QrcodePage` helper (single source of selectors)

```ts
export class QrcodePage {
  constructor(public readonly page: Page) {}
  async goto() { await this.page.goto(APP_URLS.qrcode); /* wait for preview */ }
  preview()  { return this.page.getByTestId('qr-preview-canvas'); }
  rail(id: string) { return this.page.locator(`[data-rail-id="${id}"]`); }
  selectRail(id: string) { return this.rail(id).click(); }
  setContentType(id: string) { return this.page.locator(`[data-content-type="${id}"]`).click(); }
  scannabilityText() { return this.page.getByTestId('qr-scannability-notice').innerText(); }
  exportFeedback() { return this.page.getByTestId('qr-export-feedback').innerText(); }
  async download(format: 'png'|'svg', resolution?: 512|1024|2048) { /* ... */ }
  // ... etc
}
```

The helper is the only place selectors live. Every spec calls
methods, never raw locators.

---

### 4.1 `smoke.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| S1 | First paint sets `data-app="qrcode"` on `<html>` | `documentElement.dataset.app` is `qrcode` after `domcontentloaded` (covers F12 / §8.9) |
| S2 | Preview renders within 2 s | `getByTestId('qr-preview-canvas')` contains a non-empty `<svg>` with `<rect>`s |
| S3 | No console errors on initial load | `page.on('console', e => e.type()==='error')` collects nothing |
| S4 | Tabs through chrome reach the rail without trap | sequential `page.keyboard.press('Tab')` lands on each rail item in order |
| S5 | Lighthouse-ish bundle smell — first request resp size of `index.html` < 10 KB | sanity; quick failure when an inline regression slips in |

### 4.2 `content-types.spec.ts`

For each of the 9 content types (URL, text, email, phone, SMS,
vCard, Wi-Fi, geo, calendar) — a parameterised test:

| # | Test | Asserts |
|---|------|---------|
| C1.{type} | Switching to {type} renders the form | the type-specific first input (e.g. SSID, To, latitude) is visible |
| C2.{type} | Filling minimum valid fields produces a preview | preview SVG contains `<rect>` modules; no error message; scannability notice contains `scannable` (covers F10 by complement) |
| C3.{type} | Clearing required fields removes "scannable" | scannability notice does NOT contain `scannable` (F10) |
| C4 | Wi-Fi auth picker uses the shared segmented control | the auth picker has the same `data-segmented` / `[role="radiogroup"]` markup as `ContentTabs` does (F3 / §8.2) |
| C5 | Calendar payload contains VCALENDAR envelope | switch to Calendar, fill, then read the QR data via a hidden `<textarea data-testid="qr-content-debug">` (added in dev only, gated by `import.meta.env.DEV` — alt: scan via jsQR in test) and assert the string starts with `BEGIN:VCALENDAR`. Cheaper alt: rely on unit tests for envelope; e2e only asserts the form accepts valid input. (F5 / §1.3) |
| C6 | Email body uses `%20` for spaces | similar approach to C5 — read the encoded data, assert no `+`-encoded spaces. (F8 / §1.5) |
| C7 | Calendar end before start surfaces an error | error message is visible, scannable badge gone (F22 / §2.1) |
| C8 | URL input rejects `javascript:` | error visible, scannable badge gone (F22 / §2.5) |
| C9 | Empty SSID announces invalid via `aria-invalid` | the SSID input has `aria-invalid="true"` (F22 / §2.6) |

For C5/C6: it's worth adding a `data-qr-data` attribute on the
preview wrapper that mirrors the current QR's encoded string, gated
to dev/test builds only. Keeps the e2e simple without parsing the
SVG.

### 4.3 `colors.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| K1 | Solid → linear gradient → solid leaves no `<linearGradient>` | preview SVG queried with `locator('linearGradient,radialGradient')` count is 0 after the round-trip (F1 / §8.1) |
| K2 | Solid → radial gradient → solid leaves no `<radialGradient>` | symmetric to K1 (F1) |
| K3 | Background gradient ↔ solid round-trip | same assertion for the background fill (F1) |
| K4 | Hex input doesn't commit on every keystroke | type `#abcde` slowly; assert preview foreground stays at the previous color until the input is blurred (F21 / hex draft state) |
| K5 | Recent colors persist across reload | set fg to `#ff00aa`, reload, recent palette includes `#ff00aa` |
| K6 | Eye color override clears when applying a preset | set eye color, apply preset, assert eye modules render in the preset's foreground color (F15 / §8.8) — pixel sample on the SVG, not visual |

### 4.4 `frame-and-shape.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| FS1 | Selecting each frame shape updates the preview SVG `<path>` | the outer `<path>` `d` attribute changes per shape; QR module bbox stays inside the path bbox (F2) |
| FS2 | "None" frame yields a square QR with no surrounding path | (F2 / F18) |
| FS3 | Module shapes (square/dots/rounded/extra-rounded/classy) each change the preview | for each: snapshot the first `<rect>`/`<circle>`'s `tagName` |
| FS4 | Eye frame and eye ball shapes apply | similar — assertion on the corner-marker subtree |
| FS5 | `data-shape` attributes are gone (or styled, depending on F11) | `locator('[data-shape]').count()` is 0 (cleanup path) |

### 4.5 `logo.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| L1 | Drop zone activates with Enter | tab to dropzone, `page.keyboard.press('Enter')`, assert `filechooser` event fires (F7 / §1.4) |
| L2 | Drop zone activates with Space | same with Space; preventDefault means page didn't scroll (F7) |
| L3 | Uploading sample-logo.png embeds it | preview SVG contains an `<image>` with a `data:image/png;base64,…` href |
| L4 | Logo > 20% bumps EC and shows banner | preset a small QR size + a large logo via the size slider; assert EC select reads `H`, banner is visible (F19 / §3.4) |
| L5 | User picks EC=L manually, banner remains as a hint | not an error, but the banner copy reflects the manual choice (F19) |
| L6 | Invalid SVG (script tag) is rejected | upload a fixture SVG containing `<script>`, assert error toast and no `<image>` in the preview |
| L7 | Logo shape clip applies | switch from square → circle, assert the clipping path id changes |

### 4.6 `export.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| X1 | PNG @ 1024 downloads with correct filename | `download.suggestedFilename()` ends `.png`; buffer header bytes are PNG (`89 50 4E 47`) |
| X2 | PNG @ 2048 doesn't change the preview size | record preview SVG `viewBox` width before; download; assert `viewBox` after equals before (F4 / §1.1) |
| X3 | PNG buffer dimensions match the requested resolution | parse PNG IHDR; width === 2048 (F4) |
| X4 | SVG download contains the frame `<path>` | for `frameShape='circle'`, the SVG file contains the same path the preview shows (F2) |
| X5 | Copy-to-clipboard reports "Copied!" not "Clipboard not available" | covers F9 / §1.6 |
| X6 | Two consecutive PNG exports at different resolutions both succeed | regression for F4 — second export's bytes match its requested resolution, not the first |
| X7 | Export feedback uses `qr-export-feedback` testid | for stability across UI tweaks |

### 4.7 `presets.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| P1 | Apply preset adds `is-current` class to its card | (F13 / §1.7) |
| P2 | Tweak a color → `is-current` is removed | (F13) |
| P3 | Reset clears preset highlight, content type, typed content, and options | (F14 / §1.8) |
| P4 | Preset cards render a static QR thumbnail | each `qr-preset-card` contains an `<svg>` (F16 / §8.10) |
| P5 | Apply preset clears stale eye color | set eye, apply preset, assert eye color matches preset foreground (F15 / §8.8) |

### 4.8 `shortcuts.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| K1 | `Alt+1` switches to Content rail | rail-id `content` has `is-active` (F6 / §1.2) |
| K2 | `Alt+2` switches to Colors rail | (F6) |
| K3 | `Alt+3..6` switch to Shape, Logo, Frame, Export rails | (F6) |
| K4 | `Ctrl+1..6` no longer hijack rails | press `Ctrl+2`, assert active rail unchanged (F6) |
| K5 | `?` opens the shortcuts modal; Escape closes it | basic modal contract |
| K6 | Body scroll is locked while FAQ modal is open | open modal, assert `document.body.style.overflow === 'hidden'` (F21 / §4) |
| K7 | Tab inside FAQ modal cycles within the modal | Tab repeatedly, the focused element is always inside the modal (F21 / focus trap) |
| K8 | Escape inside FAQ modal closes it and restores focus to the launcher | (F21) |

### 4.9 `a11y.spec.ts`

| # | Test | Asserts |
|---|------|---------|
| A1 | Initial page passes axe-core (no `serious` / `critical`) | uses `@axe-core/playwright` |
| A2 | Each rail panel passes axe-core | iterate rails, run scan |
| A3 | First input in each content form receives focus when its tab activates | (F21 / autoFocus) |
| A4 | `ScannabilityNotice` has `role="status"` and updates announcement on state change | (F21 / aria-live) |
| A5 | Required form fields have `aria-required` | (F22 / §2.6) |
| A6 | Invalid required fields gain `aria-invalid="true"` | (F22) |
| A7 | Logo dropzone has `aria-label` | (existing chrome) |
| A8 | Color contrast on the chrome passes axe-core | (chassis sanity, not a fix from REVIEW but cheap to check) |

---

## 5. Order of execution

Each phase is a single mergeable PR. Within a phase, commits land in
the order listed.

**Phase A — test rails (1 PR)**
- 2.1 split spec, 2.2 helpers, 2.3 axe dep, 2.4 testids in source.
- The new specs are skeletons (`test.skip`) at first; nothing fails.
- Goal: green CI before the fixes start landing.

**Phase B — P0 fixes**
1. F1 (§8.1)
2. F4 (§1.1)
3. F3 (§8.2)
4. F5 (§1.3)
5. F2 in three sub-PRs (F2a, F2b, F2c).

After each, un-skip the matching tests in the §4 specs.

**Phase C — P1 fixes**
6. F6 (§1.2)
7. F7 (§1.4)
8. F8 (§1.5)
9. F9 (§1.6)
10. F10 (§8.7)
11. F11 (§8.5/§8.6)
12. F12 (§8.9)

**Phase D — P2 polish**
13. F13–F22 in their listed order. Each can be its own commit; small
    enough to bundle 2–3 per PR.

**Phase E — P3 deferred**
- Open one ticket each. Not blocking 0.2.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| F2 (frame composition) breaks PNG rasterisation cross-browser | M | H | Land F2a (refactor only) first; gate F2b/F2c behind a feature flag for one phase |
| Re-instantiating QR in F1 thrashes layout | L | M | Only on `foreground.type` / `background.type` / `logo` toggle; debounce already 50 ms |
| `data-qr-data` debug attribute leaks to prod | M | L | Gate behind `import.meta.env.DEV`; add a unit test that the attribute is absent in a prod build (parse `dist/index.html` after `pnpm build`) |
| axe-core finds latent issues in shared chrome | M | M | Limit A1/A2 to qrcode-specific rules; chrome scans go to a separate, advisory-only spec |
| Playwright suite runtime balloons | M | M | The 9-file split parallelises; cap suite to 5 min on CI |
| Frame export at 2048 px is slow | L | M | Cache the frame path SVG; rasterise via OffscreenCanvas |

---

## 7. Acceptance checklist

- [ ] All 22 fix items (F1–F22) addressed or explicitly punted with a
      ticket.
- [ ] All 9 e2e specs landed and passing on chromium.
- [ ] `pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm -r build`
      green.
- [ ] `pnpm e2e` green; total wall-clock under 5 min on CI.
- [ ] `apps/qrcode/REVIEW.md` annotated with commit refs (or moved
      to `docs/archive/REVIEW-2026-05-10.md`).
- [ ] No new permission prompts when running unit tests; no new
      runtime deps over 5 KB without comment.
- [ ] CLAUDE.md test totals updated:
  - `@aliv/qrcode` unit tests: 124 → ~145+
  - `@aliv/e2e`: 25 → ~80+ specs
