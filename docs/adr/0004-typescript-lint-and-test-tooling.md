# ADR 0004: TypeScript, Lint and Test Tooling

## Status

Accepted

## Context

The repository's shared tooling is strict and deliberate: Bun as package manager and script runner,
Biome as the universal linter, TypeScript 7 (the native compiler) and `bun test` for the pure
packages. Adding a Svelte package breaks three assumptions of that setup:

- the Svelte tooling (`svelte-check` and the Svelte packaging tool) supports only TypeScript 5 and 6
  at the time of this decision;
- Biome cannot parse `.svelte` markup, so it cannot cover component files;
- `bun test` has no Svelte compilation step, so it cannot mount components or exercise runes in a
  Svelte-compiled context.

The shared TypeScript and Biome configs must not be loosened to make any of this disappear. Any
resolution has to live inside the affected package.

## Decision

**TypeScript split.** `core` and `theme` stay on TypeScript 7 and keep the native compiler's speed.
`packages/svelte` and the Storybook app pin TypeScript 6 locally because their tooling does not
support 7 yet. `tsconfig.base.json` is not loosened. If the shared declaration-emit setting clashes
with the Svelte package build, it is resolved inside that package's config without changing the base.

**Lint split.** Biome stays the universal linter and covers every `.ts` and `.svelte.ts` file in
every package. `.svelte` files are excluded from Biome and covered by a Svelte profile instead:

- `svelte-check` with warnings as errors, and
- Prettier with the Svelte plugin, applied to `.svelte` files only.

Logic lives in `.svelte.ts` files and `.svelte` files hold markup only, so Biome's strict rules
still cover the logic and the Svelte profile only has to cover markup. No Biome rule is loosened
and no suppression is added to work around Svelte files.

Rejected alternatives:

- **Leave `.svelte` files unchecked.** Would let markup and template logic drift with no check at
  all, which is exactly where component regressions live.
- **ESLint with `eslint-plugin-svelte` plus Prettier for all files.** A second linter duplicates
  Biome's rules, loses the shared strict config, and creates two sources of truth for TypeScript.
- **Loosen Biome or add file-level suppressions for Svelte.** Forbidden by the repo rules and would
  weaken every package to fix one.

**Test runners.** `core` and `theme` keep `bun test`; pure data and pure functions need nothing
more. `packages/svelte` uses Vitest with Testing Library, so runes and rendered components can be
tested through Vite's Svelte pipeline. Vitest is started through the repo's `bun run test` script,
so the contributor-facing entry point stays the same. Bun remains the package manager and script
runner everywhere; the Bun rule in `AGENTS.md` is reworded to allow Vitest for Svelte packages.

Rejected alternatives:

- **`bun test` for the Svelte package.** No Svelte compile step, so components cannot be mounted
  and runes cannot be exercised as a browser would.
- **Browser end-to-end tests only.** Slower, not unit-level, and poor at isolating the Hook and
  rendered-component behaviour that needs pinning here.
- **No component tests.** Would leave the Theme application path and `Button` styling unproven
  except through the consumer smoke test.

**Verification.** `bun run check` covers every package: lint, typecheck, tests, build and package
lint. The consumer smoke test packs the real tarballs and runs `svelte-check` plus a build in a
fixture Vite + Svelte app, which is the guard against the TypeScript 6/7 split leaking broken types
to customers.

## Consequences

- Two TypeScript versions coexist in the workspace. Contributors must know which package they are
  in, and a root-level tool that resolves the wrong version can mislead. The per-package pins and
  the consumer smoke test are the guard.
- Two test runners coexist. `bun run test` at the root delegates per package, so each package's own
  script documents which runner it uses.
- Formatting is split: Biome for TypeScript, Prettier for `.svelte` markup. This is an interim
  profile; the Svelte profile and an optional design-system-only rule are requested from
  `trajectonomics/cicd` as separate issues and will replace the local setup when they land.
- When `svelte-check` and the Svelte packaging tool support TypeScript 7, the local TypeScript 6
  pin is removed and this ADR is superseded. Until then, upgrading `svelte`'s TypeScript is a
  deliberate, tested step rather than a workspace-wide bump.
