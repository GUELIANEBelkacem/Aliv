# JSON↔XML Converter Portfolio: Where the Real Gaps Are

A deep-dive into underserved utilities, broken popular ones, and saturated-but-still-winnable categories — researched from Reddit/HN/Show HN traffic, indie-hacker writeups, and direct examination of incumbent tools.

## Macro signals before the list

- The "mega-suite" entrants (Toolpod, Prism.Tools, OneClickPDF, PixelTrim, RegexLab) are all explicitly positioned against ad-laden incumbents and "100% client-side / no upload" — that framing is now table stakes, not a differentiator.
- Devs are openly discouraging colleagues from using `jwt.io` and online JSON validators because tokens/data hit a server (Jamie Tanna's post on this still circulates). **Privacy-first is a wedge, not a nice-to-have.**
- crontab.guru's own most-cited weaknesses are ads, no timezone control, and no test/run feature — meaning even the genre-defining tool has obvious open lanes.
- Smallpdf and iLovePDF complaints (G2, Reddit) cluster on watermarks, daily limits, and pricing — but PDF is a hard bar to clear client-side, so it's a half-opportunity.

---

## Category 1: Underserved / Missing Utilities

### 1. HAR Sanitizer & Redactor
**What it does**: Loads a `.har` file in-browser, redacts auth tokens / cookies / PII, lets you share a clean version with support or coworkers.
**Why underserved**: HAR viewers exist (har-analyzer.dev, harviewer.toolsforge.pro) but they *view* — they don't help you scrub the file before forwarding it to a vendor's support team. Devs constantly complain about accidentally leaking session cookies in HAR files attached to bug reports.
**Differentiator**: Pattern library (Authorization headers, Set-Cookie, Bearer tokens, common JWT shapes, query-param API keys) + custom regex rules + diff view of "what got redacted". Export as `.har` or as a Markdown bug-report snippet.
**Difficulty**: 3/5. Fully client-side — HAR is just JSON.

### 2. Protobuf Decoder / Wire-Format Inspector
**What it does**: Paste a hex/base64 protobuf payload (with or without a `.proto` schema) and get a tree view, with field-number guesses when the schema is unknown.
**Why underserved**: Search results show Avro/Parquet viewers everywhere but protobuf has essentially no good browser tool — you're forced into `protoc --decode_raw` on a CLI. Reverse-engineering mobile-app traffic / gRPC debugging has no good web option.
**Differentiator**: Schema-less decoding (the killer feature — mirrors `protoc --decode_raw` but with a UI), schema upload for full decoding, varint/zigzag inspector pane.
**Difficulty**: 4/5. `protobufjs` works in-browser; the schema-less heuristic decoding is the hard part.

### 3. JSONL / NDJSON Workbench
**What it does**: Stream-parse large JSONL files (LLM training sets, log dumps) with line-by-line validation, schema inference across the whole file, jq-like filtering, conversion to CSV/Parquet-via-DuckDB-WASM.
**Why underserved**: Every JSON tool chokes on multi-line / streamed JSON. JSONL is now the dominant LLM dataset format and there's no decent inspector. Mockaroo, jsonformatter.org, JSONLint all assume a single document.
**Differentiator**: Handles 1GB+ files via streaming + virtualised scroll; per-line error highlighting; schema drift detector ("line 4823 has a new field `tool_calls`").
**Difficulty**: 4/5. Streaming + virtualisation in-browser is real engineering, but feasible.

### 4. Cron Builder With Timezones, Test Runs, and Calendar Preview
**What it does**: Crontab.guru, but with timezone-aware "next 20 fires" preview, DST edge-case warnings, calendar/heatmap visualisation, and side-by-side comparison of two expressions.
**Why underserved**: Crontab.guru has run on the same UI for ~10 years; the explicit weakness list (no timezones, ads, no calendar preview) is almost a feature spec. Cron syntax dialects (Quartz, Kubernetes, AWS EventBridge 6-field, GitHub Actions 5-field with restrictions) are a mess no one consolidates.
**Differentiator**: Dialect picker (Unix/Quartz/AWS/GitHub Actions/K8s) with per-dialect validation, IANA timezone preview, "diff two crons" view.
**Difficulty**: 2/5. Pure client-side, libraries exist (`cron-parser`, `cronstrue`).

### 5. JWT/JWE/PASETO/Branca Multi-Token Debugger
**What it does**: One tool that decodes JWT, JWE, PASETO v1-v4, Branca, Macaroons.
**Why underserved**: jwt.io still dominates but is widely distrusted (sends tokens server-side historically; Jamie Tanna's post discouraging it is canonical). Token.dev, jwt.is, GetDevUtils JWT all rebuild *just* JWT. PASETO/Branca/Macaroons have effectively zero browser tooling.
**Differentiator**: Full client-side, multi-format, key-rotation simulator (generate a kid'd JWKS and test verification), token diff (compare two JWTs side-by-side — useful when debugging refresh flows).
**Difficulty**: 3/5. Libraries are mostly browser-friendly (jose, paseto-js).

### 6. OpenAPI / JSON-Schema Visual Diff
**What it does**: Drop two OpenAPI specs (or two JSON Schemas) and get a semantic diff: added endpoints, removed params, type changes, breaking-change classification.
**Why underserved**: openapi-diff exists as a CLI; oasdiff is server-side; no clean web visualiser. Every API team eventually needs this for changelogs and breaking-change reviews.
**Differentiator**: Markdown/HTML changelog export, "is this a breaking change?" classifier (per OpenAPI semver rules), supports both Swagger 2 and OpenAPI 3.x.
**Difficulty**: 3/5. `@openapi-tools/openapi-diff` runs in browser; UX is the work.

### 7. Color-Contrast Audit for an Entire Palette / Design Token File
**What it does**: Paste a JSON of design tokens (or a Tailwind config, or a CSS variables block) and get a matrix of every fg/bg combination's WCAG/APCA contrast scores at once.
**Why underserved**: Coolors and Adobe Color check pairs, not full palettes. Designers building token systems test combinations one at a time. The Color Palette Lab is heading this way but is paid.
**Differentiator**: APCA *and* WCAG 2.2 side-by-side, ingest CSS-vars / Tailwind / Style Dictionary / Figma Variables JSON, downloadable failing-pairs report.
**Difficulty**: 2/5. Trivially client-side; the value is in input formats and matrix UX.

### 8. Regex Visualiser + Performance / ReDoS Profiler
**What it does**: Regex101 + railroad diagram + worst-case backtracking analysis (will this pattern ReDoS?).
**Why underserved**: Regex101 has the test bench; Debuggex and Regulex have visualisations but are abandoned/ugly. None warn about catastrophic backtracking, which is a top 10 production bug in Node/Python services.
**Differentiator**: ReDoS detector (use `safe-regex` or `recheck-wasm`), generate-string-from-regex (useful for fuzzing), railroad SVG export, side-by-side dialect comparison (PCRE vs ECMA vs Go vs RE2).
**Difficulty**: 4/5. ReDoS analysis itself is non-trivial but there are WASM ports.

### 9. SVG Path Editor / Optimizer with Visual Diff
**What it does**: SVGOMG, plus an interactive path editor (drag control points), plus a before/after pixel diff so you can see exactly what optimisation broke.
**Why underserved**: SVGOMG hasn't shipped meaningful UI changes in years; Vecta Nano warns about breakage but doesn't show you where. No tool combines optimisation with editing.
**Differentiator**: Pixel-overlay diff highlighting visual regressions from each SVGO plugin, undo per-plugin, animation timeline for animated SVGs.
**Difficulty**: 4/5. SVGO runs in-browser. Path editor is the hard part — but a v1 without editing still wins.

### 10. Privacy-First Image Metadata Stripper / EXIF Auditor
**What it does**: Drop any image and see *all* EXIF/IPTC/XMP metadata, with one-click strip + a redaction preview ("this photo has GPS coords, camera serial, original filename").
**Why underserved**: Most "remove EXIF" tools upload your image. iLovePDF / Smallpdf-style sites strip metadata server-side. Nobody wants to upload a phone photo to find out it leaks their home address.
**Differentiator**: 100% in-browser (essential for trust), highlights *sensitive* fields (GPS, serial, software path) vs benign ones, batch mode with zip export.
**Difficulty**: 2/5. `exifr` + `piexifjs` make this trivial.

### 11. CSV Lint / Validator (Not Just Formatter)
**What it does**: Validates a CSV for inconsistencies — variable column counts per row, encoding issues (UTF-8 BOM, mojibake), mixed delimiters, stray quotes, dates in mixed formats — and lets you fix them inline.
**Why underserved**: ConvertCSV/CSVJSON convert; nothing diagnoses. CSV is the most common interchange format in finance/ops/data and the existing "CSV lint" projects are dead CLI repos.
**Differentiator**: Streaming parse for big files, schema-inference + per-column type validation, "what row broke my parser" debug mode.
**Difficulty**: 3/5. PapaParse + DuckDB-WASM gets you 80% there.

### 12. iCalendar (.ics) Inspector + Repair Tool
**What it does**: Open an `.ics`, see all VEVENTs in a calendar grid, fix RRULE errors, validate against RFC 5545, export cleaned version.
**Why underserved**: Calendar-sync bugs are constant ("why is this recurring event one hour off"). There's no decent debugger; the closest is the unreadable ical.net validator.
**Differentiator**: Visual RRULE builder + plain-English explanation, timezone-shift simulator, "what does this look like in Google vs Outlook?" preview.
**Difficulty**: 3/5. `ical.js` works in-browser.

---

## Category 2: Poorly Executed Common Utilities

### 13. JSON Diff (semantic, not text)
**Status quo**: jsondiff.com is functional but ugly, jsonformatter.org's diff is ad-stuffed, jsoncompare.org is slow on large inputs, JSON Crack does great viz but no diff. SemanticDiff is good but limited.
**What "doing it right" looks like**: Three-pane (left/right/merged), array-aware diff with key-based matching (not positional), ignore-keys patterns, path filters, export as JSON Patch (RFC 6902). Side-by-side tree view with collapse/expand mirrored.

### 14. Crontab.guru Replacement
See entry #4 above. The incumbent's flaws are documented; this is a *won* category if you ship a clean version.

### 15. Image-to-Base64 / Base64-to-Image
**Status quo**: base64-image.de has a 1MB limit and shows banner ads; base64.guru is buried in ads; many "free" tools upload your image.
**What "doing it right" looks like**: No size limit (browser handles 50MB easily), data-URI output with mime detection, *reverse* mode (paste data URI → preview/download), "minify by re-encoding" option (svgo for SVGs, mozjpeg-wasm for JPGs), copy-as-CSS-bg snippet.

### 16. Favicon Generator
**Status quo**: realfavicongenerator.net is the gold standard but uploads images server-side and has gotten bloated. favicon.io is simpler but has limited options. Both nag about premium features.
**What "doing it right" looks like**: 100% client-side, generates the full modern set (SVG favicon + 32/16 PNG + apple-touch + maskable PWA + Safari pinned-tab mask), preview in a fake browser tab, dark-mode favicon variant, copy-paste HTML snippet.

### 17. URL / Query-String Parser
**Status quo**: Browserling, FreeFormatter, Site24x7 versions are all functional but ugly and ad-supported. Most don't handle modern needs (URL fragments with their own query strings, Matrix params, encoded plus signs).
**What "doing it right" looks like**: Tree breakdown of every URL component, two-way edit (edit a param, see the URL update), encode/decode toggle per param, "build a URL" mode, common-encoding-mistake detector (e.g. `%20` vs `+` in form vs path).

### 18. Mock Data Generator
**Status quo**: Mockaroo caps at 1000 rows free + 200 API requests/day, has account friction. JSON-Schema-Faker is library-only. JSONGenerator.io is dated.
**What "doing it right" looks like**: Faker.js v8/v9 in-browser (300+ types), schema-driven generation (paste a JSON Schema or TypeScript interface, get fake data), seedable RNG for reproducibility, no row cap (browser memory is the only limit), export JSON/CSV/SQL/JSONL.

### 19. SQL Formatter
**Status quo**: Several good options exist (PoorSQL, Aiven, sqlformatter.online) but they're either ugly or have minimal dialect customization. CodeBeautify and similar are ad-laden.
**What "doing it right" looks like**: 15+ dialects (already do-able with `sql-formatter` npm), dialect-specific lint warnings (e.g. "MySQL backticks won't work in Postgres"), inline EXPLAIN-plan friendly mode, save settings as URL hash for sharing config.

### 20. Markdown Editor / Previewer
**Status quo**: dillinger.io is dated; StackEdit is bloated and Google-Drive-coupled; markdownlivepreview.com is bare-bones. None handle GFM + Mermaid + footnotes + frontmatter cleanly together.
**What "doing it right" looks like**: GFM + Mermaid + KaTeX + admonitions + frontmatter validation, side-by-side scroll-sync, export to PDF/HTML/styled image, "render as GitHub vs GitLab vs Obsidian vs Notion" presets (the rendering differs!).

---

## Category 3: Common-but-Useful Tools (Worth Building Anyway)

These are high-volume search terms where a clean modern build still wins.

### 21. UUID / ULID / NanoID / KSUID Generator
SEO is owned by ugly single-purpose pages. A clean tool that generates *all* ID types (and explains the trade-offs — "use ULID for time-ordered, NanoID for short URL-safe") with bulk generation will rank. **Difficulty 1/5.**

### 22. Hash Generator (MD5/SHA-1/SHA-256/SHA-3/BLAKE2/BLAKE3)
Heavy organic search. Most existing tools omit BLAKE3 and HMAC variants. Web Crypto API + a BLAKE3 WASM build covers everything client-side. Add file hashing (drag a file, get its hash) — most online tools omit this. **Difficulty 2/5.**

### 23. Lorem Ipsum / Dummy Text Generator
Saturated but enormous traffic. Clean modern UI + variations (Bacon Ipsum, Hipster Ipsum, Cupcake Ipsum, "AI-flavored ipsum") + paragraph/word/character control + HTML-tagged output mode. **Difficulty 1/5.**

### 24. QR Code Generator (with Logo + Styling)
Most are watermarked or limited. A free, no-login styled QR generator (rounded modules, gradient, embedded SVG logo, error-correction control) gets organic traffic forever. **Difficulty 2/5.**

### 25. Color Picker / Converter (HEX / RGB / HSL / OKLCH / P3)
OKLCH and Display-P3 awareness is the new wedge — most existing pickers are stuck in sRGB. With CSS Color Module 4 mainstream, devs need OKLCH/lch/lab visualisers. **Difficulty 2/5.**

### 26. Epoch / Unix Timestamp Converter
Unkillable search volume. Differentiate with: live-updating "now", batch convert (paste a column of timestamps), millisecond/microsecond/nanosecond auto-detect, ISO 8601 / RFC 3339 / RFC 2822 toggles, timezone matrix. **Difficulty 1/5.**

### 27. URL Encode / Decode + Base64 + HTML Entities ("Encoding Swiss Army")
A single page with all encodings auto-detected from input is sticky. CyberChef does this but is intimidating; a simpler "smart" version wins for the 90% case. **Difficulty 2/5.**

### 28. YAML ↔ JSON ↔ TOML Converter
Natural sibling to your JSON↔XML tool. All three formats round-trip cleanly with `js-yaml` / `@iarna/toml`. Add JSON5 and HJSON. **Difficulty 1/5.**

---

## If I were you, I'd build these next 5 in this order

You already have a polished, dark-themed, real-time converter with CodeMirror. The following maximize *re-use of your existing chrome* (toolbar, two-pane layout, settings drawer, status bar) while attacking real gaps.

1. **YAML ↔ JSON ↔ TOML Converter (#28)** — almost free given your existing architecture (swap parser, keep everything else). Ship in a weekend, immediately doubles your portfolio's surface area, captures search traffic that already overlaps with your JSON↔XML page.

2. **JSON Schema Generator + Validator** — natural extension of the JSON converter, same editor pattern. Adds the killer feature of inferring a Draft 2020-12 schema from sample data, then validating other JSON against it. Underserved on the "modern, dark, fast" axis even though many tools exist.

3. **Cron Builder with Timezones (#4)** — different UX (form + calendar) so it stretches you, but the incumbent (crontab.guru) has documented weaknesses you can simply *do better* on. SEO is enormous and durable.

4. **HAR Sanitizer / Redactor (#1)** — genuinely underserved, technical-credibility play. The audience (devs filing vendor support tickets) has no good option today. This is your "Show HN front page" candidate.

5. **JWT/JWE/PASETO Multi-Token Debugger (#5)** — privacy-first framing is a real wedge against jwt.io. Reuses your CodeMirror editor, your two-pane layout, and your dark theme. Shipping PASETO support specifically (which has zero good browser tooling) is a differentiator nobody else has bothered with.

This sequence ramps in difficulty (1 → 4) while compounding your SEO surface around the "format/validate/inspect" niche where your JSON↔XML tool already lives. By tool #5 you have a coherent sub-brand: **privacy-first, no-upload, dark-themed dev utilities** — which is exactly the positioning Toolpod / Prism.Tools / RegexLab are explicitly chasing right now, but most of them are 40-tool grab-bags rather than focused, polished individual pages.

---

## Sources

- [Show HN: Prism.Tools – Free and privacy-focused developer utilities](https://news.ycombinator.com/item?id=46511469)
- [I Built 48 Developer Tools in a Day Using AI (Toolpod)](https://dev.to/bdubs/i-built-48-developer-tools-in-a-day-using-ai-heres-what-i-learned-46fd)
- [Why I Actively Discourage Online Tooling like jwt.io and Online JSON Validators — Jamie Tanna](https://www.jvt.me/posts/2020/09/01/against-online-tooling/)
- [crontab guru Alternatives & Competitors — SaaSHub (weakness list)](https://www.saashub.com/crontab-guru-alternatives)
- [Top Best Alternatives — Crontab Guru weaknesses](https://www.topbestalternatives.com/crontab-guru/)
- [RegexLab: Free Offline Regex Tester With 5 Modes Regex101 Doesn't Have](https://orthogonal.info/regexlab-regex-tester/)
- [I built free developer tools with no login, no ads — here's why (DEV)](https://dev.to/stb_softwarethatbenefit/i-built-free-developer-tools-with-no-login-no-ads-heres-why-4894)
- [I've built a collection of 25+ free online developer tools — no ads, no login (DEV)](https://dev.to/wynnt3o/ive-built-a-collection-of-25-free-online-developer-tools-no-ads-no-login-1e3m)
- [JSONFormatter.org Alternatives — AlternativeTo](https://alternativeto.net/software/json-formatter/)
- [Mockaroo (limits)](https://www.mockaroo.com/)
- [HAR Analyzer](https://har-analyzer.dev/)
- [GetDevUtils JWT Debugger (privacy-first framing)](https://getdevutils.com/jwt-debugger)
- [OneClickPDF (client-side PDF tools)](https://www.oneclickpdf.net/)
- [Smallpdf vs iLovePDF complaints (G2/justuse.me)](https://www.justuse.me/news/smallpdf-alternative-free-no-watermark)
- [Coolors limitations / alternatives](https://bonniesorsby.com/coolors-alternative/)
- [SVGOMG](https://jakearchibald.github.io/svgomg/)
- [Vecta Nano SVG compressor](https://vecta.io/nano)
- [ParquetReader (data-format viewer landscape)](https://parquetreader.com/)
- [Filestash Avro Viewer](https://www.filestash.app/tools/avro-viewer.html)
- [sql-formatter (multi-dialect library)](https://github.com/sql-formatter-org/sql-formatter)
- [it-tools.tech](https://it-tools.tech/)
- [transform.tools — feature reference](https://transform.tools/)
