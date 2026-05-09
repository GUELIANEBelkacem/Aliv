# Next Steps — Utility Portfolio Roadmap

After shipping the JSON↔XML converter, the next two utilities to build (in order) are picked from `UTILITY_RESEARCH_REPORT.md`. Both reuse the existing dark-first design system, settings drawer pattern, and client-side-only architecture.

## 1. QR Code Generator (next target)

**Goal**: A free, no-login, fully client-side QR generator that beats every watermarked / paywalled / login-gated incumbent on customization depth and UX polish.

**Must-have feature set:**
- **Content types**: plain text, URL, Wi-Fi, vCard/MeCard, email, SMS, phone, geo, calendar event, crypto address
- **Color control**: foreground/background, gradient fills (linear + radial), per-module color, eye (corner) color override
- **Shape control**: module shapes (square, dot, rounded, classy, extra-rounded, vertical/horizontal bars), eye frame + eye ball shapes (square, rounded, leaf, circle)
- **Center logo**: drag-and-drop image, automatic transparent padding, configurable size (% of QR), shape (square/circle/rounded), built-in error-correction bump when logo is large
- **Error correction**: L/M/Q/H selector with explanation
- **Sizing & quiet zone**: pixel size, margin/quiet-zone control
- **Export**: PNG (multi-resolution), SVG (vector), JPG, WebP, PDF; copy to clipboard
- **Live preview**: instant re-render on every change; scannability warning if customization breaks readability
- **Presets/templates**: gallery of styled presets; save user presets to `localStorage`
- **Batch mode**: paste a list of URLs/strings, get a zip of QR codes (later phase)

**Why it wins**: most "styled QR" tools are watermarked, capped, or require signup (qr-code-generator.com, qrcode-monkey free tier). A polished, no-login version with the same depth ranks well on persistent organic search.

**Library candidates**: `qr-code-styling` (covers shapes/gradients/logo natively, MIT, browser-first) or `qrcode` + custom canvas/SVG layer for finer control.

**Reusable from current app**: dark theme, button variants, settings drawer pattern, copy-feedback morphing button, keyboard-shortcut framework, mobile-tab layout.

**Difficulty**: 2/5 for v1 with `qr-code-styling`; 3/5 for the gradient + logo + scannability-warning polish.

## 2. Hash Generator (queued after QR)

**Goal**: A multi-algorithm hash generator that handles text **and** files, including modern algorithms most online tools omit.

**Must-have feature set:**
- **Algorithms**: MD5, SHA-1, SHA-224/256/384/512, SHA-3 family, BLAKE2b, BLAKE3, RIPEMD-160, plus HMAC variants for each
- **Input modes**: text input (live hash on every keystroke), file drag-drop (streaming hash for multi-GB files), URL fetch (optional, CORS-permitting)
- **Multi-algo view**: compute all selected algorithms simultaneously in a table
- **Output formats**: hex (lower/upper), base64, base64url, binary preview
- **Compare mode**: paste an expected hash; the tool highlights match/mismatch (constant-time compare for crypto cred)
- **HMAC**: key input field with per-algo support
- **Encoding**: UTF-8 default, with UTF-16 / Latin-1 / hex-input toggles

**Why it wins**: heavy organic search; most existing tools omit BLAKE3 + HMAC + file hashing. Web Crypto API covers SHA-* natively; BLAKE3 has WASM ports; MD5/RIPEMD via small JS libs.

**Reusable from current app**: dark theme, settings drawer, copy-feedback button, keyboard shortcuts, two-pane layout (input → outputs table).

**Difficulty**: 2/5.

---

## Build sequencing

1. Plan QR generator scope (deciding now).
2. Decide whether utilities live in **one mono-repo with shared design tokens** or **separate Vite projects** — relevant before scaffolding QR.
3. Build QR v1 (core types + colors + shapes + logo + PNG/SVG export).
4. Polish (presets, batch mode, scannability warning).
5. Move to Hash generator with the same shell.

The strategic goal is a coherent sub-brand of **privacy-first, no-upload, dark-themed dev utilities**, sharing visual identity across tools so each new launch compounds the portfolio's credibility.
