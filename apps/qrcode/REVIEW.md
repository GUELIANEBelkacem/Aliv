# QR Code App — Bug & Quality Review

Branch: `phase/0.1-preflight` · Source: `apps/qrcode/src/**`
Date: 2026-05-10

All checks pass: typecheck clean, lint clean, 129/129 unit tests green. The
bugs aren't in test coverage — they're in interaction flows the tests don't
model.

> **Round 2 update.** After the user reproduced three more issues
> (radial→solid sticking, raw Wi-Fi auth buttons, and "Circle" frame not
> reshaping the QR), I did a second pass and found a chain of related
> bugs around the foreground fill, the frame shape, dead/undefined CSS
> classes, and the broken export-vs-preview parity. **See §8.**

## 1. Critical bugs (visible to users)

### 1.1 Export resolution permanently distorts the live preview
`components/ExportPanel.tsx:40`
```ts
qrRef.current.update({ width: px, height: px });
await withQr((qr) => downloadPng(qr, getFilename()));
```
`qrRef` is the **same** `QRCodeStyling` instance the preview hook owns.
Calling `update({ width: 2048, height: 2048 })` mutates the live preview to
2048×2048 and never restores it. The preview hook's debounced effect only
rebuilds when `options` change — so until the user toggles a control, the
on-screen QR stays the export size. Worse, the next "Copy PNG" or another
export will use whatever resolution was last selected, not what the panel
shows.

**Fix:** clone styling for export (`new QRCodeStyling(...)` from
`qr-engine.toStylingOptions`), or save/restore size around the export.

### 1.2 `Ctrl+1..6` shortcuts conflict with the browser
`App.tsx:139-150`
```ts
keys: `Ctrl+${idx + 1}`, ...
```
On Chrome/Firefox/Edge, `Ctrl+1..9` switches browser tabs. The handlers
register but the OS-level handler wins on most installs — users see the
documented "Switch to Colors" shortcut do nothing (or switch tabs). Either
drop these or move to `Alt+1..6` / `Ctrl+Shift+1..6`.

### 1.3 ICS calendar payload is missing the VCALENDAR envelope
`content/builders/calendar.ts:29-37`

The output is just:
```
BEGIN:VEVENT
SUMMARY:...
DTSTART:...
DTEND:...
END:VEVENT
```
RFC 5545 requires a `BEGIN:VCALENDAR / VERSION:2.0 / PRODID:- // ... // EN /
... / END:VCALENDAR` wrapper plus `UID` and `DTSTAMP` on the event. Most
phone calendar apps will refuse to import what is currently generated. iOS
in particular tends to silently fail.

### 1.4 Logo drop zone has no keyboard activation
`components/LogoUpload.tsx:38-42`
```tsx
<div role="button" tabIndex={0} onClick={...}>
```
Has `role="button"` and is tabbable, but no `onKeyDown`. Enter/Space do
nothing — fails WCAG 2.1.1. Add `onKeyDown` that calls
`inputRef.current?.click()` for Enter/Space.

### 1.5 Email "body" encodes spaces as `+`, not `%20`
`content/builders/email.ts:8-12` uses `URLSearchParams`. RFC 6068 says
`mailto` query encodes spaces as `%20`; `+` may be taken literally by some
Mail apps. Build the `?subject=...&body=...` manually with
`encodeURIComponent`.

### 1.6 Export error message gets clobbered when QR isn't ready
`components/ExportPanel.tsx:19-30, 49-57`

When `qrRef.current` is null, `withQr` sets `error = "QR not ready yet…"`
and returns `undefined`. `handleCopy` then checks `if (ok)` (undefined →
falsy) and overwrites with `"Clipboard not available in this browser."` —
completely misleading.

### 1.7 `currentPresetId` is never wired up
`App.tsx` passes `<QrSettings onApplyPreset=… onReset=…>` without
`currentPresetId`. `PresetGallery` reads it
(`presets/PresetGallery.tsx:12`) and has CSS for `.qr-preset.is-current`,
but the user never sees which preset is active. Either track the last
applied preset id in App state, or remove the prop.

### 1.8 Settings → "Reset to defaults" only resets QR options
`App.tsx:111-114` (handleReset) resets `options` but leaves `contentMap`,
`contentType`, and the typed content untouched. The label promises a full
reset; the behaviour is partial.

