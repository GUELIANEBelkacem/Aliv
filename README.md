# Aliv

A monorepo of privacy-first, no-upload, dark-themed web utilities. Every
app shares one chrome (`@aliv/ui`'s `AppShell`) and lives on its own
subdomain in production. Each app contributes only its content; the
header, theme toggle, settings drawer, shortcuts modal, and app
switcher come from the shared package.

```
aliv/
├── apps/
│   ├── json-xml/      # @aliv/json-xml — JSON ↔ XML converter
│   └── web/           # @aliv/web — platform landing page
├── packages/
│   └── ui/            # @aliv/ui — shared design system
├── docs/              # cross-cutting docs (e.g. local subdomain setup)
├── ALIV_PLATFORM.md   # platform vision + decisions log
├── PLATFORM_BUILD_PLAN.md  # phase-by-phase build plan
└── BASELINE.md        # pre-refactor snapshot (Phase 0.1)
```

## Requirements

- Node 20+
- pnpm 9+ (`corepack enable` or `npm install -g pnpm`)

## Common commands

All commands run from the repo root.

```bash
pnpm install              # install all workspace deps
pnpm dev                  # alias for the json-xml dev server
pnpm dev:json             # json-xml on its own
pnpm dev:web              # platform landing on its own
pnpm dev:qr               # QR generator (added in Part B)
pnpm -r build             # production build for every app
pnpm -r test              # run all unit tests
pnpm -r lint              # ESLint across all workspaces
pnpm -r typecheck         # TypeScript across all workspaces
pnpm e2e                  # Playwright e2e (added in Phase E.1)
```

Filter to a single workspace:

```bash
pnpm --filter @aliv/json-xml test
pnpm --filter @aliv/ui test
pnpm --filter @aliv/web build
```

## Adding a new app

1. `mkdir apps/<name>` and scaffold from one of the existing apps
   (`apps/web` is the smallest baseline — copy its `package.json`,
   `vite.config.ts`, `tsconfig.*`, `eslint.config.js`, `index.html`).
2. Set `name` to `@aliv/<name>` and add `"@aliv/ui": "workspace:*"` to
   dependencies.
3. In `main.tsx`, import `@aliv/ui/{tokens,accents,shell}.css` before
   any app-local CSS.
4. Wrap the app body in `<AppShell appId="<id>">` — the appId must
   exist in `packages/ui/src/registry/app-registry.ts`. Add an entry
   there if it's a new app, including the per-app accent color.
5. `pnpm install` to wire the workspace symlink, then `pnpm
   --filter @aliv/<name> test`.

## Architecture decisions

The big ones (full context in `ALIV_PLATFORM.md`):

- **Shared chassis, per-app accent.** Every app uses identical
  background, surfaces, type, and spacing tokens. Only `--accent`
  changes per app. The leaf logo recolors via `currentColor`.
- **Subdomain per app.** `jsonxml.aliv.<tld>`, `qrcode.aliv.<tld>`,
  etc. Each app builds independently; shared package is consumed via
  workspace symlink. See `docs/local-subdomains.md` for cross-app
  cookie sync in dev.
- **No backend.** Every transformation runs in the browser. No
  uploads, no analytics, no third-party fonts.

## Phase status

See `PLATFORM_BUILD_PLAN.md` for the full plan. Phases shipped so far
land in commits matching `chore(repo): phase 0.X` or `feat(<scope>):
phase 0.X`.
