# QR Code App — Logo / Shape / Advanced Refresh Plan

Branch: `phase/0.1-preflight`
Date: 2026-05-20

This plan covers four changes the user asked for, in order:

1. **R1.** Logo **size** becomes a 4-step segmented control (S / M / L / XL),
   not a slider. Padding and shape stay where they are.
2. **R2.** Bug: at high logo padding the logo collapses to zero, then
   reappears in the bottom-right corner. Investigate and fix.
3. **R3.** Hide error-correction (EC) controls behind an **Advanced**
   menu. EC switches fully automatically by default; expose manual
   override only on demand, and warn when the manual choice is unsafe
   for the current logo / padding combination.
4. **R4.** Move the QR (Quick Response) code's quiet zone slider out of
   the Format section into the Shape section, rename it **Padding**, and
   make it auto-bump EC just like the logo size does — unless Advanced
   manual mode is on.

Each section below is split into **Analysis** (why and what) and
**Implementation** (files, names, tests).

---

## 0. Working agreement

- One conventional commit per requirement; each commit lands its own
  unit + e2e coverage.
- The four requirements are ordered so each phase compiles & ships on
  its own. R2 (bug) ships first because it's smallest and most urgent.
- No new runtime deps. Behaviour changes only.
- All UI copy lands in code; no separate i18n catalogue.

---

## R1 — Logo size: slider → S / M / L / XL segmented control

### Analysis

**Today.** `LogoControls.tsx:103-118` renders a `Slider` whose
`min/max/step` come from a dynamic bucket list (`logo-size.ts`
`computeLogoSizeBuckets`). The bucket math is correct — it walks the
`sizeRatio` range, asks qr-code-styling what cell count each ratio
produces, and groups consecutive ratios into discrete "stops" so
dragging the slider always visibly changes the rendered logo. The
slider reports `xx% · n-cell` in its `format()` callback.

Number of buckets varies from 2 to 4 depending on the QR (Quick
Response) code's module count and the current EC (error correction)
level. That variability is a problem for fixed S/M/L/XL labels.

**Target.** A `SegmentedControl<'S'|'M'|'L'|'XL'>` with up to 4
options. The mapping from label to `sizeRatio` is derived from the
current bucket list:

| Label | Source bucket index | Approx % of QR |
|---|---|---|
| S   | 0                    | ~14-17 % |
| M   | 1                    | ~20-23 % |
| L   | 2 (or last if < 3)   | ~27-30 % |
| XL  | 3 (or last if < 4)   | ~33-35 % |

**Edge case — fewer than 4 buckets.** When the current QR (Quick
Response) code only yields 2 or 3 distinct rendered cell counts in the
range, XL (and possibly L) would map to the last bucket. That makes
two adjacent labels render identically, which is bad UX.

**Resolution.** When there are fewer than 4 buckets, **show only the
labels that map to distinct buckets**. The segmented control
re-renders with 2-4 items depending on `buckets.length`. The active
label persists across content changes by storing `sizeRatio` (not the
label), so reselecting still picks the closest match.

### Implementation

**Files**
- `apps/qrcode/src/components/LogoControls.tsx` — replace `Slider`
  with `SegmentedControl<SizeLabel>`. Add label-bucket mapping helper.
- `apps/qrcode/src/lib/logo-size.ts` — add a small helper
  `labeledBuckets(buckets)` returning `[{label,bucket}]` truncated to
  4. Keep `computeLogoSizeBuckets` / `nearestBucketIndex` as-is.
- `apps/qrcode/src/__tests__/logo.test.tsx` — replace slider
  assertions with segmented-control assertions.
- `apps/qrcode/src/__tests__/logo-size.test.ts` — add tests for
  `labeledBuckets`.

**Sketch**

```tsx
const LABELS = ['S', 'M', 'L', 'XL'] as const;
type SizeLabel = (typeof LABELS)[number];

const labeledBuckets = (buckets: LogoSizeBucket[]) =>
  buckets.slice(0, 4).map((bucket, i) => ({ label: LABELS[i], bucket }));

// In LogoControls:
const items = labeledBuckets(buckets);
const activeIdx = nearestBucketIndex(buckets, logo.sizeRatio);
const activeLabel = LABELS[Math.min(activeIdx, items.length - 1)];

<SegmentedControl<SizeLabel>
  value={activeLabel}
  options={items.map(({ label, bucket }) => ({
    value: label,
    label: `${label}`, // optional: secondary text `${bucket.cells}-cell`
  }))}
  onChange={(label) => {
    const target = items.find((x) => x.label === label)?.bucket;
    if (target) onChange({ ...logo, sizeRatio: target.ratio });
  }}
  ariaLabel="Logo size"
  full
/>
```

A small `qr-field-hint` below the control reads "≈ {percent}% ·
{cells}-cell" so the user still gets a numeric grounding without
seeing the raw slider.

---

## R2 — Bug: logo collapses / mispositions at high padding

### Analysis

**Repro.** Insert any logo. Drag "Padding" slider up. Around 12 px the
logo shrinks to near-invisible. Past ~16-18 px it disappears entirely.
Past ~20 px it reappears tucked into the bottom-right corner of the
preview stage.

