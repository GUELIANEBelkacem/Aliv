# Local development across Aliv subdomains

In production, every Aliv app lives on its own subdomain of `aliv.<tld>`
(e.g. `jsonxml.aliv.app`, `qrcode.aliv.app`). The shared theme cookie is
scoped to the apex domain so a theme change in one app persists across
every other Aliv app the user opens.

## The simple path: `localhost` with fixed ports

`appUrl()` detects when the current page is on `localhost` /
`127.0.0.1` and routes the AppSwitcher tiles to fixed dev ports
instead of the production `https://<sub>.aliv.<tld>` URLs. Each app's
Vite dev server is pinned via `server.port` + `strictPort`:

| App | Dev port | Preview port |
|---|---|---|
| json-xml | 5173 | 4001 |
| qrcode   | 5174 | 4002 |
| web      | 5175 | 4003 |
| hashgen  | 5176 (when added) | — |

`pnpm dev` (from the repo root) starts all three apps in parallel.
Click the leaf app-switcher in any of them and the tile opens the
matching localhost port — no hosts file needed.

## When you DO want the apex cookie path (cross-app theme sync)

The localhost path is convenient but uses a different origin per app,
so cookies are scoped per-port and the apex-domain theme cookie can't
follow you. To exercise the production path locally, set up the
hostnames below.

## Setup

### Windows

Edit `C:\Windows\System32\drivers\etc\hosts` (administrator) and add:

```
127.0.0.1   aliv.local
127.0.0.1   jsonxml.aliv.local
127.0.0.1   qrcode.aliv.local
127.0.0.1   hashgen.aliv.local
```

### macOS / Linux

```bash
sudo sh -c 'cat >> /etc/hosts <<EOF
127.0.0.1   aliv.local
127.0.0.1   jsonxml.aliv.local
127.0.0.1   qrcode.aliv.local
127.0.0.1   hashgen.aliv.local
EOF'
```

## Run dev servers on the right hostnames

Each app's dev script binds to `0.0.0.0` so the hostname mapping picks
it up. Start them on distinct ports:

```bash
pnpm --filter @aliv/json-xml dev -- --host jsonxml.aliv.local --port 5173
pnpm --filter @aliv/qrcode  dev -- --host qrcode.aliv.local  --port 5174
pnpm --filter @aliv/web     dev -- --host aliv.local         --port 5175
```

Then open `http://jsonxml.aliv.local:5173`, `http://qrcode.aliv.local:5174`,
`http://aliv.local:5175`. Theme changes in any of them propagate to the
others on next navigation via the apex-scoped `aliv-theme` cookie.

## Why a cookie and not postMessage?

A cookie scoped to `.aliv.local` (and in production, `.aliv.<tld>`)
handles theme + language sync with no JS coordination, no iframe broker,
no `postMessage` round-trips. The fallback is `localStorage` for any
context where the cookie can't be written (e.g. when the app is opened
on `localhost` without the hostname mapping). Apps that fall through to
`localStorage` lose cross-subdomain sync but still preserve theme within
their own subdomain.

If we ever need to sync something more complex than a single string
preference, the iframe-broker pattern is the next step — but until then
the cookie is enough.
