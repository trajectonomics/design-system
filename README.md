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

## Theme CSS

The theme package ships prebuilt CSS for the built-in Themes. Import one or both and select the
active Theme with a `data-theme` attribute, which can sit on any element:

```css
@import "@trajectonomics/design-system-theme/themes/light.css";
@import "@trajectonomics/design-system-theme/themes/dark.css";
```

```html
<html data-theme="light">
  <!-- nested elements can use another Theme -->
  <section data-theme="dark">...</section>
</html>
```

Any valid Theme, including a custom one, produces the same `--ds-` custom properties through one
deterministic function:

```typescript
import { defineTheme, themeToCss } from "@trajectonomics/design-system-theme"

const theme = defineTheme({ name: "brand-ocean", tokens: { /* every Contract role */ } })
const css = themeToCss(theme) // [data-theme="brand-ocean"] { --ds-color-primary: ...; }
```

---

## Repository layout

This repository is a private Bun workspace: the root package is never published. Published
packages live in `packages/`, private apps live in `apps/`.

- [`packages/core`](./packages/core): `@trajectonomics/design-system`, the pure token core.
- [`packages/theme`](./packages/theme): `@trajectonomics/design-system-theme`, Theme validation and
  Theme-to-CSS emission, plus prebuilt `light` and `dark` CSS.

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

## Releasing

Each published package releases independently. A push to `main` that touches a package's folder
publishes an alpha; running that package's workflow by hand on `main` publishes a stable version.
Versions come from the conventional commits that touched the package since its own tag, and nothing
edits `version` by hand.

| Package | Folder | Workflow | Tag prefix |
| --- | --- | --- | --- |
| `@trajectonomics/design-system` | `packages/core` | `release-core.yml` | `core-v` |

See [docs/publishing.md](./docs/publishing.md) for the one-time npm setup and the first publish.
Each package's caller and the reusable `.github/workflows/release-package.yml` share all release
logic; adding a package means adding a caller that passes its folder and tag prefix.

The per-package workflows are a deliberate special case: the shared multi-package pipeline is
`trajectonomics/cicd`'s job and will replace them. See
[ADR 0002](./docs/adr/0002-package-layout-and-release-pipelines.md).

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
