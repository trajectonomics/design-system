# Trajectonomics Design System

Trajectonomics design system: tokens, Themes, Svelte components and a Storybook preview.

[![CI](https://github.com/trajectonomics/design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/trajectonomics/design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Part of the [Trajectonomics](https://github.com/trajectonomics) ecosystem.

---

## Packages

This repository is a private Bun workspace with four published packages and one private app.

| Package | Folder | What it gives you |
| --- | --- | --- |
| [`@trajectonomics/design-system`](./packages/core) | `packages/core` | Pure data: Primitive Tokens, Semantic Tokens, the Semantic Token Contract and the built-in `light` and `dark` Themes. No dependencies. |
| [`@trajectonomics/design-system-theme`](./packages/theme) | `packages/theme` | Pure behaviour: `defineTheme`, validation, Theme CSS, prebuilt Theme CSS and the Tailwind Theme Stylesheet. |
| [`@trajectonomics/design-system-svelte`](./packages/svelte) | `packages/svelte` | Svelte 5 components and Hooks, with one compiled stylesheet. Consumers do not need Tailwind. |
| [`@trajectonomics/design-system-assets`](./packages/assets) | `packages/assets` | Brand Assets: the logo mark, the wordmark and the Favicon Set, as static files. No dependencies. |
| Storybook (private) | [`apps/storybook`](./apps/storybook) | Component previews with a Theme switcher and the accessibility addon. Never published. |

Dependency direction is `svelte` → `theme` → `core`. `theme` and `svelte` declare their dependencies
as peer dependencies with version ranges, and use workspace linking in development. `assets` depends
on nothing: it is a leaf of static files.

## Installation

```bash
# Tokens and Themes only
bun add @trajectonomics/design-system @trajectonomics/design-system-theme

# Svelte components and Hooks
bun add @trajectonomics/design-system-svelte @trajectonomics/design-system-theme @trajectonomics/design-system

# Brand Assets (logo mark, wordmark, Favicon Set)
bun add @trajectonomics/design-system-assets
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

## Web apps without Svelte

`core` and `theme` have no Svelte dependency, so a plain web app (Vite, Astro, React, Fumadocs) uses
the same CSS. Install the two packages:

```bash
bun add @trajectonomics/design-system @trajectonomics/design-system-theme
```

### The stylesheets to import

With Tailwind v4, import Tailwind first, then the Themes you offer and the Tailwind Theme Stylesheet.
This is the whole setup, and the framework-free fixture in `fixtures/web` builds from exactly these
lines:

```css
@import "tailwindcss";
@import "@trajectonomics/design-system-theme/themes/light.css";
@import "@trajectonomics/design-system-theme/themes/dark.css";
@import "@trajectonomics/design-system-theme/tailwind.css";
```

`tailwind.css` is a Tailwind v4 `@theme inline` stylesheet, so utility colours such as `bg-primary`,
`text-primary-foreground`, `border-border` and `ring-ring` follow the active Theme, including
generated Themes.

Without Tailwind, import the Theme CSS only and use the custom properties directly. They are `--ds-`
plus the Semantic Token Role name with dots replaced by dashes, so `color.primary.foreground` is
`--ds-color-primary-foreground`:

```css
@import "@trajectonomics/design-system-theme/themes/light.css";
@import "@trajectonomics/design-system-theme/themes/dark.css";

.card {
  background: var(--ds-color-card);
  color: var(--ds-color-card-foreground);
  border: 1px solid var(--ds-color-border);
}
```

### Select a Theme before first paint

No Theme is the default (the Glossary forbids giving one a special status), so a page without
`data-theme` is unstyled. Set the attribute inline in `<head>`, before the first paint, to avoid a
flash of the wrong Theme:

```html
<script>
  const stored = localStorage.getItem("theme")
  document.documentElement.setAttribute("data-theme", stored === "dark" ? "dark" : "light")
</script>
```

`data-theme` can sit on any element, so a nested element can use another Theme.

When you render on the server, set `data-theme` on the `<html>` you return and in the markup the
client hydrates: the CSS is static, so no script has to run before the first paint.

If your app follows the operating system instead of a stored choice, read `prefers-color-scheme` in
the same inline script:

```html
<script>
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
</script>
```

If your UI library toggles a `.dark` class (the shadcn convention), mirror that class onto the
attribute. The design system reads `data-theme` only, never the class:

```typescript
const root = document.documentElement
function syncTheme(): void {
  root.setAttribute("data-theme", root.classList.contains("dark") ? "dark" : "light")
}
new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ["class"] })
syncTheme()
```

### `dark:` utilities

`tailwind.css` ships no `dark` variant, because shipping one would change `dark:` behaviour for
every Tailwind consumer. Add this descendant-safe variant to your own CSS after the imports:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

`dark:` utilities then follow `data-theme`, on any element.

### Compatibility

The variable names, the `data-theme` selector, the Tailwind Theme Stylesheet's colour names and the
package's CSS export paths are the **Web Consumer Contract**
([ADR 0005](./docs/adr/0005-web-consumer-contract.md)). Adding a Semantic Token Role is additive (a
minor release); renaming or removing one, changing the `--ds-` prefix or the selector, or renaming a
CSS export is breaking. On the `core` and `defineTheme` side a new role is breaking, so it ships
with a Semantic Token Contract version bump, a `core` release first and updated `theme` and `svelte`
peer ranges.

## Brand Assets

`@trajectonomics/design-system-assets` ships the art a site needs as static files with no
dependencies: the logo mark, the wordmark and the Favicon Set. The art comes from the owner, and the
package adds no Design Tokens.

```bash
bun add @trajectonomics/design-system-assets
```

Import a file and let your bundler resolve the package export to a URL:

```typescript
import markOnLight from "@trajectonomics/design-system-assets/logo/mark-on-light.svg"
import wordmarkOnDark from "@trajectonomics/design-system-assets/logo/wordmark-on-dark.svg"
```

The `-on-light` and `-on-dark` files carry a fixed colour, for `<img>` on a background you know.
`mark.svg` and `wordmark.svg` use `currentColor`, for inlining where the mark should take the
surrounding text colour.

The Favicon Set is `favicon.svg` (which follows `prefers-color-scheme` by itself), `favicon.ico`
(16, 32 and 48 px) and the 180, 192 and 512 px PNGs. The rasters cannot adapt, so they are the
light-mode rendering: the black mark on a transparent background. Copy the files to a stable URL and declare them
SVG first, because Safari largely ignores an SVG favicon:

```bash
cp node_modules/@trajectonomics/design-system-assets/dist/favicon/* public/
```

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

Brand Assets are not MIT: they carry the owner's [NOTICE](./packages/assets/NOTICE) (all rights
reserved), unlike the code packages, and they release on their own (`release-assets.yml`) so a logo
change never republishes `theme`.

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
├── svelte/     # Svelte 5 components and Hooks, compiled CSS
└── assets/     # Brand Assets: logo mark, wordmark, Favicon Set (static files)
apps/
└── storybook/  # private Storybook preview
fixtures/
├── consumer/   # private Vite + Svelte app used by the consumer smoke test
└── web/        # private Vite + Tailwind v4 app, no Svelte, for the same smoke test
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

# Pack the real tarballs and verify the consumer fixture apps
bun run smoke
```

The consumer smoke test packs `core`, `theme`, `svelte` and `assets`, installs the tarballs into both
fixture apps, then runs each app's own checks. The Svelte app runs `svelte-check`, a Theme-switch test
and a production build; the framework-free app builds with Tailwind v4 and asserts the compiled CSS:
the `--ds-` variables of both Themes, the resolved `bg-primary` utility and the `dark:` variant, plus
a Brand Asset import that resolves to an emitted file. It also fails if Svelte is installed, so the
non-Svelte consumer stays provable. CI runs the smoke as its own job.

TypeScript and test runners are split by package: `core`, `theme` and `assets` use TypeScript 7 and
`bun test`; `svelte` and Storybook pin TypeScript 6 locally and use `svelte-check`, Vitest and
Prettier for `.svelte` markup. See [ADR 0004](./docs/adr/0004-typescript-lint-and-test-tooling.md).

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
| `@trajectonomics/design-system-assets` | `packages/assets` | `release-assets.yml` | `assets-v` |

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
