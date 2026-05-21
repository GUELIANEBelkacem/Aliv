# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**Aliv** is a multi-app platform of privacy-first, no-upload, dark-themed
web utilities. Each app lives on its own subdomain in production
(`jsonxml.aliv.<tld>`, `qrcode.aliv.<tld>`, etc.) and shares a single
visual identity, header, theme, and app-switcher chrome via
`@aliv/ui`'s `AppShell`.

As of v0.1.0 the platform ships with three apps:
- `apps/json-xml` — JSON ↔ XML converter (the original tool, refactored)
- `apps/qrcode` — customizable QR generator (9 content types, gradients,
  shapes, logo embed, PNG/SVG export)
- `apps/web` — apex landing page that lists every Aliv app

A fourth app, `hashgen`, is registered as `comingSoon` and the queued
next build.

## Layout

```
aliv/
├── apps/
│   ├── json-xml/          # @aliv/json-xml
│   ├── qrcode/            # @aliv/qrcode
│   └── web/               # @aliv/web (apex landing)
├── packages/
│   ├── ui/                # @aliv/ui — shared chrome (AppShell,
│   │                      #          AppSwitcher, Logo, Drawer,
│   │                      #          ShortcutsModal, theme store,
│   │                      #          tokens.css, accents.css, registry)
│   └── e2e/               # @aliv/e2e — Playwright suite spanning all 3 apps
├── docs/local-subdomains.md  # cross-subdomain cookie sync setup
├── ALIV_PLATFORM.md       # platform vision + decisions log
├── PLATFORM_BUILD_PLAN.md # phase-by-phase build plan (executed)
├── BASELINE.md            # pre-refactor snapshot (Phase 0.1)
├── README.md              # contributor README
├── package.json           # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json     # strict TS baseline; per-app tsconfigs extend it
```

## Tooling

- pnpm 9 workspaces
- React 19 + Vite 8 + Vitest 4
- TypeScript strict, eslint flat config, no preprocessor
- jsdom + @testing-library/react for unit tests
- Playwright (chromium) for e2e

## Commands (run from repo root)

```bash
pnpm install              # all workspaces
pnpm dev                  # alias for json-xml dev server
pnpm dev:json | dev:qr | dev:web
pnpm -r build             # build every app
pnpm -r test              # all unit tests
pnpm -r lint
pnpm -r typecheck
pnpm e2e                  # Playwright suite (requires `pnpm -r build` first)
```

Filter to a single workspace: `pnpm --filter @aliv/qrcode test`.

## Architecture decisions

- **Shared chassis, per-app accent.** `packages/ui/src/tokens/tokens.css`
  defines bg/surface/border/text/spacing/type. `accents.css` defines
  the per-app `--accent` keyed by `data-app="<id>"` on `<html>`. The
  leaf logo in the header inherits via `currentColor`.
- **One AppShell to rule them.** Every app wraps its content in
  `<AppShell appId="..." settings={...} shortcuts={...}>`. The shell
  owns header chrome, theme toggle, settings drawer, shortcuts modal,
  and app switcher.
- **App registry is the source of truth.**
  `packages/ui/src/registry/app-registry.ts` lists every app
  (`web` / `json-xml` / `qrcode` / `hashgen`) with its accent and
  subdomain. Both `AppSwitcher` and `apps/web/AppGrid` consume it; any
  change ripples everywhere.
- **No backend.** Every transformation runs in-browser. Theme is the
  only shared cross-app state; it's stored in an apex-domain cookie
  (with a localStorage fallback) so subdomain navigation preserves
  light/dark.

## Adding a new app

1. Copy `apps/web/` to `apps/<id>/` as the smallest baseline.
2. Edit `package.json`: rename to `@aliv/<id>`; keep the
   `"@aliv/ui": "workspace:*"` dep.
3. In `main.tsx` import `@aliv/ui/{tokens,accents,shell}.css` before
   the app's own CSS.
4. Wrap the body in `<AppShell appId="<id>">`. Register the new app id
   in `packages/ui/src/registry/app-registry.ts`. Set its accent.
5. `pnpm install` (workspace symlink) then run tests.

## Phase log

Every phase landed as a single conventional-commit on the
`phase/0.1-preflight` branch. Refer to git history for the boundaries.
The plan that drove these is `PLATFORM_BUILD_PLAN.md`.

## Test totals

| Workspace | Unit tests |
|---|---|
| @aliv/ui | 54 |
| @aliv/json-xml | 201 |
| @aliv/web | 7 |
| @aliv/qrcode | 174 |
| **Total unit** | **436** |
| @aliv/e2e (Playwright) | 91 specs (76 active, 15 skipped) |

## Performance budgets (current)

| App | JS gzipped | LCP target |
|---|---|---|
| json-xml | 224 KB (CodeMirror dominates — known) | < 2.5s |
| qrcode | 94 KB | < 2.5s |
| web | 64 KB | < 2.5s |

The json-xml gzipped JS overshoots the 200 KB budget; mitigation is
deferred (likely via dynamic import of CodeMirror's larger packages).
