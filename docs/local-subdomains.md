# Local development across Aliv subdomains

In production, every Aliv app lives on its own subdomain of `aliv.<tld>`
(e.g. `jsonxml.aliv.app`, `qrcode.aliv.app`). The shared theme cookie is
scoped to the apex domain so a theme change in one app persists across
every other Aliv app the user opens.

In dev this needs hostname mapping. Each app's Vite dev server runs on a
different port (json-xml `5173`, qrcode `5174`, web `5175` by
convention), and pointing them all at `*.aliv.local` lets the
apex-scoped cookie match every subdomain just like in production.

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