**Root cause.** qr-code-styling's `drawImage` (declared in
`node_modules/.../qr-code-styling/lib/core/QRSVG.d.ts`) places the
embedded image inside the reserved hole, then *insets* it by
`imageOptions.margin` pixels on every side:

```
imageWidthPx  = holeSideCells × dotSize  −  2 × imageOptions.margin
imagePosX     = holeStartX            +  imageOptions.margin
imagePosY     = holeStartY            +  imageOptions.margin
```

For a typical default (URL content, moduleCount = 25, QR pixel size
= 280, dotSize ≈ 11.2 px, S bucket = 3 cells):

| Padding | hole side px | image width px | result |
|---|---|---|---|
| 0  | 33.6 | 33.6  | normal |
| 6  | 33.6 | 21.6  | smaller logo, still centred |
| 12 | 33.6 | 9.6   | tiny — looks "zero" |
| 16 | 33.6 | 1.6   | invisible |
| 20 | 33.6 | -6.4  | negative width — SVG renderer behaviour: |
|    |      |       | most browsers either clip to 0 or flip the |
|    |      |       | rect, placing it at `(x + margin, y + margin)` |
|    |      |       | extending out of the hole into the QR body. |

Because the QR (Quick Response) preview is itself rendered inside the
inscribed-square `<g transform="translate(…) scale(…)">` of the frame
composition, the mis-placed `<image>` lands wherever the inverted
bbox calculation puts it — visually, the bottom-right corner of the
visible stage. **It is not a bug in our composition code; it is the
underlying lib mis-rendering an over-margined image.**

**Fix shape.** Cap padding so the inset image is always at least
`MIN_IMAGE_PX` (≈ 16 px) wide. This means the slider's effective max
depends on the current bucket and the rendered QR (Quick Response)
pixel size, both of which `LogoControls` already (or nearly) knows.

```
holeSidePx     = bucket.cells × dotSize
maxPadding     = max(0, floor((holeSidePx − MIN_IMAGE_PX) / 2))
```

Where `dotSize = layout.qr.size / moduleCount`. The layout pixel size
lives in `QrPreview` (from `frame-shapes.frameLayout`); it must be
piped down through App to `LogoControls`. Simplest path: thread
`qrPixelSize` (the inscribed-square pixel size) into the existing
`LogoControlsProps`.

The slider's existing UI doesn't change — only its `max` does, and
the existing value gets clamped on each render so a previously-set
padding can't survive a content / EC change that shrinks the bucket.

### Implementation

**Files**
- `apps/qrcode/src/lib/logo-size.ts` — add `safeMaxPadding({ cells,
  dotSize, minImagePx })`. Pure function.
- `apps/qrcode/src/components/LogoControls.tsx` — accept new prop
  `qrPixelSize: number`; compute `dotSize = qrPixelSize / moduleCount`
  ; pass `maxPadding` to the `Slider`; clamp existing `logo.padding`
  in a `useEffect`.
- `apps/qrcode/src/App.tsx` — pass `layout.qr.size` (the inscribed
  side) to `LogoControls`. App already knows `frameShape`; it can
  compute the layout once via `frameLayout` and hand `qr.size` down.
  Alternative: lift the layout calc into App and pass it to both
  `QrPreview` and `LogoControls`.
- `apps/qrcode/src/__tests__/logo-size.test.ts` — unit tests for
  `safeMaxPadding` over a matrix of cell counts and dotSizes.
- `apps/qrcode/src/__tests__/logo.test.tsx` — repro test: render
  `LogoControls` with a small `qrPixelSize`, assert slider max is
  ≤ 6 px; then with a large size, assert max ≥ 14 px.

**Constant**
```ts
const MIN_IMAGE_PX = 16; // visual floor for the embedded logo
```

---

## R3 — EC behind "Advanced"; full auto by default

### Analysis

**Today.** The Format section has two controls — `Error correction`
(L/M/Q/H segmented) and `Quiet zone` (px slider). The EC value is the
user's manual choice unless `userTouchedEc` is false and the logo is
big, in which case `effectiveOptions.errorCorrection = 'H'` (the
"autoBump"). `userTouchedEc` flips to `true` the moment the user
clicks any L/M/Q/H button.

This works but is leaky: the user *always* sees the EC picker even
when they have no reason to think about EC. And the auto behaviour is
one-way — once `userTouchedEc` is true, it stays true until reset.

**Target.**
- The default panel shows a small status block: "Error correction:
  **{level}** (auto-tuned for your design)". No L/M/Q/H buttons.
- Below it, a single toggle: "Advanced controls". When on, the
  L/M/Q/H segmented appears.
- When the user is in Advanced and picks a level too low for the
  current logo size or padding, a warning banner shows below the
  picker: "Your logo covers ~25 % of the QR; only level H has enough
  redundancy. Auto would have picked H."
- Turning Advanced off resets manual choice; auto takes over again.
- Rename the rail item from "Format" to "Advanced", since EC is the
  only thing left there once R4 moves the padding slider out.

**State model.**

