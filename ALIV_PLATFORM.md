# Aliv — Platform Vision

This document defines the platform-level vision that supersedes the previous "single JSON↔XML app" framing. All future architecture and design decisions roll up to this.

## What Aliv is

**Aliv** is a multi-app platform of polished, privacy-first, no-upload, dark-themed web utilities. Each utility is a standalone app reachable on its own subdomain, but all apps share a single visual identity, navigation pattern, and chrome.

Positioning: a coherent, branded **suite** — not a 40-tool grab-bag like it-tools or Toolpod, and not a series of unrelated single-purpose pages. The user should feel they are inside the same product whether they're converting JSON, generating a QR code, or hashing a string.

## Brand identity

### Logo
- **Source files**: `C:\Users\moham\Desktop\projects\Design\logo_green.png`, `logo_white.png`, `logo.pdn` (paint.net source).
- **Concept**: Stylized leafy sprig / 5-leaf plant — organic, living, growing. Distinct from typical geometric/techy dev-tool logos.
- **Primary color**: Olive green (sampled from `logo_green.png`). White silhouette variant for dark backgrounds.
- **TODO (Phase 0)**: Convert PNG to clean **single-color SVG** where the fill is driven by `currentColor` or a CSS variable, so the same SVG can be tinted per app. Place SVG copies at:
  - `C:\Users\moham\Desktop\projects\Design\logo.svg` (master, untinted)
  - `packages/ui/assets/logo.svg` (consumed by all apps)
- **TODO**: Define wordmark — does "Aliv" appear next to the leaf in the header, or is the leaf alone the lockup? Open question.

### Color direction — per-app theming
The platform follows a **shared chassis, per-app accent** model (Google-suite style). Every app uses identical:
- Background tone (deep, neutral near-black)
- Surface, border, text, and muted-text tokens
- Typography, spacing, button shapes, transitions

What changes per app is a single **`--accent`** color (and its derived hover/glow/syntax variants). The leaf logo recolors to match — the silhouette stays constant, but its fill is set to each app's accent. This means the app switcher displays an instantly-recognizable color-coded grid of leaves, and each app feels distinct without breaking brand cohesion.

The logo's current olive-green is treated as **suggestive, not binding** — it can shift to whatever color best serves the platform once we rebuild it as SVG. Likely the logo's *neutral* form (used on the platform landing and in marketing) will be a single brand green, while in-app each leaf takes the app's accent color.

#### Proposed initial palette set

| App | Accent (hex) | Rationale |
|---|---|---|
| **Aliv platform** (`aliv.<tld>`) | Brand green `#4ade80` (emerald) | The leaf identity at full strength. Used for platform landing and as the default "no app yet" color. |
| **JSON ↔ XML** | Indigo `#7c8cf5` (current) | Keep — the app already ships in this color. Reads as "data / structure." |
| **QR code generator** | Cyan `#22d3ee` | Fresh, "scannable" feel. Maximum contrast distance from the indigo of JSON↔XML. |
| **Hash generator** | Amber `#f59e0b` | Cryptographic / "alchemy" feel. Warm contrast against the cooler tones of the other apps. |

These four sit on a 12-stop hue wheel roughly 90° apart, which gives the app-switcher grid strong visual separation. New apps slot into the remaining hue gaps (rose, violet, lime, etc.) so the platform can grow to ~8 apps before colors start crowding.

#### Token structure

Each app exposes one accent value; everything else is computed:

```
--accent           (the per-app color)
--accent-hover     (8% lighter)
--accent-muted     (40% opacity, for backgrounds and borders)
--accent-glow      (button-glow shadow color)
--accent-syntax    (used by CodeMirror / inline code where applicable)
```

Shared (identical across all apps):
```
--bg, --surface, --surface-elevated, --border, --border-subtle,
--text, --text-muted, --text-faint, --danger, --warning, --success,
font stack, radii, spacing, transitions
```

#### Background
Confirmed: keep a single platform-wide near-black background (slightly warmer than the current `#0c0d12` to better complement warm accents like amber). All apps share it.

### Typography & shape language
Inherit from current app: same font stack, 6px button radius, 32px control height, 0.15s transitions. **Do not redesign these** — they are working.

## Architecture

### Subdomain model
Each app lives on its own subdomain of the Aliv apex domain. **Naming convention: descriptive multi-word** (clearer at the cost of a few extra characters).

- `aliv.<tld>` — platform landing page (lists all apps, marketing/about)
- `jsonxml.aliv.<tld>` — JSON ↔ XML converter
- `qrcode.aliv.<tld>` — QR code generator
- `hashgen.aliv.<tld>` — hash generator
- …one subdomain per future utility

**TLD**: deferred. Build with placeholder/relative URLs; choose before Phase 1 deploy.

### Repo layout (monorepo)
Confirmed in previous step: monorepo with shared package. Refined for the Aliv vision:

```
Aliv/                                  (repo root)
├── apps/
│   ├── web/                           # aliv.<tld> — platform landing
│   ├── json-xml/                      # current JsonToXML moved here
│   ├── qr-code/                       # next build
│   └── hash/                          # queued
├── packages/
│   └── ui/                            # shared design system
│       ├── tokens/                    # CSS custom properties
│       ├── components/                # AppShell, AppSwitcher, ThemeToggle, Button, SettingsDrawer, etc.
│       ├── hooks/                     # useTheme, useShortcuts, useCopyFeedback
│       └── assets/                    # logo.svg, favicons
├── package.json                       # workspace root
└── …
```

### Deployment model
Each `apps/*` builds independently and deploys to its own subdomain. Vercel / Netlify / Cloudflare Pages all support this with one project per app pointing at the same monorepo. The shared `packages/ui` is consumed via workspace symlinks at build time.

