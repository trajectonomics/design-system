# ADR 0001: Architecture Foundations for @trajectonomics/design-system

## Status

Accepted

## Context

`trajectonomics/design-system` is established to provide Trajectonomics design system: tokens, themes, and UI primitives.
It is built with Bun, TypeScript, and Biome under the Trajectonomics architectural guidelines.

## Decision

1. **Archetype**: A Bun workspace. The published `core` package keeps the pure, deterministic `core` archetype.
2. **Language & Runtime**: TypeScript (strict mode with `isolatedDeclarations`) executed on Bun.
3. **Domain Integrity**: All domain concepts adhere to [GLOSSARY.md](../../GLOSSARY.md).
4. **Agent Collaboration**: AI agents adhere to [AGENTS.md](../../AGENTS.md) and [CODING_STANDARDS.md](../../CODING_STANDARDS.md).
5. **Scope**: This repository is a Bun workspace with four published packages — `core` (pure data), `theme` (pure behaviour), `svelte` (components and Hooks) and `assets` (Brand Assets, static files) — plus a private Storybook app. Package layout and release pipelines are recorded in [ADR 0002](./0002-package-layout-and-release-pipelines.md); Themes as runtime-validated data are recorded in [ADR 0003](./0003-themes-as-runtime-validated-data.md); the tooling split is recorded in [ADR 0004](./0004-typescript-lint-and-test-tooling.md).

## Consequences

- Invariants remain verifiable through deterministic tests (`bun test`) and `bun run check`.
- All autonomous agent work is test-first and reviewed against established coding standards.