## 2. Functional / payload bugs

### 2.1 Calendar event accepts `end < start`
No validation in `buildCalendar`. Add a comparison after both dates parse.

### 2.2 `datetime-local` → UTC silently shifts timezone
`calendar.ts:9-13` parses the local-time string via `new Date(iso)` and
emits UTC with a `Z`. Correct per RFC, but the form gives no hint that
"10:00" the user typed becomes UTC. Either label it ("in your local
timezone") or output floating time (no `Z`).

### 2.3 vCard ADR collapses the address into the street field
`vcard.ts:31`: `ADR;TYPE=HOME:;;${street};;;;`. Acceptable for v1 but
loses city/region/postcode structure. Either split the form into 4
fields, or rename the input "Street address" to set expectations.

### 2.4 Geo defaults to `lat:0, lon:0` (the ocean)
`content/defaults.ts:11`. When the user opens Geo for the first time, the
QR encodes a valid-but-useless point. Either default to empty and require
both, or default to a recognisable city.

### 2.5 URL validator accepts any RFC-3986 scheme
`url.ts:8` matches `^[a-z][a-z0-9+\-.]*:`. So `javascript:alert(1)` builds
a valid QR. Not exploitable on its own (the QR scanner is what would
execute it), but a denylist beyond `mailto:`/`tel:` would be friendlier:
drop `javascript:`, `data:`, `file:`.

### 2.6 Form fields are not marked `required`
None of the inputs in `content/forms.tsx` use `required` / `aria-invalid`.
Validation is centralized in the builders and surfaced as a hint at the
bottom of the panel, but native form semantics are missing — screen
readers won't announce a missing SSID as invalid.

## 3. State / effect correctness

### 3.1 `LogoControls` re-clips on first mount unnecessarily
`components/LogoControls.tsx:23-32`: `useState(logo?.src)` then an effect
runs on `[logo?.shape, original]` and re-clips. On the very first render
with an existing logo, this rebuilds the dataURL even though nothing
changed → one extra `onChange` cycle. Track an "originalSrc → clippedSrc"
map and skip when no real change.

### 3.2 `useQrPreview` schedules a redundant update on mount
`hooks/useQrPreview.ts:37-45` always queues a 50ms `update()` on the first
render even though `createQr` just rendered the same options. Cheap, but
doubles initial CPU during StrictMode double-mount.

### 3.3 `autoBump` flips off the moment the user manually picks any EC
`App.tsx:75, 91, 101-104`: the autoBump warning is suppressed as soon as
`userTouchedEc` is true, even if the user picked a lower EC than auto did
(e.g. M with a 28% logo). The Scannability assessor doesn't currently
fail on "big logo + low EC < 30% threshold" until the logo is >30% — see
§3.4. Suggest: keep showing the auto-bump banner with new copy ("You
chose L; logos > 20% normally need H").

### 3.4 Scannability check uses logo > 0.3 but autoBump uses logo > 0.2
`lib/scannability.ts:38` vs `App.tsx:29`. Two thresholds for the same
concept. Pick one.

### 3.5 `applyPreset` overwrites `size`
`settings/presets.ts:83-88`: presets carry a `size: 280`. If a future
build adds a size control, every preset will silently snap the canvas
back to 280 — confusing. Drop `size` from `Preset['options']` (which the
type already says: `Omit<QrOptions, 'data' | 'logo'>` — but the value
still includes it).

## 4. A11y & UX

- **Modal scroll lock missing.** `FaqLauncher.tsx` doesn't lock body
  scroll when open; the underlying page scrolls behind the modal.
- **Focus trap missing in FAQ modal.** Tab can exit the modal.
- **`autoFocus` missing on the first input.** Each content type's first
  field should auto-focus when switching tabs (or after a preset apply).
- **No screen-reader announcement on scannability change.** The badge
  appears but `ScannabilityNotice` has no `aria-live`. Add `role="status"`
  to the Banner.
- **Hex input rewrites on every keystroke.** `ColorPicker.tsx:91-94`
  calls `commit` on every keystroke. Typing past 6 chars commits on the
  6-char prefix then mutates again. Better: validate on blur / Enter,
  keep draft until then.
- **Recent-colors persistence is shared across solid / stop1 / stop2 /
  background / eye.** Probably desired, but no UI hint that colors are
  saved locally — small "Clear recent" affordance would help.
- **Preview canvas stretches inside the circle frame stage.**
  `.qr-preview-stage[data-frame="circle"] .qr-preview { width: 100%;
  height: 100%; display: flex; }` (`styles.css:151-159`) blows up the
  preview wrapper to the stage's aspect-ratio: 1 — but the canvas inside
  is fixed at the configured `size`. On wide viewports the wrapper is
  large and the QR is small + offset.

## 5. Security / defensive code

- **SVG sanitisation is regex-based.** `lib/logo-utils.ts:20` blocks
  `<script`, `<foreignObject`, `xlink:href=https?:`. Real attackers can
  use `<image href="…">`, `<use href="data:…">`, `xlink:href=  '…'`
  (extra whitespace), entity-encoded payloads, etc. Either parse with
  DOMParser and walk the tree, or whitelist a tiny tag list. The QR
  generator embeds the SVG inside its own SVG output — XSS-relevant if
  someone publishes the SVG to a site that renders it inline.
- **`crossOrigin: 'anonymous'`** is set on the embedded image but the
  source is always a `data:` URL — flag is moot. Cosmetic.
- **No CSP recommendations** in `index.html` for an app that loads
  untrusted user images.

## 6. Performance / bundle

- **`qr-code-styling` is fully eager.** Per CLAUDE.md the json-xml budget
  is the known overshoot; qrcode is fine at 86 KB gzipped, but the same
  lazy strategy (dynamic import) would let the page render before the
  engine arrives.
- **Preview re-creation churn.** Every keystroke into the URL field
  rebuilds the SVG (`useQrPreview` debounces 50ms). For long vCards this
  is noticeable. Consider bumping debounce to 120-150ms for text/textarea
  inputs.
- **Recent-colors localStorage write on every commit** — minor; coalesce.

## 7. Tests — what's covered vs what isn't

The 129-test suite covers builders, colour math, qr-engine option
mapping, scannability thresholds, presets, content tabs, shapes, tagline,
FAQ launcher and the App-level integration. Nothing tests:

- Export resolution side-effect on preview (§1.1)
- Calendar payload validity against an ICS parser (§1.3)
- Email body encoding (§1.5)
- Logo drop keyboard a11y (§1.4)
- Shortcut handler vs browser conflict (§1.2)
- "Reset to defaults" scope (§1.8)

Each of those would catch the corresponding bug if added.

## 8. Round-2 findings (the ones the first pass missed)

### 8.1 Switching foreground from gradient → solid keeps the gradient
**Reported by the user, confirmed.** `lib/qr-engine.ts:32-46`

```ts
function fillToOptions(fill: ColorFill) {
  if (fill.type === 'solid') return { color: fill.color };
  // gradient cases return { gradient: {...} } — note: no `color` key.
  ...
}
```

`qr-code-styling`'s `update()` method does a deep-merge that **skips
`undefined`** — so:

- gradient → solid: the new options have `{ color: '#xxx' }` but **no**
  `gradient` key. The previously-stored `gradient` survives the merge,
  and the library prefers gradient when both are present. The QR keeps
  rendering with the old radial.
- solid → gradient: symmetric, but less visible because the new
  gradient does set `gradient` and the library happens to honour it.
  Still: the stale `color` lingers on the merged options object.

The unit test `qr-engine.test.ts:23-30` checks the *output* object — it
correctly says `gradient` is undefined. The bug lives one layer deeper,
in qr-code-styling's `mergeDeep`. So this passed CI but is broken in the
browser.

**Fix options, in order of robustness:**
1. Re-instantiate the QR (`createQr(opts)`) when `foreground.type`
   changes — switch the ref, append a fresh canvas. This is what
   `useQrPreview` should do for any "structural" change.
2. Pass both keys explicitly in `fillToOptions`:
   ```ts
   if (fill.type === 'solid') {
     return { color: fill.color, gradient: undefined };
   }
   return { color: undefined, gradient: {...} };
   ```
   Likely insufficient — mergeDeep skips `undefined`. May need `null`,
   or directly mutate `qr._options.dotsOptions.gradient = null` (brittle).
3. Add a regression test that calls `updateQr` twice and inspects the
   resulting SVG (`getRawSvg`) to assert no `<linearGradient>` /
   `<radialGradient>` element remains after switching to solid.

### 8.2 Wi-Fi auth picker renders as raw browser buttons
**Reported by the user, confirmed.** `content/forms.tsx:43-49`

```tsx
<div className="qr-segmented" role="radiogroup">
  {auths.map((a) => (
    <button role="radio" aria-checked={...} className={...}>{a}</button>
  ))}
</div>
```

The class `qr-segmented` **is never defined in `styles.css`**. (Searched
the whole stylesheet — zero matches.) Every other "segmented" picker in
the app (content tabs, EC level, fill type, frame, modules, eye frame,
eye ball, logo shape, resolution) uses `<SegmentedControl>` from
`@aliv/ui`. This one was hand-rolled and the styles were never written.

Result: WPA / WEP / nopass appear as plain grey-on-white system buttons,
out of place against the dark glass UI.

**Fix:** rewrite using `@aliv/ui`'s `SegmentedControl<WifiAuth>` exactly
the way `ContentTabs.tsx` does — drop the hand-rolled markup entirely.

### 8.3 Frame "Circle" only restyles the card; the QR stays square
**Reported by the user, confirmed.** `components/QrPreview.tsx:13-17`,
`styles.css:151-159`

The frame shape is implemented purely as CSS on the white card behind
the QR:
```css
.qr-preview-stage[data-frame="circle"] { aspect-ratio: 1; }
.qr-preview-stage[data-frame="circle"] .qr-preview {
  border-radius: 50%;
  width: 100%; height: 100%;
}
```
The 280×280 QR module grid sits inside, untouched. Two consequences:

- Geometry: a square of side 280 needs a circle of diameter
  280·√2 ≈ 396 to fit *inside* it. The card is sized to the QR, not the
  other way around — so the visual "circle" is just a circular pad
  behind a square QR.
- The frame **is never exported**. `qr-engine.ts:toStylingOptions` does
  not read `opts.frameShape`, so PNG/SVG downloads come out as a plain
  square QR with no frame at all. The user picks "Rounded" or "Circle",
  the preview hints at it, the file delivers nothing.

The user explicitly asks for a frame shape that **the entire QR fits
inside** — e.g. "butterfly". Two ways to deliver that:

1. **SVG composition at export time.** Compose the qr-code-styling SVG
   inside an outer SVG that draws the chosen frame as a `<path>` and
   inscribes the QR via `<g transform="translate(…) scale(…)">`. The
   frame becomes part of the file. Adds ~50-100 lines in `lib/export.ts`
   and a frame-path module.
2. **qr-code-styling extension callback.** v1.9 supports
   `applyExtension(svg => …)` to mutate the output SVG. Same end result,
   tighter coupling to the lib.

Either way, the fix needs to:
- Compute a frame path big enough to inscribe the QR (with a small
  safety margin so the corners are inside).
- Apply the frame to **both** preview and export so what users see is
  what they get.
- Probably ship 4-6 named shapes — square / rounded / circle / hex /
  badge / blob — instead of "butterfly" specifically. (A literal
  butterfly silhouette is hard to inscribe a square in cleanly; a
  rounded badge or scallop is closer to what users mean when they want a
  decorative non-square frame.)

### 8.4 Frame shape isn't honoured by the export at all
Direct corollary of §8.3 but worth calling out as its own bug. The
preview promises a circle/rounded background; the file is always a
plain square QR. Anyone downloading and printing will be surprised.

### 8.5 Dead `data-shape` and `data-content-type` attributes
`components/ShapeControls.tsx:55,69,83,97` and
`content/ContentTabs.tsx:28` set `data-shape` / `data-content-type` on
label spans, presumably so CSS could draw a tiny preview icon next to
each label. **No CSS rule targets either attribute.** Either build the
visual previews (a small square / circle / dot beside each label is the
fastest win), or remove the attributes.

### 8.6 Unstyled class names referenced in JSX
- `qr-content-form` — `App.tsx:174` — wrapper for the active form. No
  matching rule in styles.css; it's just an empty div.
- `qr-tab-label` — `content/ContentTabs.tsx:30` — the visible tab text.
  No matching rule. Means the responsive "hide-label-on-narrow" trick
  the wrapper hints at can't fire.
- `qr-segmented` — see §8.2.

These are all rot from a refactor that pulled CSS into the shared
`@aliv/ui` package without removing the orphan local class names.

### 8.7 Live preview always says "scannable" even when input is invalid
`App.tsx:93-97` substitutes `' '` (space) for invalid content so the
preview keeps drawing **a real QR for a single space**. The
`ScannabilityNotice` checks contrast, not data validity, so it keeps
saying *"Live preview · scannable"* in green underneath, while the form
shows a red error.

The user sees: working QR + green "scannable" + red form error. They
think it's safe to download.

**Fix:** when `built.ok === false`, render a placeholder ("Enter
content to preview") instead of a fake QR, OR render a faded/disabled
QR with a "Preview only — fix the error before exporting" badge.

### 8.8 Preset apply leaves `eyeColor` override sticking
`settings/presets.ts:83-88` — `applyPreset` spreads
`...preset.options` on top of `current`. Presets never set `eyeColor`,
so a user who set a custom eye color and then clicks "Sunset Gradient"
keeps their old eye color over the new theme. Either include
`eyeColor: undefined` in every preset, or have `applyPreset` clear it
explicitly.

### 8.9 No `data-app="qrcode"` on `<html>` at first paint
`index.html:2` ships `<html lang="en">` with no `data-app`. The shared
`AppShell` sets `document.documentElement.dataset.app = 'qrcode'` in a
`useEffect`, after first paint. That means the accent-coloured CSS
(`var(--accent)`) is unset for the initial frame. Visible as a flash of
default-coloured leaf logo / focus rings. Add `data-app="qrcode"` to
the index.html `<html>` tag.

### 8.10 Preset swatches don't represent the preset
`settings/PresetGallery.tsx:13-29` — each preset shows a single
foreground-coloured square with the background colour as a border. For
"Mono Dots" vs "Rounded Pastel" the swatch can't tell you whether you
get dots or rounded modules. Render a tiny static QR for each preset
instead (cheap — `qr-code-styling` can produce a 64×64 PNG offline).

### 8.11 `optionsRef` sync effect runs every render with no deps
`hooks/useQrPreview.ts:18-20` — `useEffect(() => { optionsRef.current
= options; })` with no deps array runs after every commit. Functional
but wasteful and unusual. Simplest fix: assign in render body
(`optionsRef.current = options;`) or use `useLayoutEffect` with deps
`[options]` for clarity.

### 8.12 No "no frame" option
There's no way to turn off the decorative frame. Combined with §8.4
(frames don't export anyway), the dropdown does almost nothing — but
once you fix the export to honour it, users will want a "None" option
back.

## Recommended fix order

**P0 — broken core flows (do first):**
1. §8.1 — gradient → solid sticking. Re-instantiate QR on fill-type
   change and add a regression test.
2. §8.4 / §8.3 — frame shape isn't exported and "Circle" doesn't actually
   inscribe the QR. Move frame rendering into the SVG that gets exported,
   ship 4-6 frame shapes the QR fits inside, drop the CSS-only fake.
3. §8.2 — Wi-Fi auth picker rebuilt with `<SegmentedControl>`.
4. §1.1 (round 1) — export resolution distorting the preview.
5. §1.3 — calendar payload missing VCALENDAR envelope.

**P1 — visible quality issues:**
6. §1.2 — Ctrl+1..6 conflict (move to Alt or Ctrl+Shift).
7. §1.4 — keyboard activation on logo drop.
8. §1.5 / §1.6 — email body encoding + error-message clobber.
9. §8.7 — stop showing "scannable" for placeholder data.
10. §8.5 / §8.6 — kill or implement the dead `data-shape` /
    `qr-content-form` / `qr-tab-label` / `qr-segmented` rules.
11. §8.9 — `data-app="qrcode"` on `<html>` to remove FOUC.

**P2 — polish:**
12. §1.7 / §1.8 — preset highlight + full reset scope.
13. §8.8 — preset apply clears `eyeColor`.
14. §8.10 — preset swatches show a real mini-QR.
15. §8.11 / §8.12 — `optionsRef` cleanup, "None" frame option.
16. §3.x / §4 — autoBump / scannability threshold reconciliation,
    a11y polish, focus traps.
17. §5 — DOMParser-based SVG sanitisation (defence-in-depth).