| Today | Tomorrow |
|---|---|
| `options.errorCorrection: EC` | unchanged |
| `userTouchedEc: boolean` (App state) | renamed `advancedEc: boolean` |
| autoBump derives from logo size alone | autoBump considers logo size **and** padding (R4) |
| `effectiveOptions.errorCorrection = autoBump ? 'H' : options.ec` | same, gated by `!advancedEc` |
| Manual choice persists | manual choice persists **only while `advancedEc` is true**; reset on toggle-off |

**Auto-EC rules (consolidated).**

```
recommended =
  logo.sizeRatio > 0.30 ? 'H'
  : logo.sizeRatio > 0.20 ? 'H'      // existing rule
  : margin / size > 0.15  ? 'H'      // new — R4 contribution
  : margin / size > 0.10  ? 'Q'
  : options.errorCorrection           // pass-through
```

The two `> 0.20` and `> 0.30` rows could be merged but I'm keeping
them split so logo and margin thresholds can be tuned independently.

**Warning condition.** Show the banner when `advancedEc &&
recommendedEc !== options.errorCorrection &&
rank(options.errorCorrection) < rank(recommendedEc)` with
`rank = { L: 0, M: 1, Q: 2, H: 3 }`.

### Implementation

**Files**
- `apps/qrcode/src/App.tsx`
  - Rename state `userTouchedEc` → `advancedEc`. Toggling it off
    re-derives EC from auto.
  - Hoist the new `recommendedEc(opts)` helper.
  - `effectiveOptions.errorCorrection = advancedEc ?
    options.errorCorrection : recommendedEc(options)`.
  - Pass `advancedEc`, `setAdvancedEc`, and `recommendedEc` to the
    new "Advanced" panel.
  - Rename `SectionId 'format' → 'advanced'`. Update the rail item
    label & icon (keep `Sliders` for now).
- `apps/qrcode/src/components/ErrorCorrectionPicker.tsx` — accept
  an optional `severity?: 'warn' | 'fail'` and `recommendation?: EC`
  to render the inline warning copy.
- New `apps/qrcode/src/components/AdvancedPanel.tsx` — wraps the
  toggle + EC picker + warning banner. Replaces the existing
  Format-panel inline composition in App.tsx.
- `apps/qrcode/src/lib/scannability.ts` — extend `assess()` to
  surface the "manual EC below recommended" case so the
  ScannabilityNotice can also flag it (defence in depth).
- Tests:
  - `apps/qrcode/src/__tests__/App.test.tsx`:
    - Default: EC picker is hidden.
    - Toggle Advanced: picker appears; manual choice persists.
    - Toggle off: manual choice resets; auto applies.
    - Manual L + 25 % logo: warning visible.
  - `apps/qrcode/src/__tests__/scannability.test.ts`: cases for the
    new "manual EC below recommended" branch.
  - `packages/e2e/tests/qrcode/format.spec.ts` (renamed from
    `format` rail) → `advanced.spec.ts` or merge into existing.

**Rail copy.** Section is `Advanced`. Default panel body when
`!advancedEc`:

```
Error correction: H
auto-tuned for the logo size you chose

[ Show advanced controls ]
```

When `advancedEc`:

```
Error correction
[ L ][ M ][ Q ][ H ]

⚠ Auto would have picked H for this logo size.

[ Hide advanced controls ]
```

---

## R4 — Quiet zone → Shape section, rename **Padding**, auto-EC

### Analysis

**Today.** `SizeMarginControls.tsx` renders a single `Slider` labelled
"Quiet zone", value 0-40 px, step 2. App places it in the Format
panel.

**Target.**
- Slider moves to the Shape panel, alongside the Frame / Modules /
  Eye-frame / Eye-ball controls.
- Label renames to **Padding**.
- Same auto-EC behaviour as the logo size: when padding becomes a
  large fraction of canvas size, the auto rule (R3) bumps EC to Q or
  H. The Advanced override still wins, with a warning banner.

**Naming collision.** The Logo section already has a "Padding"
slider (the inner image inset). With this move, "Padding" appears in
two panels: Logo and Shape. Different things, same word. Acceptable
because the panels are visually distinct and the user is only ever
looking at one at a time, but I want to flag it explicitly so the
review can push back.

**Alternatives considered, rejected:**
- `Margin` / `Quiet zone`: technically right, but the user explicitly
  asked for "Padding".
- `Code padding`: pedantic, no other control says "code". Doesn't
  improve readability.
- Rename the logo padding slider to "Inset": preserves a single
  meaning for "Padding". Out of scope per the user's "keep the
  padding slider as is" instruction. Plan does **not** do this.

**Auto-EC threshold for padding.** The quiet zone doesn't damage
modules, but a large quiet zone shrinks the modules within the
fixed canvas, which reduces the per-module pixel area on print and
on small displays. Empirically, when margin / size exceeds ~10 % the
modules become uncomfortably small for low-EC reads at distance. The
rule baked into `recommendedEc` (R3) reflects this:

```
margin / size > 0.15  →  recommend H
margin / size > 0.10  →  recommend Q
```

For the default `size: 280`:
- 0.10 of 280 = 28 px → above this we recommend Q
- 0.15 of 280 = 42 px → above this we recommend H

The slider's current max is 40 px, which is just below the H
threshold. We can leave the cap alone or raise it to 56 px; raising
it makes "very loud quiet zone" achievable and is a small tweak. Plan
recommends max = 48 px.

