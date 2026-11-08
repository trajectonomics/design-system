# @trajectonomics/design-system

Trajectonomics design system: tokens, themes, and UI primitives

[![CI](https://github.com/trajectonomics/design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/trajectonomics/design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Part of the [Trajectonomics](https://github.com/trajectonomics) ecosystem.

---

## Installation

```bash
bun add @trajectonomics/design-system
```

## Getting Started

```typescript
import {
  darkTheme,
  lightTheme,
  primitiveTokens,
  semanticTokenContract,
} from "@trajectonomics/design-system"

// The closed, versioned set of Semantic Token names every Theme resolves.
console.log(semanticTokenContract.version) // 1

// Built-in Themes are plain, frozen data.
console.log(lightTheme.tokens["color.primary"]) // "#171717"
console.log(darkTheme.tokens["color.primary"]) // "#e5e5e5"

// Primitive Tokens are the raw values that Semantic Tokens alias.
console.log(primitiveTokens.neutral900.value) // "#171717"
```

---

## Repository layout

This repository is a private Bun workspace: the root package is never published. Published
packages live in `packages/`, private apps live in `apps/`.

- [`packages/core`](./packages/core): `@trajectonomics/design-system`, the pure token core.

## Development

```bash
# Install dependencies for every workspace package
bun install

# Run the full verification suite for every workspace package
# (lint, typecheck, tests, build, package lint)
bun run check

# Run only the tests
bun run test

# Code formatting & lint
bun run format
bun run lint
```

---

## Domain Documentation

- [GLOSSARY.md](./GLOSSARY.md): Ubiquitous domain terminology.
- [AGENTS.md](./AGENTS.md): Guidelines and rules for autonomous AI coding agents.
- [CODING_STANDARDS.md](./CODING_STANDARDS.md): Architecture, purity, and review invariants.
- [docs/adr/](./docs/adr/): Architecture Decision Records.
- [docs/publishing.md](./docs/publishing.md): First npm publish and trusted publishing checklist.

---

## License

[MIT](./LICENSE)
