# Deploying Aliv to `aliv-kit.app` on Cloudflare Pages

This is a beginner-friendly, end-to-end guide. Follow it top to bottom
and you will have the platform live in 30–45 minutes.

You'll create **three** Cloudflare Pages projects (one per app),
connect each to the same GitHub repo, and wire each to its own
subdomain on `aliv-kit.app`. Cloudflare Pages is free for everything
this project needs.

## What the final setup looks like

| URL                          | App         | Cloudflare Pages project |
|------------------------------|-------------|---------------------------|
| `aliv-kit.app`               | apex (web)  | `aliv-web`                |
| `qrgen.aliv-kit.app`         | qrcode      | `aliv-qrgen`              |
| `jsonxml.aliv-kit.app`      | json-xml    | `aliv-jsonxml`           |

> One Pages project per app — keeps builds independent, gives each its
> own subdomain in a single click, and lets you redeploy one without
> rebuilding the others.

## Prerequisites

- Cloudflare account with `aliv-kit.app` registered (done ✔)
- GitHub account
- The Aliv repo committed locally — Cloudflare Pages connects to a
  GitHub repo and auto-deploys on every push
- Node 20+ and pnpm 9 installed locally (only needed if you want to
  re-run the build before pushing — Cloudflare will build for real)

## Step 1 — Confirm the code is deploy-ready

The following changes are already in your working tree (you don't need
to make them, just review and commit):

1. **`packages/ui/src/registry/app-registry.ts`** — production
   subdomains and default TLD wired up:
   - `json-xml` → `jsonxml`
   - `qrcode` → `qrgen`
   - `appUrl()` default `tld` → `aliv-kit.app`
2. **`packages/ui/src/components/AppShell.tsx`** — the brand link in
   the header now uses `appUrl(getApp('web'), tld)` so clicking the
   leaf always goes back to apex (works in dev and prod automatically).
3. **`apps/<app>/public/_redirects`** (three files) — each contains
   `/*    /index.html   200`. This is the SPA fallback so deep links
   like `aliv-kit.app/anything` still serve `index.html` instead of a
   404. Cloudflare Pages reads this file at build time.
4. **`.nvmrc`** at repo root pinning Node `20` — Cloudflare Pages
   reads it to pick the right Node version for builds.

Commit and push everything:

```bash
git add -A
git commit -m "chore: wire production URLs + Cloudflare Pages config"
git push
```

If your repo isn't on GitHub yet, do this first:

1. Visit <https://github.com/new>
2. Name it (e.g. `aliv`), keep it Private if you like, **don't** add a
   README (you already have one)
3. Run the "push existing repository" commands GitHub shows you:

   ```bash
   git remote add origin https://github.com/<your-username>/aliv.git
   git branch -M main
   git push -u origin main
   ```

## Step 2 — Create the first Pages project (apex / `aliv-web`)

1. Sign in to <https://dash.cloudflare.com>.
2. In the left sidebar click **Workers & Pages**.
3. Click **Create application** → switch to the **Pages** tab →
   **Connect to Git**.
4. Click **Connect GitHub** (or **GitLab**) and authorise Cloudflare
   to read your account. Pick the `aliv` repo and click **Begin
   setup**.
5. Fill in the form exactly like this:

   | Field                     | Value                                                                  |
   |---------------------------|------------------------------------------------------------------------|
   | **Project name**          | `aliv-web`                                                             |
   | **Production branch**     | `main`                                                                 |
   | **Framework preset**      | *None* (the build command below handles everything)                    |
   | **Build command**         | `pnpm install --frozen-lockfile && pnpm --filter @aliv/web build`      |
   | **Build output directory**| `apps/web/dist`                                                        |
   | **Root directory**        | *(leave blank — repo root)*                                            |

6. Expand **Environment variables (advanced)** and add **one**
   variable for the production environment:

   - Variable name: `NODE_VERSION`
   - Value: `20`

7. Click **Save and Deploy**.

The first build takes 2–4 minutes. When it finishes you'll see a URL
like `https://aliv-web.pages.dev` — open it and confirm the landing
page renders. (Cross-app links will still 404 for now; that's fine —
they need the real subdomains, set up in Step 4.)

## Step 3 — Repeat for the two app projects

Hit **Workers & Pages → Create application → Pages → Connect to Git**
twice more, picking the same `aliv` repo each time. Use these settings:

**Project `aliv-qrgen`:**

| Field                     | Value                                                                    |
|---------------------------|--------------------------------------------------------------------------|
| Project name              | `aliv-qrgen`                                                             |
| Production branch         | `main`                                                                   |
| Build command             | `pnpm install --frozen-lockfile && pnpm --filter @aliv/qrcode build`     |
| Build output directory    | `apps/qrcode/dist`                                                       |
| `NODE_VERSION` env var    | `20`                                                                     |

**Project `aliv-jsonxml`:**

| Field                     | Value                                                                       |
|---------------------------|-----------------------------------------------------------------------------|
| Project name              | `aliv-jsonxml`                                                             |
| Production branch         | `main`                                                                      |
| Build command             | `pnpm install --frozen-lockfile && pnpm --filter @aliv/json-xml build`      |
| Build output directory    | `apps/json-xml/dist`                                                        |
| `NODE_VERSION` env var    | `20`                                                                        |

Wait for both to finish their first deploy. You should now have three
projects in **Workers & Pages**, each with a green build, each with a
`*.pages.dev` URL.

## Step 4 — Wire the custom domains

This is the step that makes `aliv-kit.app`, `qrgen.aliv-kit.app`, and
`jsonxml.aliv-kit.app` actually point at your three projects.

### Apex (`aliv-kit.app` + `www.aliv-kit.app`)

