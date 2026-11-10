# ADR 0002: Package Layout and Per-Package Release Pipelines

## Status

Accepted

## Context

This repository started as a single-package template: one package at the repo root, one CI job, one
release workflow. The product now needs three layers that can be released independently — pure token
data, pure theme behaviour, and Svelte components — so that a non-Svelte consumer can install tokens
and CSS without Svelte, and a change to one layer never publishes another.

The shared publish workflow from `trajectonomics/cicd` publishes exactly one package from the repo
root. It cannot express path filtering, per-package tags or per-package versions, so it cannot serve
this layout as it stands.

## Decision

**Workspace shape.** The repo root becomes a private, unpublished Bun workspace. Published packages
live under `packages/`; the private Storybook preview lives under `apps/`. The root package is never
published, and the package has never been on npm, so no consumer migrates.

**Packages.** Three published packages and one private app:

| Folder            | Package name                              | Responsibility                                            |
| ----------------- | ----------------------------------------- | --------------------------------------------------------- |
| `packages/core`   | `@trajectonomics/design-system`           | Pure data: Primitive Tokens, Semantic Tokens, Contract, built-in `light` and `dark` Themes |
| `packages/theme`  | `@trajectonomics/design-system-theme`     | Pure behaviour: `defineTheme` and validation, Theme-to-CSS, Tailwind v4 theme stylesheet, prebuilt Theme CSS |
| `packages/svelte` | `@trajectonomics/design-system-svelte`    | Svelte 5 components and Hooks, with compiled CSS so consumers need no Tailwind |
| `apps/storybook`  | private, unpublished                      | Component preview with a Theme switcher                   |

**Dependency direction.** `svelte` → `theme` → `core`, never the other way. `core` has no
dependencies. `theme` imports `core` for the Semantic Token Contract and token types. `svelte`
imports `theme` to apply Themes to elements. Nothing depends on `svelte`.

**Peer-dependency coupling.** `core` is a peer dependency of both `theme` and `svelte`; `theme` is
also a peer dependency of `svelte`. In development they are workspace-linked; published manifests
declare version ranges. This keeps one copy of the token data and types in a consumer app, means
publishing `core` never forces a republish of its dependents, and makes moving the ecosystem to a
new major a deliberate maintainer action: a breaking change in `core` is followed by a manual
release of the dependents when the maintainer chooses.

**Pipelines.** One release workflow per published package, each a caller of one reusable local
workflow:

- `release-core.yml`, triggered only by changes under `packages/core/**`
- `release-theme.yml`, triggered only by changes under `packages/theme/**`
- `release-svelte.yml`, triggered only by changes under `packages/svelte/**`

Workflow filenames are part of the contract: each package's npm Trusted Publisher entry names its
workflow file, so renaming a workflow breaks publishing.

Each caller owns a per-package git tag prefix (`core-vX.Y.Z`, `theme-vX.Y.Z`, `svelte-vX.Y.Z`) and
computes its next version only from conventional-commit messages that touched its own package
folder, following the existing shared version rules. A push to `main` publishes an alpha for every
package the push touched; a manual dispatch publishes a stable release. Publishing is path-filtered
so a change to one package cannot publish another.

**CI.** The check job runs every package on every pull request. Only publishing is path-filtered;
cross-package breakage must fail before merge.

**Deliberate special case.** This repo has several independently released packages while the shared
pipeline supports one. Duplicating the shared publish logic locally is intentional and temporary:
the shared multi-package pipeline is `trajectonomics/cicd`'s job, and when it lands these workflows
are deleted and replaced. Until then, the local workflows are the source of truth for releasing this
repo.

## Considered alternatives

- **Keep one package with subpath exports.** One version, one release workflow and no path filtering,
  but every consumer gets every layer and a change anywhere forces a release everywhere. Rejected.
- **Adopt a changesets-style release tool.** Solves per-package versions, but adds a second release
  model next to the shared version rules and still needs per-package CI wiring. Rejected for now.
- **Wait for `trajectonomics/cicd`'s multi-package pipeline.** Avoids temporary workflows, but blocks
  the whole slice on another repository's schedule. Rejected; the local workflows are the deliberate
  stopgap.

## Consequences

- Consumers install only the layers they need; a non-Svelte project can use tokens and CSS without
  Svelte.
- Three npm packages means three Trusted Publisher entries, three tag prefixes and three first
  publishes; the manual first-publish and Trusted Publisher steps must be documented for all three.
- A breaking change in `core` does not automatically release `theme` or `svelte`. That is the
  intended trade-off: the maintainer decides when dependents move.
- Release logic is duplicated from `trajectonomics/cicd` for now, so a fix to the shared publish
  workflow must be mirrored here until the shared multi-package pipeline replaces these callers.
- Every pull request runs every package's checks, which is slower than path-filtered checks but
  catches cross-package breakage before merge.

## Corrections

- 2026-11-10: the Decision text says the package "has never been on npm". That was wrong:
  `@trajectonomics/design-system` already exists on npm (`0.1.0-alpha.0`, published by hand), so
  only `-theme` and `-svelte` need a first publish. All three still need a Trusted Publisher entry.

## Amendment: peer ranges

- 2026-11-10: `theme` and `svelte` declare their peer dependencies as `^0.1.0-alpha.0`, so an alpha
  `0.1.0-alpha.N` resolves and a stable `0.1.x` still does, while `0.2.0-*` does not. Known semver
  limit: a prerelease on a later patch (`0.1.1-alpha.0`) does not match; alpha consumers then use
  their package manager's override. The range is hand-edited, not tied to the package version.
