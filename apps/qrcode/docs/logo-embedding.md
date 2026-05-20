# How logos get embedded in QR (Quick Response) codes

A QR (Quick Response) code is a grid of black and white squares. Each
square is called a **module**. A scanner reads the grid as a binary
number — black = 1, white = 0 — and decodes it back into text.

What makes a QR (Quick Response) code interesting for our purpose is
that it has **redundancy built in**. You can scribble on part of one,
fold a corner, even punch a hole in the middle, and most scanners will
still read it. That's not magic — it's a piece of 1960s math called
Reed-Solomon coding, and it's the whole reason you can stick a logo in
the middle of one.

---

## 1. Anatomy of a QR (Quick Response) code

```
┌───────────────────────────────────────────┐
│ ███████   . . . . . . . . . . . . ███████ │  ← finder patterns
│ █     █   . . . . . . . . . . . . █     █ │    (top-left, top-right,
│ █ ███ █   .                     . █ ███ █ │     bottom-left)
│ █ ███ █   .   data + parity   . . █ ███ █ │
│ █ ███ █   .   modules         . . █ ███ █ │
│ █     █   . . . . . . . . . . . . █     █ │
│ ███████   . . . . . . . . . . . . ███████ │
│                                           │
│           . . . . . . . . . . . .         │
│           . . . . . . . . . . . .         │
│           . . . . . . . . . . . .         │
│           . . . . . . . . . . . .         │
│ ███████                                   │
│ █     █                                   │
│ █ ███ █   . . . data . . . . . . .        │
│ █ ███ █                                   │
│ █     █                                   │
│ ███████                                   │  ← no finder pattern here:
└───────────────────────────────────────────┘    the asymmetry tells the
                                                 scanner which way is up
```

The three big squares at the corners are **finder patterns**. A
scanner uses them to locate the code, figure out which way is up, and
read the rest. Everything else — the small dots — is either data,
format information, or **error correction parity** (more on that
below).

---

## 2. The trick: Reed-Solomon error correction

Every QR (Quick Response) code stores its data **twice**: once as the
actual content, and once as **redundancy bytes**. If you damage some
of the modules, the scanner uses the redundancy to figure out what the
missing ones must have been. The math behind this is called
**Reed-Solomon coding** — the same technique that lets CDs (Compact
Discs) survive scratches and that NASA (National Aeronautics and Space
Administration) used on the Voyager probes.

There are four redundancy budgets, called **EC (error correction)
levels**:

| EC (error correction) level | Redundancy | Roughly recoverable |
|---|---|---|
| L | ~7 %  | A small scratch     |
| M | ~15 % | A fingerprint       |
| Q | ~25 % | A coffee ring       |
| H | ~30 % | A logo              |

Picking a higher EC (error correction) level produces a slightly
**denser** QR (Quick Response) code (more modules in the grid) but
lets you damage more of it before it stops scanning.

---

## 3. A logo is just damage you control

This is the punchline.

When you embed a logo in a QR (Quick Response) code, you're not doing
anything clever — you're **deliberately covering some modules** with
an image. The QR (Quick Response) code still scans because the
scanner reads the visible modules, sees that some are missing, and
Reed-Solomon reconstructs them from the redundancy bytes.

```
   without logo                with logo
┌────────────────────────┐  ┌────────────────────────┐
│ ███████   ████ █████ █ │  │ ███████   ████ █████ █ │
│ █     █   █ █  █████ █ │  │ █     █   █ █  █████ █ │
│ █ ███ █   ██ ██ ████ ██│  │ █ ███ █   ██ ██ ████ ██│
│ █ ███ █   ███████ ██ █ │  │ █ ███ █   ┌──────────┐ │
│ █ ███ █   █ ██████ █ ██│  │ █ ███ █   │          │ │
│ █     █   █████ █████ █│  │ █     █   │   logo   │ │
│ ███████   █████ █ ██ ██│  │ ███████   │  covers  │ │
│ █  █████  ███████ ██ █ │  │ █  █████  │  modules │ │
│ ███████   █████   ██ ██│  │ ███████   │   here   │ │
│ █     █   ████ █ █   █ │  │ █     █   └──────────┘ │
│ █ ███ █   ██████ ███ ██│  │ █ ███ █   ██████ ███ ██│
│ █     █   █████ █████ █│  │ █     █   █████ █████ █│
│ ███████   ████ █████ ██│  │ ███████   ████ █████ ██│
└────────────────────────┘  └────────────────────────┘
    scans fine                  also scans fine
                                (modules under the logo
                                 are reconstructed from
                                 the redundancy bytes)
```