### Implementation

**Files**
- `apps/qrcode/src/components/SizeMarginControls.tsx` — rename the
  component to `PaddingControl.tsx` (the file too); rename the slider
  label "Quiet zone" → "Padding"; raise the max to 48.
- `apps/qrcode/src/components/ShapeControls.tsx` — accept new props
  `margin`, `onMargin`, and render `<PaddingControl>` after the
  Frame field. Or App composes them; either works — picking
  composition in App so `ShapeControls` keeps a single concern.
- `apps/qrcode/src/App.tsx`
  - Move the existing `<SizeMarginControls>` from the `format` panel
    to the `shapes` panel.
  - Re-render the `format` (now `advanced`) panel with only the EC
    picker + advanced toggle.
- Tests:
  - `apps/qrcode/src/__tests__/controls.test.tsx` (or a new file) —
    snapshot the renamed component, assert label is "Padding".
  - `packages/e2e/tests/qrcode/frame-and-shape.spec.ts` — add a case
    that opens the Shapes rail, increases Padding, asserts the QR's
    SVG `<rect>` viewbox shrinks (or simpler: padding slider exists
    in the shapes panel, not in the format/advanced panel).

---

## Cross-cutting changes

- `apps/qrcode/src/App.tsx` — the SectionId union renames `'format'`
  → `'advanced'`. The rail item label changes to "Advanced". The
  numericShortcuts mapping stays the same (Alt+5 still hits the same
  rail position). One e2e helper update needed:
  `packages/e2e/tests/qrcode/_fixtures/qrcode-page.ts` — `RailId`
  union loses `'format'`, gains `'advanced'`. Update specs that
  reference `qr.selectRail('format')`.
- `apps/qrcode/src/components/LogoEcWarning.tsx` — copy update: now
  mentions both "logo size" and "padding" can drive autoBump. Or
  rename to `EcAutoBumpBanner` if the wording diverges enough.
- `apps/qrcode/REVIEW.md` — annotate §1.2, §3.3, §3.4 with refs to
  this plan once the commits land.

---

## Phasing

| # | Commit | Files touched | Notes |
|---|---|---|---|
| 1 | `fix(qrcode): clamp logo padding to keep image visible (R2)` | `lib/logo-size.ts`, `LogoControls.tsx`, `App.tsx`, tests | Smallest, ship first |
| 2 | `feat(qrcode): logo size as S/M/L/XL selector (R1)` | `LogoControls.tsx`, `lib/logo-size.ts`, tests | Depends on R2 only for the `qrPixelSize` prop wiring |
| 3 | `refactor(qrcode): move quiet zone to Shape, rename Padding (R4)` | `SizeMarginControls.tsx` → `PaddingControl.tsx`, `App.tsx`, e2e helper, tests | Pure UI move + rename. Auto-EC rule lands in R3. |
| 4 | `feat(qrcode): hide EC behind Advanced, auto-pick from logo + padding (R3)` | `App.tsx`, new `AdvancedPanel.tsx`, `ErrorCorrectionPicker.tsx`, `scannability.ts`, e2e | Brings everything together. |

Each commit must keep `pnpm -r typecheck && pnpm -r lint &&
pnpm -r test && pnpm -r build` green.

---

## Acceptance checklist

- [ ] Logo padding past 12 px no longer collapses or mis-positions
      the embedded image. Repro test in `logo.test.tsx` would have
      failed on `main` and passes after R2.
- [ ] Logo size control reads as S / M / L / XL with at most 4 stops;
      fewer when the QR can't render that many distinct cell counts.
- [ ] Default Advanced panel shows no L/M/Q/H buttons.
- [ ] Advanced toggle reveals the EC picker; a manual unsafe choice
      surfaces an inline warning that names the recommended level.
- [ ] Toggling Advanced off resets manual EC; auto rule wins again.
- [ ] "Padding" slider lives in the Shape panel; the Format /
      Advanced panel no longer renders it.
- [ ] Padding > ~10 % of size recommends Q; > ~15 % recommends H. The
      auto bump fires from either logo size or padding, whichever is
      louder.
- [ ] CLAUDE.md totals updated:
  - `@aliv/qrcode` unit tests: 142 → ~150+
  - `@aliv/e2e`: 91 → 95+ specs (a couple of new format / shape cases)

---

## Risks / open questions

1. **Naming.** Two controls called "Padding" (Logo + Shape). Plan
   accepts this on the basis that section context disambiguates. If
   the user disagrees, the cheapest follow-up is renaming the logo
   slider to "Inset".
2. **S/M/L/XL on tiny QRs.** On a 21-module QR (very short content,
   low EC), the bucket math may only yield 2 distinct cell counts.
   Plan shows only the labels that map to distinct buckets; "S" and
   "L" will both be visible but "M" and "XL" hidden. UX is honest but
   may surprise the user. Alternative: keep four buttons and accept
   that adjacent labels render identically. Plan prefers honesty.
3. **Auto-EC heuristic for padding.** The 0.10 / 0.15 ratio thresholds
   are educated guesses. Validate by printing at 200 dpi and reading
   at arm's length with a phone scanner. Plan keeps both as named
   constants in `App.tsx` so they're trivial to tune.
