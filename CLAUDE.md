# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JsonToXML is a client-side JSON-to-XML and XML-to-JSON converter with a dark-first SaaS-like interface featuring syntax-highlighted CodeMirror editors, real-time conversion, beautification, and configurable settings. All processing runs in the browser — no backend. The application code lives in the `JsonToXML/` subdirectory (not the repo root).

This app is the **first in a planned portfolio of privacy-first, no-upload, dark-themed dev utilities**. Shared design system, button variants, settings drawer pattern, and keyboard-shortcut framework are intended to be reused across future tools.

## Portfolio Roadmap

- **`UTILITY_RESEARCH_REPORT.md`** — full market research: 28 utility ideas across underserved / poorly-executed / common-but-useful categories, with differentiators and difficulty ratings.
- **`NEXT_STEPS.md`** — short roadmap. Next two builds: **QR Code Generator** (in planning), then **Hash Generator**.

## Commands

All commands must be run from the `JsonToXML/` directory:

```bash
npm run dev         # Start dev server with HMR
npm run build       # TypeScript check + Vite production build
npm run lint        # ESLint (flat config, TS/TSX files only)
npm run test        # Run all unit tests (vitest)
npm run test:watch  # Run tests in watch mode
npm run preview     # Preview production build locally
```

## Architecture

- **Vite 8** with `@vitejs/plugin-react` and **React Compiler** enabled via `@rolldown/plugin-babel` + `babel-plugin-react-compiler`
- **React 19** with TypeScript ~5.9
- **fast-xml-parser** for all JSON↔XML conversion and XML validation
- **CodeMirror 6** for syntax-highlighted editors with custom dark/light highlight themes using `@lezer/highlight` tags
- **Vitest** for unit testing (201 tests across 7 files)
- ESLint flat config (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, and `react-refresh`
- TypeScript project references: `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`
- CSS uses native nesting with CSS custom properties for dark-first theming (no preprocessor)

## Module Structure

```
src/
├── main.tsx                        # Entry point
├── App.tsx                         # Root layout, swap/keyboard shortcuts, mobile tabs, settings context
├── App.css                         # (minimal, styles are in index.css)
├── index.css                       # Full design system: colors, buttons, layout, responsive, animations
├── types/
│   └── settings.ts                 # AppSettings, ConversionOptions, ConversionResult types + defaults
├── lib/
│   ├── converter.ts                # xmlToJson() / jsonToXml() wrapping fast-xml-parser
│   ├── formatter.ts                # prettifyJson/Xml, minifyJson/Xml
│   └── validator.ts                # Pre-parse validation with line/column error extraction
├── hooks/
│   ├── useSettings.ts              # Settings state + localStorage persistence + SettingsContext
│   ├── useAutoDetect.ts            # Heuristic format detection (JSON vs XML vs unknown)
│   └── useConversion.ts            # Debounced auto-conversion (300ms), manual trigger, timing measurement
├── components/
│   ├── EditorPanel.tsx             # CodeMirror 6 wrapper with dual dark/light syntax themes, drag-drop
│   ├── Toolbar.tsx                 # Two-row toolbar: brand+direction row, actions row. Button variants (primary/secondary/ghost)
│   ├── StatusBar.tsx               # Error display, format badge, input size, conversion timing
│   └── SettingsDrawer.tsx          # Slide-out panel with CSS toggle switches, help text, styled selects
└── __tests__/
    ├── helpers.ts                  # Default options factory for tests
    ├── xmlToJson.test.ts           # 68 tests
    ├── jsonToXml.test.ts           # 50 tests
    ├── roundtrip.test.ts           # 21 tests
    ├── formatter.test.ts           # 27 tests
    ├── validator.test.ts           # 17 tests
    ├── autodetect.test.ts          # 10 tests
    └── options.test.ts             # 8 tests
```

## Design System

- **Dark-first**: Default theme is dark (`#0c0d12` background). Light theme available via settings. Respects `prefers-color-scheme` with manual override via `data-theme` attribute on `<html>`.
- **Color tokens**: All colors are CSS custom properties defined in `:root` in `index.css`. Dark palette uses deep blue-black backgrounds with `#7c8cf5` accent. Light palette recalibrates all tokens.
- **Button variants**: Three tiers — `.btn-primary` (filled accent with glow), `.btn-secondary` (bordered), `.btn-ghost` (no border). All buttons: 32px height, 6px radius, 0.15s transitions, lift on hover.
- **Editor syntax**: Custom `HighlightStyle` objects (dark: Dracula-inspired, light: matching light palette) applied via `syntaxHighlighting()`. Both are registered simultaneously — CSS variables handle the rest.
- **Favicon**: Custom SVG combining `{ }` brace (amber) + `< >` bracket (accent blue) + center arrow.

## Key Features

- **Swap button**: Center divider between panels has a circular swap button (⇄) that moves output→input and flips direction.
- **Inline copy feedback**: Copy button morphs to checkmark + "Copied!" for 1.5s instead of a floating toast.
- **Keyboard shortcuts**: `Ctrl+Enter` (convert), `Ctrl+Shift+C` (copy), `Ctrl+Shift+S` (swap), `Ctrl+Shift+B` (beautify), `Ctrl+Shift+M` (minify), `Ctrl+,` (settings).
- **Mobile layout**: Below 768px, panels switch to a tabbed layout (Input/Output tabs) instead of side-by-side. Toolbar buttons drop text labels. Settings drawer goes full-width.
- **Conversion timing**: Status bar shows "Converted in Xms" after each conversion.
- **Settings drawer**: Custom CSS toggle switches (not native checkboxes), help text under each option, backdrop blur overlay.

## Conversion Design Decisions

- **Attribute convention**: XML attributes prefixed with `@_` in JSON (configurable). Text content uses `#text`.
- **Auto-detection**: Input format sniffed by first non-whitespace character (`{`/`[` → JSON, `<` → XML).
- **Settings persistence**: All settings stored in `localStorage` under key `jsontoxml-settings`.
- **Default theme**: `dark` (changed from `system` — dev tool convention).

## Conversion Edge Cases

Structural mismatches handled by configuration toggles:
- Repeated XML siblings → JSON arrays (single elements stay scalar unless "always array" is on)
- JSON arrays → repeated `<item>` siblings wrapped in `<root>`
- Primitive top-level JSON values → wrapped in `<root>` with `#text`
- XML type inference (string→number/boolean) off by default, toggleable
- XML comments and declarations stripped by default, toggleable