The 30 % number is real: **the logo must cover less than the EC (error
correction) budget**, or the scanner runs out of redundancy and can't
recover. In practice you want a margin. Covering ~30 % with EC (error
correction) level H is the absolute ceiling. 20-25 % is comfortable.
15 % is bulletproof.

---

## 4. Where the logo actually sits — the geometry

The QR (Quick Response) code engine this app uses (a library called
`qr-code-styling`) doesn't just paint a logo on top and hope. It does
two things:

1. **Reserves a hole** in the centre — it computes a square region big
   enough for the logo and stops drawing modules inside it.
2. **Scales the image** to fill that hole.

The size of the hole is computed roughly like this:

```
maxHiddenDots = floor( sizeRatio × ecMultiplier × moduleCount² )
holeSide      = floor( sqrt(maxHiddenDots) )   // side, in modules
if holeSide is even, holeSide -= 1             // force odd
```

Three things to notice.

**`sizeRatio`** is what the size slider sets — a fraction between 0
and 1. The app exposes 0.15 to 0.35 because below 0.15 the logo is
invisible and above 0.35 the QR (Quick Response) code stops scanning
even at EC (error correction) level H.

**`ecMultiplier`** is the redundancy budget as a decimal: 0.07 for L,
0.15 for M, 0.25 for Q, 0.30 for H. This is why a higher EC (error
correction) level lets you draw a bigger logo — the formula literally
multiplies by the budget.

**The odd-cell rule.** `holeSide` is forced to an odd number of
modules. The reason: an odd-sided square has a single **centre
module**, so the hole sits exactly on the centre of the code. If the
side were even, the hole would straddle the centre by half a module
and the logo would look off-axis.

```
   odd side (3×3 modules)              even side (2×2 modules)
   centred on a single module          straddles the centre

   ┌───┬───┬───┬───┬───┐               ┌───┬───┬───┬───┬───┐
   │   │   │   │   │   │               │   │   │   │   │   │
   ├───┼───┼───┼───┼───┤               ├───┼───╆━━━╅───┼───┤
   │   │░░░│░░░│░░░│   │               │   │   ┃░░░┃░░░│   │
   ├───┼───┼───┼───┼───┤               ├───┼───┃░░░┃░░░┼───┤
   │   │░░░│░░░│░░░│   │               │   │   ┗━━━┹───┼───┤
   ├───┼───┼───┼───┼───┤               ├───┼───┼───┼───┼───┤
   │   │░░░│░░░│░░░│   │               │   │   │   │   │   │
   ├───┼───┼───┼───┼───┤               ├───┼───┼───┼───┼───┤
   │   │   │   │   │   │               │   │   │   │   │   │
   └───┴───┴───┴───┴───┘               └───┴───┴───┴───┴───┘
```

A side effect of the odd-cell rule: dragging the size slider only
changes the rendered size when the cell count flips from one odd
number to the next (3 → 5 → 7 → 9 …). The Aliv slider snaps to those
discrete steps on purpose, so dragging it always produces visible
change instead of feeling broken.

---

## 5. The format pipeline

Everything above happens in vectors and bytes. Here's the path a logo
actually takes from your hard drive to the rendered QR (Quick
Response) code.

```
  ┌──────────────────┐
  │  logo file       │   PNG / JPEG / WebP / SVG
  │  on your disk    │
  └────────┬─────────┘
           │ FileReader.readAsDataURL()
           ▼
  ┌──────────────────┐
  │  data: URL       │   "data:image/png;base64,iVBORw0KGgo..."
  │  in memory       │   (the raw bytes encoded as a text string)
  └────────┬─────────┘
           │
           │ optional: clip to a shape (square / rounded / circle)
           │ optional: sanitise SVG  (strip <script>, foreign refs)
           ▼
  ┌──────────────────┐
  │  embedded inside │   <svg> … <image href="data:…" /> … </svg>
  │  the QR SVG      │
  └────────┬─────────┘
           │
           ├──►  live preview      (rendered in the browser as SVG)
           │
           ├──►  SVG export        (the same SVG, saved to disk)
           │
           └──►  PNG export        (the SVG drawn onto an offscreen
                                    canvas at the chosen resolution,
                                    then saved as a PNG file)
```