4. **Advanced toggle state.** Persisting Advanced across reloads
   (localStorage) is tempting but out of scope. Plan resets it on
   reload — the EC is auto-picked again, which is the safe default.
5. **Section rename in the rail.** Renaming "Format" → "Advanced"
   touches the e2e selector `qr.selectRail('format')`. Plan updates
   the helper and the specs that use it; no other change.

---

# Deep-dive addendum (pass 2)

This addendum captures everything I missed in pass 1 after walking the
auto-EC (error correction) pathway end-to-end. Each finding either
amends a phase or adds a new one. Read this before implementing — the
original sections above are still correct, just incomplete.

---

## A. Map every place the EC level is read

The auto-EC rule has to be plugged into all of these. Pass 1 missed
several.

| Consumer | File | Reads EC from | What changes |
|---|---|---|---|
| QR engine (live preview) | `lib/qr-engine.ts:toStylingOptions` | `opts.errorCorrection` | **No change** — receives `effectiveOptions`. |
| QR engine (export) | `lib/export.ts:buildExportInstance` | `opts.errorCorrection` | **No change** — receives `effectiveOptions`. |
| Scannability assessor | `lib/scannability.ts:assess` | `opts.errorCorrection` | Extend to flag "manual EC below recommended". See §D.3. |
| Logo bucket math | `lib/logo-size.ts:computeLogoSizeBuckets` | `userEc` prop | **Needs new logic** — must reflect padding-driven auto-bump. See §B.1. |
| LogoControls UI | `components/LogoControls.tsx` | passes `userEc` to bucket math | Update what it passes. See §B.1. |
| LogoEcWarning banner | `components/LogoEcWarning.tsx` | (only `show: boolean`) | Copy update — autoBump can now go to Q **or** H, and can be triggered by **logo size** or **padding** or both. See §D.4. |
| Rail badge | `App.tsx:railItems` | `scannability.level` | No direct EC read, but scannability now also reflects manual-EC-below-recommended → badge updates automatically. |
| Reset path | `App.tsx:handleReset` | resets `userTouchedEc` | Must reset `advancedEc` too. See §C.1. |
| Preset apply | `settings/presets.ts:applyPreset` | spreads `preset.options.errorCorrection` | See §C.2. |

**Pass-1 plan missed**: the bucket-math consumer (§B.1) is the
load-bearing one. The other "no change" rows confirm that piping a
correct `effectiveOptions.errorCorrection` is enough for the rendering
pipeline.

---

## B. Circular dependency between EC, logo size, and module count

This is the single biggest hole in pass 1.

### B.1 The cycle

```
options.logo.sizeLabel  ──►  sizeRatio (via bucket lookup)
                                  │
                                  ▼
                         recommendedEc(opts)  ──┐
                                  │              │
                                  ▼              │
                         effectiveEc            │
                                  │              │
                                  ▼              │
                  qr-code-styling engine        │
                                  │              │
                                  ▼              │
                            moduleCount         │
                                  │              │
                                  ▼              │
                   computeLogoSizeBuckets ◄──────┘
                                  │
                                  ▼
                              buckets
                                  │
                                  ▼
                  sizeRatio = buckets[sizeLabelIndex].ratio
                                  │
                                  └─► loop back to top
```

The cycle has two natural breakers:

1. **`computeLogoSizeBuckets` accepts a `userEc` parameter.** Today
   it's `userTouchedEc ? options.ec : undefined`. With auto-EC now
   driven by **margin too**, the bucket math must receive the EC
   that **the padding alone implies**, not just `undefined`. We
   decompose:

   ```ts
   recommendedEcFromMargin(opts) =
     opts.margin / opts.size > 0.15 ? 'H'
     : opts.margin / opts.size > 0.10 ? 'Q'
     : 'M'
   ```

   And `LogoControls` passes `userEc = advancedEc
   ? options.errorCorrection : recommendedEcFromMargin(opts)`. The
   bucket math then applies its own "ratio > 0.20 → H" bump on top
   internally (existing behaviour) so the final EC the bucket math
   reasons about is `max(userEc, logoBump)`.

2. **`moduleCount` is read post-render.** `useQrPreview` writes
   `moduleCount` to state after the engine resolves. React's render
   loop converges within a small finite number of passes because
   `nearestBucketIndex` is idempotent — once `sizeRatio` snaps to a
   bucket, it stays there.

### B.2 Loop-safety proof sketch

Tracing one user action (drag padding slider from 8 px → 32 px):

1. `options.margin = 32` → React re-renders.
2. `recommendedEc(opts) = 'H'` (margin/size = 11.4 %).
3. `effectiveOptions.errorCorrection = 'H'` → `useQrPreview` updates
   engine.
4. Engine recomputes → `moduleCount: 25 → 33`.
5. `setModuleCount(33)` → React re-renders.
6. `LogoControls` recomputes `buckets` with `userEc='H'` and
   `moduleCount=33`.
7. If current `sizeRatio` doesn't fall on a bucket: snap effect fires
   → `setOptions({ ...logo, sizeRatio: targetBucket.ratio })`.
