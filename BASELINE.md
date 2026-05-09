# Baseline — Phase 0.1 Pre-flight

Snapshot of the JSON↔XML app before the monorepo refactor begins. Captured from
`JsonToXML/` (about to be moved to `apps/json-xml/` in Phase 0.2). All numbers
must be reproducible after the move; any regression is a Phase 0.2 bug.

## Date

2026-05-09

## Tooling

| Tool | Version |
|---|---|
| Node | v24.2.0 |
| npm | 11.3.0 |
| pnpm | 9.12.0 |
| Vite | 8.0.2 |
| Vitest | 4.1.1 |
| OS | Windows 11 (10.0.26200) |

## Tests

`npm run test` (vitest, single run):

- **7 test files**
- **201 tests, all passing**
- Duration: ~670ms

Files (per `CLAUDE.md`):
`xmlToJson.test.ts` (68), `jsonToXml.test.ts` (50), `roundtrip.test.ts` (21),
`formatter.test.ts` (27), `validator.test.ts` (17), `autodetect.test.ts` (10),
`options.test.ts` (8).

## Lint

`npm run lint` — zero errors, zero warnings.

## Production build

`npm run build` (`tsc -b && vite build`):

| Asset | Raw | Gzipped |
|---|---|---|
| `dist/index.html` | 0.87 KB | 0.48 KB |
| `dist/assets/index-*.css` | 18.78 KB | 4.37 KB |
| `dist/assets/index-*.js` | 668.38 KB | 212.33 KB |

Build time: 5.68s. Module count: 70.

Vite emits the standard "chunks larger than 500 KB" warning for the JS bundle —
this is dominated by CodeMirror 6 and is acceptable per the performance budget
in `PLATFORM_BUILD_PLAN.md` ("CodeMirror in json-xml is the heaviest dep —
accept ~150 KB gz for it"). 212 KB gz is currently above that target; reducing
it is **not** in scope for Phase 0 — flagged for follow-up after the refactor.

## Acceptance for Phase 0.1

- [x] Clean working tree achievable (planning docs committed alongside this file).
- [x] pnpm ≥ 9 installed (9.12.0).
- [x] All 201 baseline tests pass.
- [x] Lint clean.
- [x] Build succeeds.

Phase 0.2 (monorepo skeleton) is unblocked.
