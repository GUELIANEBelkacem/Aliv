# CLAUDE.md

Project guide for anyone (or any agent) working in this repo.

## What this is

**Aliv** is a small personal collection of privacy-first, no-upload,
dark-themed web utilities. Everything runs client-side — no backend,
no tracking. Each app lives on its own subdomain and shares a single
visual identity through `@aliv/ui`'s `AppShell`.

Production:

| Subdomain | App | Source |
|-----------|-----|--------|
| `aliv-kit.app` | apex landing | `apps/web` |
| `jsonxml.aliv-kit.app` | JSON ↔ XML converter | `apps/json-xml` |
| `qrgen.aliv-kit.app` | QR generator (9 content types, gradients, shapes, logo embed, PNG/SVG export) | `apps/qrcode` |

A fourth app, `hashgen`, is registered as `comingSoon` in the app
registry but has no `apps/hashgen/` yet.

## Layout

```
aliv/
├── apps/
│   ├── json-xml/          # @aliv/json-xml
│   ├── qrcode/            # @aliv/qrcode
│   └── web/               # @aliv/web (apex landing)
├── packages/
│   ├── ui/                # @aliv/ui — shared chrome
│   │                      #   AppShell, AppSwitcher, Logo,
│   │                      #   Drawer, theme store,
│   │                      #   tokens.css, accents.css, app-registry
│   └── e2e/               # @aliv/e2e — Playwright suite, all 3 apps
├── notes/                 # private planning docs (gitignored)
├── .nvmrc                 # Node 20 — Cloudflare Pages reads this
├── package.json           # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json     # strict TS baseline; per-app tsconfigs extend it
```

`notes/` holds older planning docs (the build plan, baseline,
deployment guide, per-app reviews). It's gitignored so it stays
local-only — if you need cross-subdomain cookie setup or the deploy
walkthrough, look there.

## Tooling

- pnpm 9 workspaces, Node 20+
- React 19 + Vite 8 + Vitest 4
- TypeScript strict, eslint flat config, no preprocessor
- jsdom + @testing-library/react for unit tests
- Playwright (chromium) for e2e

## Commands (from repo root)

```bash
pnpm install              # all workspaces
pnpm dev                  # alias for json-xml dev server
pnpm dev:json | dev:qr | dev:web
pnpm -r build             # build every app
pnpm -r test              # all unit tests
pnpm -r lint
pnpm -r typecheck
pnpm e2e                  # Playwright (requires `pnpm -r build` first)
```

Filter to one workspace: `pnpm --filter @aliv/qrcode test`.

## Architecture decisions

- **Shared chassis, per-app accent.**
  `packages/ui/src/tokens/tokens.css` defines bg / surface / border /
  text / spacing / type. `accents.css` defines the per-app `--accent`
  keyed by `data-app="<id>"` on `<html>`. UI elements that should tint
  to the app's accent (Logo, brand link, buttons) use `currentColor`.
- **One AppShell to rule them.** Every app wraps its content in
  `<AppShell appId="..." settings={...}>`. The shell owns header
  chrome, theme toggle, settings drawer, and the app switcher.
- **Per-app brand mark.** `Logo` takes `appId` and dispatches:
  `web` → pixel-traced leaf, `json-xml` → `{ <-> >` two-tone, `qrcode`
  → 5×5 modular grid, `hashgen` → upright `#`. AppShell, AppSwitcher,
  and the web AppGrid all pass `appId` so each surface shows the right
  mark, tinted by its accent.
- **App registry is the source of truth.**
  `packages/ui/src/registry/app-registry.ts` lists every app
  (`web` / `json-xml` / `qrcode` / `hashgen`) with its accent and
  subdomain. `appUrl()` returns the right URL for dev (localhost
  ports) and prod (`https://<sub>.aliv-kit.app`) automatically. Both
  `AppSwitcher` and `apps/web/AppGrid` consume the registry, so any
  change ripples everywhere.
- **No backend.** Every transformation runs in-browser. Theme is the
  only shared cross-app state — stored in an apex-domain cookie
  (`Domain=.aliv-kit.app`) with a localStorage fallback so subdomain
  navigation preserves light/dark.

## Gotchas worth remembering

- **`apps/json-xml/src/App.tsx` wraps content in `<div class="app-body">`.**
  The corresponding CSS rule is `.app-body { display: flex;
  flex-direction: column; flex: 1; min-height: 0; ... }` — it's a flex
  item inside `.aliv-shell-main`, not a viewport root. If you rename
  this class on either side and break the chain, the editor will
  collapse to 0 height on mobile (where `.panel` uses `position:
  absolute; inset: 0`).
- **Favicons need literal colors.** Browser chrome renders favicons
  outside the app's CSS scope, so `currentColor` falls back to black.
  Each `apps/<app>/public/favicon.svg` hard-codes the per-app accent
  hex.
- **`_redirects` in each app's `public/`** is the SPA fallback for
  Cloudflare Pages (`/* /index.html 200`). Without it, deep links
  return 404.

## Deployment

Three Cloudflare Pages projects, one per app, all connected to this
GitHub repo's `main` branch. Apex `aliv-kit.app` → `aliv-web`,
subdomains via the Pages "Custom domains" tab. Full step-by-step in
`notes/DEPLOY.md` (gitignored).

## Adding a new app

1. Copy `apps/web/` to `apps/<id>/` as the smallest baseline.
2. Edit `package.json`: rename to `@aliv/<id>`; keep the
   `"@aliv/ui": "workspace:*"` dep.
3. In `main.tsx` import `@aliv/ui/{tokens,accents,shell}.css` before
   the app's own CSS.
4. Wrap the body in `<AppShell appId="<id>">`. Register the new app id
   in `packages/ui/src/registry/app-registry.ts` with its subdomain
   and accent. Add the matching `data-app="<id>"` accent rule in
   `packages/ui/src/tokens/accents.css`. Add a `MarkFor` case in
   `packages/ui/src/components/Logo.tsx`.
5. `pnpm install`, run tests, create a Cloudflare Pages project for
   it with `<id>.aliv-kit.app` as the custom domain.

## Test totals

| Workspace | Unit tests |
|---|---|
| @aliv/ui | 54 |
| @aliv/json-xml | 201 |
| @aliv/web | 7 |
| @aliv/qrcode | 174 |
| **Total unit** | **436** |
| @aliv/e2e (Playwright) | 91 specs (76 active, 15 skipped) |

## Performance budgets

| App | JS gzipped | LCP target |
|---|---|---|
| json-xml | 224 KB (CodeMirror dominates — known) | < 2.5s |
| qrcode | 94 KB | < 2.5s |
| web | 64 KB | < 2.5s |

The json-xml gzipped JS overshoots the 200 KB budget; mitigation is
deferred (likely dynamic-importing CodeMirror's larger packages).