8. React re-renders. `recommendedEc` unchanged (sizeRatio doesn't
   affect margin/size). `moduleCount` unchanged (sizeRatio doesn't
   affect module version). Buckets unchanged. Snap idempotent. **Done.**

Worst case: 3 React render passes per user action. No infinite loop.

### B.3 What pass 1 said vs what it should say

Pass-1 §R3 implied `userEc` would just become the manual choice in
advanced mode. **Wrong** — in auto mode it must be
`recommendedEcFromMargin(opts)`, not `undefined`, otherwise the
bucket math will mis-size the logo whenever padding is the EC driver.

---

## C. State-model holes

### C.1 Reset

`App.tsx:handleReset` today resets `options`, `userTouchedEc`,
`currentPresetId`, `contentType`, `contentMap`. With the new model
`userTouchedEc` is renamed `advancedEc`; reset must clear it.
**Already implicit** in the rename — flagging explicitly.

### C.2 Presets and EC

`presets.ts` currently includes `errorCorrection` on most presets
(M everywhere, H on "High-Contrast Print"). With auto-EC,
`preset.options.errorCorrection` is **silently ignored** when
`advancedEc` is false. That breaks the intent of the
high-contrast-print preset.

Three options:

| Option | What it does | Trade-off |
|---|---|---|
| **C.2.a** | Drop `errorCorrection` from `preset.options`. Auto rule decides. | High-contrast-print loses its meaning unless we re-encode the intent as e.g. "EC=Q by hand, ratio=high padding". Easiest cleanup. |
| **C.2.b** | `applyPreset` writes the EC and **also flips `advancedEc=true`**. | Presets keep their explicit EC. UX surprise: user applies a preset and suddenly the Advanced section toggles on. |
| **C.2.c** | Per-preset opt-in: `preset.forcesAdvanced?: boolean`. Only high-contrast-print sets it. | Most precise. Slight schema churn. |

**Plan recommends C.2.c.** Add an optional `forcesAdvanced: true`
flag to the `Preset` interface. Only `high-contrast-print` sets it.
`applyPreset` returns both the new options and a flag for App to set
`advancedEc=true` if present. All other presets behave identically
under the auto rule.

### C.3 Advanced toggle vs raw `options.errorCorrection`

Pass 1 implied toggling Advanced off "resets manual choice". On
reflection that's wrong. **Better**: leave
`options.errorCorrection` alone, gate it via `advancedEc`. Toggling
off → effective EC = `recommendedEc(opts)`. Toggling back on → EC =
`options.errorCorrection` (restored). The off/on dance is therefore
reversible. Updated.

### C.4 First-paint defaults

`DEFAULT_QR_OPTIONS.errorCorrection = 'M'`. `advancedEc = false` on
mount. With no logo and `margin = 12`, `recommendedEc = M`. Matches
`options.errorCorrection`. No flicker on first paint. Good.

### C.5 Persistence across reload

None — App state is in-memory, resets on reload. Confirmed not in
scope; flagging for the record.

---

## D. Edge cases per requirement

### D.1 R1 (S/M/L/XL): label drift across content changes

If we store `logo.sizeRatio` and derive the label by closest match,
the label can visually drift across content-type changes (different
module count → different bucket boundaries).

**Resolution.** Store the **label**, not the ratio:

```ts
interface LogoConfig {
  src: string;
  size: 'S' | 'M' | 'L' | 'XL';   // ← was: sizeRatio: number
  padding: number;
  shape: 'square' | 'rounded' | 'circle';
}
```

The ratio is computed at render time:
`logo.sizeRatio = labeledBuckets(buckets).find(b => b.label === logo.size)?.bucket.ratio`.

This is a wider data-model change than pass 1 admitted. The
migration touches `types.ts`, `presets.ts`, `defaults.ts`,
`logo-utils.ts` if it persists ratios anywhere, and several tests.
Worth doing — the label-stable UX matches the user's mental model.

### D.2 R1: fewer than 4 buckets

At very low EC (L) or very short content, the bucket math may yield
only 1-2 distinct cell counts. We can't show S/M/L/XL if some labels
don't map.

**Resolution.** Show only the labels that have a real bucket.
Disabled labels are not rendered (cleaner than greyed-out). Add a
hint below the segmented control:

> "More sizes available at higher error correction."

…only when `buckets.length < 4`. In auto mode this is a clue to add
more content or accept a smaller logo; in advanced mode it's a clue
that the manual EC is constraining the choice.

### D.3 R3: ScannabilityNotice needs to surface the "manual-EC-too-low" case

`scannability.assess` currently warns when the **logo** is too big
for the EC. After R3+R4 the failure mode "padding too big for the
EC, user is in advanced + L" exists too. Extend `assess`:

```ts
if (margin/size > 0.15 && opts.errorCorrection !== 'H') {
  bump('warn');
  messages.push(`Padding takes up >15 % of the canvas; only EC=H
                 reliably scans at this margin.`);
}
```

The notice already has `role="status"` + `aria-live` from F21, so
new messages announce correctly.

### D.4 R3: LogoEcWarning copy is wrong for Q

Current banner says "Error correction bumped to **H**". After the
auto rule supports Q-level bumps from margin, the banner must
parametrise on the actual recommended level.