**Hosting**: deferred. Build host-agnostic; pick during Phase 1 when first deploy happens.

### Workspace tooling
**pnpm workspaces** (locked). Faster installs, stricter dep resolution, smaller node_modules via content-addressed store. Replaces the existing per-app npm install with `pnpm install` at the repo root.

## App switcher (Google-style)

### Behavior
- A grid-icon button in the top-right of every app's header (next to settings / theme toggle).
- Clicking opens a popover/dropdown with a grid of app tiles.
- Each tile: app icon (a unique glyph per app) + app name + short tagline on hover.
- **Each tile is a real `<a target="_blank" rel="noopener">` link** — apps always open in a new tab so the user's current work is preserved. (Ctrl/Cmd+click would also open a new tab, matching browser convention naturally.)
- The current app is visually marked (highlighted border or muted state).
- Keyboard accessible: arrow keys, Enter to launch, Esc to close.
- Mobile: full-screen sheet instead of small popover.

### App registry
A single source of truth shared by all apps lives in `packages/ui/app-registry.ts`:
```ts
export const apps = [
  { id: 'json-xml', name: 'JSON ↔ XML', tagline: '…', url: 'https://json.aliv.<tld>', icon: ... },
  { id: 'qr-code',  name: 'QR Generator', tagline: '…', url: 'https://qr.aliv.<tld>',   icon: ... },
  ...
]
```
Adding a new app is one entry in this file plus its own subfolder in `apps/`.

### Cross-subdomain settings sync
**Locked: global sync.** Theme (light/dark), language, and other shared prefs persist when switching apps. App-specific settings (e.g. JSON conversion toggles, QR style presets) stay per-app. Implementation: a small shared-storage layer — an iframe on the apex domain (`aliv.<tld>`) that each app reads from / writes to via `postMessage`, falling back to per-app `localStorage` if the iframe can't load.

## Unified UI identity — `AppShell`

A shared `AppShell` component in `packages/ui` provides every app's frame:
```
┌──────────────────────────────────────────────────────────┐
│ [Aliv leaf logo]  [App name]        [⌘]  [⚙]  [▦]  [☀/🌙]│   ← shared header
├──────────────────────────────────────────────────────────┤
│                                                          │
│                  (app content here)                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ [status / footer slot]                                   │   ← shared footer/status
└──────────────────────────────────────────────────────────┘
```

Header items, left-to-right:
- **Leaf logo** (in current app's accent color) + **"aliv" wordmark** (neutral) + **vertical divider** + **app name** (muted). Full lockup: `[🌿 aliv | JSON ↔ XML]`.
  - Clicking the leaf/wordmark goes to `aliv.<tld>` (platform landing).
- *(spacer)*
- *(Right side)*
- **Shortcuts (⌘)**: opens the keyboard-shortcut modal (already exists in JsonToXML).
- **Settings (⚙)**: opens the settings drawer with app-specific settings.
- **App switcher (▦)**: the Google-style grid menu described above.
- **Theme toggle (☀/🌙)**: light/dark.

Each app injects its own toolbar/content beneath the header, but the header itself is non-negotiable across the platform.

## Migration plan (re-ordered from previous NEXT_STEPS.md)

The platform-ification must come **before** building new apps, otherwise the new apps will be born outside the brand and need rework. Updated build order:

### Phase 0 — Monorepo + brand refactor *(do first)*
1. Convert root to monorepo (npm workspaces).
2. Move existing JSON↔XML app to `apps/json-xml/`.
3. Convert logo PNG → SVG, place in `packages/ui/assets/` and back in `Design/`.
4. Define new color tokens (green accent) in `packages/ui/tokens/`.
5. Build `AppShell`, `AppSwitcher`, `ThemeToggle` components in `packages/ui`.
6. Refactor JSON↔XML to consume `AppShell` and the new tokens. (Validates the shared layer before any new app uses it.)

### Phase 1 — Platform landing
1. Create `apps/web/` — the `aliv.<tld>` landing page.
2. Hero, app grid (driven by the same `app-registry.ts`), about, links.
3. Lightweight — primarily a directory + brand statement.

### Phase 2 — QR code generator
Build per the spec already locked in (see `NEXT_STEPS.md`), but now seated inside `AppShell` from day one.

### Phase 3 — Hash generator
Same pattern.

## Decisions log

| Decision | Choice |
|---|---|
| Repo layout | Monorepo: `apps/*` + `packages/ui` |
| Workspace tool | pnpm workspaces |
| Subdomain naming | Multi-word descriptive (`jsonxml.aliv.<tld>`, `qrcode.aliv.<tld>`, `hashgen.aliv.<tld>`) |
| Header lockup | `[🌿 aliv | App Name]` — leaf in app accent + neutral wordmark + muted app name |
| App switcher behavior | Always opens new tab (`<a target="_blank">`) |
| Theme/settings sync | Global sync via apex-domain iframe + postMessage; app-specific settings stay per-app |
| Per-app palette | Approved as proposed: Aliv `#4ade80`, JSON↔XML `#7c8cf5`, QR `#22d3ee`, Hash `#f59e0b` |
| Color/theme model | Shared chassis (background, surfaces, type, spacing); per-app `--accent` token drives buttons/glow/logo tint |

## Still deferred

- **TLD** — pick `.dev` / `.app` / `.tools` / etc. before Phase 1 deploy. Build with placeholder URLs in the meantime.
- **Hosting** — Vercel / Cloudflare Pages / Netlify decision deferred to Phase 1.
- **Logo SVG conversion** — Phase 0 task. Single-color, `currentColor`-driven so each app can tint it.
