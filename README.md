# Aliv

A small personal collection of privacy-first, no-upload web utilities.
Everything runs in the browser — no servers, no tracking, no accounts.
Dark theme by default.

Lives at [aliv-kit.app](https://aliv-kit.app).

## What's in it

| App | URL | What it does |
|-----|-----|--------------|
| Aliv | [aliv-kit.app](https://aliv-kit.app) | Landing page, lists the other apps |
| JSON ↔ XML | [jsonxml.aliv-kit.app](https://jsonxml.aliv-kit.app) | Convert and validate between the two formats |
| QR Generator | [qrgen.aliv-kit.app](https://qrgen.aliv-kit.app) | Customizable QR codes — 9 content types, gradients, shapes, logo embed, PNG/SVG export |

A hash generator is queued for later.

## Running locally

```bash
pnpm install
pnpm dev              # apex landing
pnpm dev:json         # json-xml
pnpm dev:qr           # qrcode
```

Each app builds independently: `pnpm --filter @aliv/<app> build`.

## Stack

pnpm workspaces, React 19, Vite 8, TypeScript, Vitest. Shared chrome
(`AppShell`, theme, accents) lives in `packages/ui`.