Rename `LogoEcWarning` → `EcAutoBumpBanner`. Props:

```ts
interface Props {
  show: boolean;
  recommended: ErrorCorrection;   // 'Q' or 'H'
  reason: 'logo' | 'padding' | 'both';
}
```

Copy variants:
- `reason='logo'` + `H`: "Logo is big enough that we raised EC to H."
- `reason='padding'` + `Q`: "Padding is large; we raised EC to Q for safer scans."
- `reason='both'` + `H`: "Big logo + large padding — EC raised to H."

### D.5 R2: clamp depends on **inscribed** size, not options.size

The padding-clamp formula uses `dotSize = layout.qr.size /
moduleCount`. `layout.qr.size` is **the inscribed QR pixel size**,
which is smaller than `options.size` when frameShape is `'circle'`
(≈ size / √2). Pass 1 noted this but didn't say *who computes it*.

**Resolution.** Lift `frameLayout(...)` out of `QrPreview.tsx` into
`App.tsx`, compute it once, pass `layout.qr.size` down to both
`QrPreview` and `LogoControls`. Plan §R2 amended.

Side effect: switching `frameShape` from `none` to `circle` reduces
`dotSize`, which shrinks `safeMaxPadding`. A `useEffect` in
`LogoControls` clamps the stored `logo.padding` to the new cap.
Visible behaviour: dragging the frame to Circle with padding=8 px
will visibly snap padding down to ~3 px. This is correct.

### D.6 R4: large-padding loop with frame-shape circle

`Circle` frame already shrinks the QR to ~70 % of canvas. Adding
large padding on top further shrinks the modules. The auto rule
uses `margin / size` where `size = options.size` (the full canvas).
At `frameShape=circle` we might want to use `margin / inscribed`
instead — but that complicates the rule.

**Resolution.** Keep `margin / size` (canvas-relative) for the
threshold. It's the user-visible "how much white surrounds the
QR" measurement. Document that under `frameShape=circle` the
effective scan-distance is already reduced, so the H threshold may
fire earlier in practice. Not a bug, a documented quirk.

### D.7 R4: the second "Padding" slider

Two sliders named "Padding" — one in Logo, one in Shape — is a
known collision. Pass 1 accepted it. Adding belt-and-braces:

- Logo padding label gets a sublabel: `Padding · inside logo`.
- Shape padding label gets a sublabel: `Padding · around the code`.

…only the leading word is "Padding"; the sublabel disambiguates on
hover/inspect. Cheap to add; killed entirely if user disagrees.

---

## E. Constants and consolidation

All EC thresholds should live in one module, not be sprinkled.

**New file**: `apps/qrcode/src/lib/ec-rules.ts`

```ts
import type { ErrorCorrection, QrOptions } from './types';

export const LOGO_BUMP_H_THRESHOLD   = 0.20;   // sizeRatio above this → H
export const MARGIN_BUMP_Q_THRESHOLD = 0.10;   // margin/size above this → Q
export const MARGIN_BUMP_H_THRESHOLD = 0.15;   // margin/size above this → H
export const MIN_EMBEDDED_LOGO_PX    = 16;     // R2 visual floor

export const EC_RANK: Record<ErrorCorrection, number> = { L: 0, M: 1, Q: 2, H: 3 };
const max = (a: ErrorCorrection, b: ErrorCorrection) =>
  EC_RANK[a] >= EC_RANK[b] ? a : b;

export function recommendedEcFromMargin(opts: QrOptions): ErrorCorrection {
  const ratio = opts.margin / opts.size;
  if (ratio > MARGIN_BUMP_H_THRESHOLD) return 'H';
  if (ratio > MARGIN_BUMP_Q_THRESHOLD) return 'Q';
  return 'M';
}

export function recommendedEc(opts: QrOptions): ErrorCorrection {
  const fromMargin = recommendedEcFromMargin(opts);
  const fromLogo = opts.logo && opts.logo.sizeRatio > LOGO_BUMP_H_THRESHOLD ? 'H' : 'M';
  return max(fromMargin, fromLogo);
}

export function isManualEcUnsafe(opts: QrOptions): boolean {
  return EC_RANK[opts.errorCorrection] < EC_RANK[recommendedEc(opts)];
}

export function safeMaxPadding({ cells, dotSize }: { cells: number; dotSize: number }) {
  const holePx = cells * dotSize;
  return Math.max(0, Math.floor((holePx - MIN_EMBEDDED_LOGO_PX) / 2));
}
```

Everything else imports from here. Pass-1 plan didn't name this
module; without it the constants would drift.

---

## F. New test coverage (additions to pass 1)

`apps/qrcode/src/__tests__/ec-rules.test.ts` (new):
- `recommendedEcFromMargin` table-driven over margin/size ratios:
  0 / 0.05 / 0.10 / 0.10001 / 0.15 / 0.15001.
- `recommendedEc`: logo+padding contributions, both, neither.
- `isManualEcUnsafe`: M with big logo, H with big logo, Q with big
  margin, L always unsafe with any logo, etc.
- `safeMaxPadding`: 3-cell × 5 px dotSize → 0; 5-cell × 11 px → 19;
  9-cell × 11 px → 41.

