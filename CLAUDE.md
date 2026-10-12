# CLAUDE.md — vite-plugin-oxlint

Vite plugin that runs [oxlint](https://oxc.rs/docs/guide/usage/linter) in `buildStart` (dev server and `vite build`, `lintOnStart`) and on hot updates (debounced, `lintOnHotUpdate`), and fails on lint errors/warnings when `failOnError` / `failOnWarning` is set. Published to npm as `vite-plugin-oxlint`; peer deps `vite >=5`, `oxlint >=0.9`.

## Layout

| Path             | Role                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`   | The plugin (`oxlintPlugin`, default export): spawns the oxlint binary, `buildStart` / `handleHotUpdate` hooks, 300 ms hot-update debounce |
| `src/args.ts`    | `buildArgs()` — turns `Options` into the oxlint CLI argument list; `resolveAbsolutePath()`                                                |
| `src/types.ts`   | Public `Options` interface (the plugin's whole API surface)                                                                               |
| `src/__tests__/` | Vitest suites + `fixtures/`                                                                                                               |
| `dist/`          | tsdown output (ESM `.mjs` + CJS `.cjs` + `.d.mts`/`.d.cts`) — generated, never edit                                                       |

## Commands

pnpm only (version pinned by `packageManager`).

```sh
pnpm build        # tsdown
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm lint         # oxlint   (lint:fix to autofix)
pnpm fmt:check    # oxfmt --check   (fmt to rewrite)
```

Before calling a change done: `pnpm typecheck && pnpm test && pnpm lint && pnpm fmt:check`.

## Conventions

- **Adding or changing an option** touches four places together: `Options` in `src/types.ts`, its mapping in `buildArgs()` (`src/args.ts`), a test in `src/__tests__/args.test.ts`, and the Options table / section in `README.md` (the README is the user documentation).
- Formatting and lint rules come from `.oxfmtrc.json` / `.oxlintrc.json`. A Claude Code hook runs oxfmt on every edited `src/**/*.ts` file.
- **Commit messages**: imperative, capitalized, no `feat:`/`fix:` prefix — e.g. `Add agent and sarif oxlint output formats`, `Update dependencies`. Release commits: `Bump version to X.Y.Z`. CI-only changes use `ci: …`.
- `prepublishOnly` runs the build; do not commit `dist/` (gitignored).