A few words about each format.

### PNG (Portable Network Graphics) and JPEG (Joint Photographic Experts Group)

These are **raster** formats — a fixed grid of pixels. PNG (Portable
Network Graphics) supports transparency, JPEG (Joint Photographic
Experts Group) does not. Both upload cleanly as logos, but they have a
fixed resolution: a 100×100 logo will look blocky if you export the
QR (Quick Response) code at 2048×2048. For print, give the app the
biggest version of the logo you have.

### SVG (Scalable Vector Graphics)

A **vector** format — instead of pixels, it stores drawing
instructions ("draw a circle here, fill it cyan"). SVG (Scalable
Vector Graphics) scales to any size without losing sharpness, so it's
the best choice for a logo if you have one. The trade-off: SVG
(Scalable Vector Graphics) is XML (Extensible Markup Language), which
means it can carry executable content (`<script>` tags, external
`href` references). The app strips these before embedding, but if you
ever feed it untrusted SVGs from the internet, treat them with the
same care you would HTML (Hypertext Markup Language).

### WebP (Web Picture format)

A modern compressed raster format. Behaves the same as PNG (Portable
Network Graphics) for this purpose — embedded as a data: URL, scaled
to fit the hole.

### The data: URL (Uniform Resource Locator)

A `data:` URL (Uniform Resource Locator) is a string that contains the
file's bytes inline, encoded in Base64. The advantage for this app:
the logo never leaves the browser. Everything happens in memory, the
SVG (Scalable Vector Graphics) of the QR (Quick Response) code carries
the logo bytes as text, and the export is a single self-contained
file — no external references, no server round-trips.

### Export choices

| Export | Underneath | When to use |
|---|---|---|
| SVG (Scalable Vector Graphics) | The composed `<svg>` saved as-is | Print, web, anywhere that handles SVG natively. Sharp at any size. |
| PNG (Portable Network Graphics) | The SVG rasterised onto a canvas at the resolution you pick | Anywhere that expects an image file: WhatsApp, Word, slides, packaging |

The PNG (Portable Network Graphics) export rasterises the **same** SVG
(Scalable Vector Graphics) at the resolution you chose, so the QR
(Quick Response) code stays crisp at 2048×2048 even if the logo input
was tiny — what limits you is the logo's own resolution, if it was a
raster file to begin with.

---

## 6. Practical sizes in this app

The size slider maps to **module cells**, not percentages. It snaps to
the discrete sizes that actually change the rendered output —
typically 3, 5, 7, sometimes 9 cells across.

- **3-cell** logo: ~12-16 % of the QR (Quick Response) code. Subtle.
  Scannable at every EC (error correction) level.
- **5-cell** logo: ~20-23 %. The sweet spot. Triggers the app to
  auto-bump EC (error correction) to H.
- **7-cell** logo: ~28-30 %. Bold. EC (error correction) level H
  required. Test before printing — at 30 % you're at the ceiling.

The 20 % threshold is the line where the app starts auto-bumping EC
(error correction) to H. Below it, M is safe; above it, H is the only
level with enough redundancy to recover the modules under the logo.

---

## 7. What can actually break

- **Logo too big for the EC (error correction) budget.** The QR
  (Quick Response) code prints, but no scanner can read it. The live
  preview might still show a green "scannable" badge while real phones
  fail. The app's auto-bump catches the common case; the 30 % ceiling
  catches the rest.
- **Logo bleeds into a finder pattern.** The three corner squares are
  what the scanner uses to locate the code. If anything is drawn on
  top of one, the code becomes invisible to scanners. The library
  prevents this by anchoring the hole to the centre — you'd have to
  break a lot of things to make it happen.
- **Quiet zone eaten.** Every QR (Quick Response) code needs a margin
  of empty space around it (called the **quiet zone**). The app's
  "margin" control governs this. Setting it to 0 makes the code hard
  to find against a busy background. The default of 12 px works on
  screen and in print.
- **Low contrast.** The QR (Quick Response) code needs a contrast
  ratio of at least 3:1 between foreground and background. Pastel on
  pastel looks pretty and fails to scan. The scannability assessor in
  the app flags this before you export.

---

**In one sentence:** a QR (Quick Response) code is a grid that already
plans to be partly destroyed; the logo is just the destruction you
chose.