`apps/qrcode/src/__tests__/App.test.tsx` additions:
- Default render: Advanced toggle is **closed**, no L/M/Q/H buttons.
- Toggle Advanced on → buttons visible.
- Pick L while logo is large → ScannabilityNotice warns; warning
  banner mentions "would have picked H".
- Toggle Advanced off → effective EC reverts to auto **without**
  losing the L value (we can read state to confirm).
- Apply `high-contrast-print` preset → Advanced flips to on, EC=H.
- Increase margin past 15 % of size with no logo → auto EC = H,
  ScannabilityNotice silent (because EC is correct), banner copy
  says "padding".
- Increase margin past 10 % of size → auto EC = Q, banner copy
  says "padding · Q".

`apps/qrcode/src/__tests__/logo-size.test.ts` additions:
- `labeledBuckets`: 4 buckets → S/M/L/XL; 2 buckets → S/L; 1 bucket
  → S only.
- `computeLogoSizeBuckets` correctly reflects `userEc='Q'` (new
  case: pre-bump from padding) — bucket count and ratios differ
  from EC='M'.

`packages/e2e/tests/qrcode/`:
- Rename `format` → `advanced` in `qrcode-page.ts` RailId.
- `advanced.spec.ts` (new):
  - Toggle visible; EC controls hidden by default; appear on toggle.
  - Pick L with no logo → no warning. Add a big logo → warning.
- `frame-and-shape.spec.ts`:
  - "Padding" slider lives in the Shape rail, not in Advanced.
  - Increasing padding past a threshold flips the rail badge.
- `logo.spec.ts`:
  - Pick "L" via segmented control; assert preview SVG `<image>`
    is centred (not in the corner). This is the R2 bug regression
    test.
  - Pick "XL" with default content — assert the XL button is
    either visible (4-bucket case) or absent (≤ 3 buckets).

---

## G. Final phasing — amended

Pass 1 had 4 phases. With the addendum, **phase 2.5** is needed and
phase 4 splits in two:

| # | Commit | Adds |
|---|---|---|
| 1 | `fix(qrcode): clamp logo padding to keep image visible (R2)` | `ec-rules.ts` skeleton + `safeMaxPadding` + tests. Lift `frameLayout` into App. |
| 2 | `feat(qrcode): logo size as S/M/L/XL selector (R1)` | `labeledBuckets`, segmented control, `logo.size` (label) in state model — migrate from `sizeRatio`. |
| 3 | `refactor(qrcode): move quiet zone to Shape, rename Padding (R4)` | UI move + slider rename + max 48. **No** auto-EC behaviour yet. |
| 4 | `feat(qrcode): unified recommendedEc from logo + padding (R3 part 1)` | `ec-rules.ts:recommendedEc/Margin`, `EcAutoBumpBanner` (was LogoEcWarning), scannability extension. State model gains `advancedEc`. Default mode auto. |
| 5 | `feat(qrcode): Advanced toggle + manual EC override (R3 part 2)` | New `AdvancedPanel`, rail rename Format→Advanced, preset `forcesAdvanced` opt-in, e2e rename. |

Splitting R3 lets phase 4 ship "auto-EC plus banner" without yet
touching the rail UX. If anything goes wrong in phase 5 the UI is
still recoverable to a usable state.

---

## H. Acceptance checklist — amendments

Adding to pass 1:

- [ ] `ec-rules.ts` is the single source of truth for all EC thresholds.
- [ ] `LogoControls.userEc` plumbing reflects padding-driven autoBump
      (so bucket sizes are correct whenever margin alone forces a Q/H).
- [ ] `LogoConfig.size` is a label (`S|M|L|XL`), not a ratio.
- [ ] `EcAutoBumpBanner` copy parametrises on level + reason.
- [ ] Scannability messages cover both "logo > 20 % at low EC" and
      "padding > 15 % at low EC".
- [ ] `frameLayout` is computed in `App.tsx`, passed to both
      `QrPreview` and `LogoControls`.
- [ ] `safeMaxPadding` clamp re-fires when `frameShape` changes
      (because dotSize shrinks).
- [ ] Preset `forcesAdvanced` flag on `high-contrast-print` only.
- [ ] Three render passes max per user action (loop safety doc'd in a
      comment alongside `recommendedEc`).

---

## I. Open questions, pass 2

1. **Should `recommendedEc` ever pick `L`?** Today it bottoms out at
   `M`. Picking L automatically is unsafe for almost any QR + logo;
   keeping `M` as the floor is the right call. Confirming explicitly.
2. **Should the `Advanced` rail badge show when auto has bumped EC?**
   Adds a small "auto is doing something" hint. Cheap; cosmetic.
   Recommend yes, severity = 'info' (new badge tone, or reuse
   existing `warn` muted).
3. **What about `options.size` becoming user-editable later?** It's
   fixed at 280 today. If it ever moves to a slider, every
   `margin/size` calculation here scales correctly because the rule
   is ratio-based. No further action needed.
4. **Migration of in-memory state on `LogoConfig.size` rename.** No
   persisted state, no migration code needed. Existing `logo.sizeRatio`
   in any code path is migrated via search-and-replace + the
   `labeledBuckets` derivation.