1. Open the `aliv-web` Pages project.
2. Click the **Custom domains** tab.
3. Click **Set up a custom domain** → enter `aliv-kit.app` →
   **Continue**.
4. Cloudflare detects the domain is in your account and offers to
   create the DNS record automatically. Click **Activate domain**.
5. Repeat the same flow with `www.aliv-kit.app` — Cloudflare will set
   up `www` to redirect to the apex.

### qrcode subdomain (`qrgen.aliv-kit.app`)

1. Open the `aliv-qrgen` Pages project → **Custom domains** tab.
2. **Set up a custom domain** → enter `qrgen.aliv-kit.app` → **Continue**
   → **Activate domain**.

### json-xml subdomain (`jsonxml.aliv-kit.app`)

1. Open the `aliv-jsonxml` Pages project → **Custom domains** tab.
2. **Set up a custom domain** → enter `jsonxml.aliv-kit.app` →
   **Continue** → **Activate domain**.

DNS usually propagates within a minute when the domain is on the same
Cloudflare account. SSL certificates are issued automatically — you
don't need to touch them.

## Step 5 — Verify

Open each URL in a fresh window (or incognito):

- <https://aliv-kit.app> → green leaf, landing page, three app cards
- <https://qrgen.aliv-kit.app> → QR generator
- <https://jsonxml.aliv-kit.app> → JSON ↔ XML converter

Check the cross-app navigation:

- On the apex page, click any app card → opens the matching subdomain
- On any app, click the **grid icon** (top right) → app switcher shows
  tiles for the other apps; clicking one navigates correctly
- On any app, click the **leaf logo** (top left) → goes back to apex
- Toggle the theme on one subdomain, navigate to another — theme should
  persist (the cookie is scoped to `.aliv-kit.app`)
- Each tab favicon shows the right colour: green leaf for apex, cyan
  modules for qrgen, amber `{` + purple `>` for jsonxml

If any of these fail, see **Troubleshooting** below.

## Step 6 — Going forward

Every push to `main` auto-deploys. The workflow from here:

1. Make changes locally on a feature branch
2. Open a PR if you want preview deploys (Cloudflare automatically
   builds previews for every PR — each project shows the preview URL
   in the PR's checks)
3. Merge to `main` → all three Pages projects rebuild and deploy
4. Live within 2–3 minutes per project

You don't need to touch the Cloudflare dashboard again unless you
change build settings.

## Costs

Everything in this setup is free on Cloudflare's free Pages tier:

- 500 builds per month per account (each push triggers 3 builds, so
  you can push ~160 times a month before hitting the cap)
- Unlimited bandwidth and requests
- Unlimited custom domains
- Automatic SSL

You only pay for the domain itself (`aliv-kit.app` annual renewal,
≈ $13/year on Cloudflare).

## Troubleshooting

**Build fails with `command not found: pnpm`**
Cloudflare didn't detect pnpm. Check that `pnpm-lock.yaml` is committed
at the repo root. Workaround: add `PACKAGE_MANAGER=pnpm` as an
environment variable in the Pages project settings.

**Build fails with strange Node syntax errors**
Forgot the `NODE_VERSION=20` env var. Add it under **Settings →
Environment variables (Production)** and click **Retry deployment** on
the failed build.

**Build succeeds but the page is blank / shows raw `index.html`**
The Build output directory is wrong. Double-check it points at the
specific app's `dist`, not the repo root:
- `aliv-web` → `apps/web/dist`
- `aliv-qrgen` → `apps/qrcode/dist`
- `aliv-jsonxml` → `apps/json-xml/dist`

**Custom domain stuck on "verifying"**
Wait 5 minutes (DNS propagation can be slow even inside Cloudflare).
If still stuck, go to **Websites → aliv-kit.app → DNS → Records**,
find the auto-created `CNAME` pointing at `<project>.pages.dev`, delete
it, then re-add the custom domain in the Pages project.

**Subdomain works but deep links (e.g. `/anything`) show a 404**
The `_redirects` file is missing or wrong. Verify each app has
`apps/<app>/public/_redirects` containing exactly:
```
/*    /index.html   200
```
Commit, push, wait for rebuild.

**Old favicon still showing in the tab**
Browsers cache favicons aggressively. Hard reload (`Ctrl+Shift+R` /
`Cmd+Shift+R`) or open the URL in an incognito window.

**Cross-app navigation goes to `localhost` from the live site**
This shouldn't happen because the registry's `isDevHost()` check
returns `false` outside `localhost`. If it does, you're probably
viewing a `*.pages.dev` URL (which Cloudflare also treats as non-local
but if you somehow accessed it via a hosts-file mapping…). Always test
on `aliv-kit.app` and its subdomains, not on the `*.pages.dev` URLs.

**Need to roll back a bad deploy**
In the Pages project, click **Deployments** → find the previous good
deployment → **⋯ menu → Rollback to this deployment**. Live within
seconds. Then fix the issue on `main` and push again.

## What to keep an eye on

- **Build minutes**: 500/month is plenty for hobby use, but if you push
  often (especially with PRs producing preview builds), keep an eye on
  it in **Workers & Pages → Account-level → Usage**.
- **Domain renewal**: Cloudflare auto-renews by default, but check
  that the card on file is current before the annual renewal date.
- **Lighthouse scores**: each app's perf budget is set in `CLAUDE.md`.
  After deploy, run Lighthouse on the live URL and confirm:
  - `aliv-kit.app` LCP < 2.5s
  - `qrgen.aliv-kit.app` LCP < 2.5s
  - `jsonxml.aliv-kit.app` LCP < 2.5s

That's it — `aliv-kit.app` is live and self-maintaining.
