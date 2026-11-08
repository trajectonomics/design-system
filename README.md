# Trajectonomics Design System

Trajectonomics design system: tokens, Themes, Svelte components and a Storybook preview.

[![CI](https://github.com/trajectonomics/design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/trajectonomics/design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Part of the [Trajectonomics](https://github.com/trajectonomics) ecosystem.

---

## Packages

This repository is a private Bun workspace with three published packages and one private app.

| Package | Folder | What it gives you |
| --- | --- | --- |
| [`@trajectonomics/design-system`](./packages/core) | `packages/core` | Pure data: Primitive Tokens, Semantic Tokens, the Semantic Token Contract and the built-in `light` and `dark` Themes. No dependencies. |
| [`@trajectonomics/design-system-theme`](./packages/theme) | `packages/theme` | Pure behaviour: `defineTheme`, validation, Theme CSS, prebuilt Theme CSS and the Tailwind v4 theme stylesheet. |
| [`@trajectonomics/design-system-svelte`](./packages/svelte) | `packages/svelte` | Svelte 5 components and Hooks, with one compiled stylesheet. Consumers do not need Tailwind. |
| Storybook (private) | [`apps/storybook`](./apps/storybook) | Component previews with a Theme switcher and the accessibility addon. Never published. |

Dependency direction is `svelte` → `theme` → `core`. `theme` and `svelte` declare their dependencies
as peer dependencies with version ranges, and use workspace linking in development.

## Installation

```bash
# Tokens and Themes only
bun add @trajectonomics/design-system @trajectonomics/design-system-theme

# Svelte components and Hooks
bun add @trajectonomics/design-system-svelte @trajectonomics/design-system-theme @trajectonomics/design-system
```

A consumer needs `core` and `theme` alongside `svelte` because they are peer dependencies.

## Design Tokens

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

### Tailwind

If your app uses Tailwind v4, import the theme stylesheet after Tailwind. Utility colours such as
`bg-primary` and `text-primary-foreground` then follow the active Theme, including generated Themes:

```css
@import "tailwindcss";
@import "@trajectonomics/design-system-theme/tailwind.css";
```

## Svelte components and Hooks

Import the compiled stylesheet once, then use the components. You do not need to install or configure
Tailwind in your own app:

```css
@import "@trajectonomics/design-system-theme/themes/light.css";
@import "@trajectonomics/design-system-theme/themes/dark.css";
@import "@trajectonomics/design-system-svelte/style.css";
```

```svelte
<script lang="ts">
  import { darkTheme, lightTheme } from "@trajectonomics/design-system"
  import { Button, useTheme } from "@trajectonomics/design-system-svelte"

  const theme = useTheme({ element: () => document.documentElement, theme: lightTheme })

  function toggleTheme(): void {
    theme.setTheme(theme.current?.name === "dark" ? lightTheme : darkTheme)
  }
</script>

<Button onclick={toggleTheme}>Toggle Theme</Button>
```

`useTheme` applies any valid Theme to any element. It sets the element's `data-theme` attribute and
injects that Theme's CSS, so a Theme can be scoped to a nested element without affecting the page.
Components never reference a Theme by name.

## Repository layout

```text
packages/
├── core/       # tokens, Contract and built-in Themes (pure data)
├── theme/      # defineTheme, validation, Theme CSS, Tailwind stylesheet (pure behaviour)
└── svelte/     # Svelte 5 components and Hooks, compiled CSS
apps/
└── storybook/  # private Storybook preview
fixtures/
└── consumer/   # private Vite + Svelte app used by the consumer smoke test
```

## Development

```bash
# Install dependencies for every workspace package
bun install

# Full verification for every package: lint, typecheck, tests, build and package lint
bun run check

# Individual steps
bun run lint
bun run typecheck
bun run test
bun run build
bun run format

# Preview the components
cd apps/storybook
bun run dev

# Pack the real tarballs and verify a consumer Vite + Svelte app
bun run smoke
```

The consumer smoke test packs `core`, `theme` and `svelte`, installs the tarballs into the fixture
app, then runs `svelte-check`, a Theme-switch test and a production build. CI runs it as its own job.

TypeScript and test runners are split by package: `core` and `theme` use TypeScript 7 and `bun test`;
`svelte` and Storybook pin TypeScript 6 locally and use `svelte-check`, Vitest and Prettier for
`.svelte` markup. See [ADR 0004](./docs/adr/0004-typescript-lint-and-test-tooling.md).

---

## Releasing

Each published package releases independently. A push to `main` that touches a package's folder
publishes an alpha; running that package's workflow by hand on `main` publishes a stable version.
Versions come from the conventional commits that touched the package since its own tag, and nothing
edits `version` by hand.

| Package | Folder | Workflow | Tag prefix |
| --- | --- | --- | --- |
| `@trajectonomics/design-system` | `packages/core` | `release-core.yml` | `core-v` |
| `@trajectonomics/design-system-theme` | `packages/theme` | `release-theme.yml` | `theme-v` |
| `@trajectonomics/design-system-svelte` | `packages/svelte` | `release-svelte.yml` | `svelte-v` |

See [docs/publishing.md](./docs/publishing.md) for the one-time npm setup, the first publish of each
package and the Trusted Publisher entry each workflow filename must match. Each package's caller and
the reusable `.github/workflows/release-package.yml` share all release logic; adding a package means
adding a caller that passes its folder and tag prefix.

The per-package workflows are a deliberate special case: the shared multi-package pipeline is
`trajectonomics/cicd`'s job and will replace them. See
[ADR 0002](./docs/adr/0002-package-layout-and-release-pipelines.md).

---

## Domain Documentation

- [GLOSSARY.md](./GLOSSARY.md): Ubiquitous domain terminology.
- [AGENTS.md](./AGENTS.md): Guidelines and rules for autonomous AI coding agents.
- [CODING_STANDARDS.md](./CODING_STANDARDS.md): Conventions and review invariants.
- [docs/adr/](./docs/adr/): Architecture Decision Records.
- [docs/publishing.md](./docs/publishing.md): First npm publish and trusted publishing checklist.

---

## License

[MIT](./LICENSE)
