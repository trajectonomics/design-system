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
import { createDesignToken } from "@trajectonomics/design-system"

const token = createDesignToken({ name: "color.blue.500", value: "#3b82f6" })
console.log(token)
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
