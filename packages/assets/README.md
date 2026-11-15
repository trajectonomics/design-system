# @trajectonomics/design-system-assets

Trajectonomics Brand Assets for consumer sites: the logo mark, the wordmark and the Favicon Set, as
package exports. The package also ships the Brand Typeface: the Inter woff2 files and their
`@font-face` stylesheet, as opt-in exports.

```bash
bun add @trajectonomics/design-system-assets
```

No dependencies, no peer dependencies and no build step in your app: every export is a static file,
so a bundler resolves it through the package's `exports` and a rename is a breaking release.

## What it ships

| Export | What it is |
| --- | --- |
| `./logo/mark.svg` | The logo mark in `currentColor`, for inlining. |
| `./logo/wordmark.svg` | The wordmark in `currentColor`, for inlining. |
| `./logo/mark-on-light.svg` | The logo mark in black, for `<img>` on a light background. |
| `./logo/mark-on-dark.svg` | The logo mark in white, for `<img>` on a dark background. |
| `./logo/wordmark-on-light.svg` | The wordmark in black, for `<img>` on a light background. |
| `./logo/wordmark-on-dark.svg` | The wordmark in white, for `<img>` on a dark background. |
| `./favicon/favicon.svg` | The favicon, which follows `prefers-color-scheme` by itself. |
| `./favicon/favicon.ico` | The favicon at 16, 32 and 48 px, for browsers without SVG favicons. |
| `./favicon/apple-touch-icon.png` | The 180 px icon iOS uses for a home-screen bookmark. |
| `./favicon/icon-192.png` | The 192 px icon for an Android home screen or a web manifest. |
| `./favicon/icon-512.png` | The 512 px icon for an Android splash screen or a web manifest. |
| `./fonts/inter.css` | The Brand Typeface stylesheet: `@font-face` rules for `"Inter Variable"`, one per subset. |
| `./fonts/inter-latin-wght.woff2` | The latin subset of Inter Variable (wght 100–900), woff2. |
| `./fonts/inter-latin-ext-wght.woff2` | The latin-ext subset of Inter Variable (wght 100–900), woff2. |

The rasters are generated at release build time from `favicon.svg`; they are not checked in. The
woff2 files are vendored unchanged from `@fontsource-variable/inter@5.3.0` (see
[Provenance](#provenance)) and copied to `dist/fonts/` at build time, together with the generated
`inter.css`.

## Using the logo

Import the file and let your bundler resolve it to a URL:

```ts
import markOnLight from "@trajectonomics/design-system-assets/logo/mark-on-light.svg"

const logo = document.querySelector<HTMLImageElement>("#logo")
if (logo) logo.src = markOnLight
```

In a template, the imported value is the URL to put in `src`, so the same import works in React,
Vue, Svelte and Astro.

The `-on-light` and `-on-dark` files carry a fixed colour, so a background you cannot inspect still
shows the mark. The plain `mark.svg` and `wordmark.svg` use `currentColor`: inline the file and they
take the surrounding text colour, which is what a theme-aware header wants.

## Using the Favicon Set

Copy the files you need to a stable URL, for example a static site's `public` directory:

```bash
cp node_modules/@trajectonomics/design-system-assets/dist/favicon/* public/
```

Then declare them SVG first. Safari largely ignores an SVG favicon, so the ICO and the Apple touch
icon are the fallbacks:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

`favicon.svg` carries its own `prefers-color-scheme` rule, so the browser tab follows the reader's
scheme with no script. The ICO and the PNGs cannot adapt: they are the light-mode rendering, the
black mark on a transparent background. iOS composites a transparent Apple touch icon on black, so
draw the mark on your own background if it must read on a dark home screen.

## Using the Brand Typeface

Import the stylesheet once and assign your own `--font-*` variable; the stylesheet declares only
`@font-face` rules, so it sets no property on any element by itself:

```css
@import "@trajectonomics/design-system-assets/fonts/inter.css";

:root {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, "Segoe UI", "Leelawadee UI", Thonburi,
    "Noto Sans Thai", sans-serif;
}

[data-theme] {
  font-family: var(--font-sans);
}
```

Each subset carries its own `unicode-range` and `font-display: swap`, so text renders immediately in
a fallback and only the needed subset downloads. The stylesheet covers latin and latin-ext only:
keep a Thai-capable system stack behind `"Inter Variable"` in your own `--font-*` value, so Thai
glyphs fall through to the system fonts. A page with a no-web-font budget does not import
`inter.css` at all; the theme package's `typography.css` stays the zero-payload default.

## Provenance

The woff2 files are vendored unchanged from
[`@fontsource-variable/inter@5.3.0`](https://www.npmjs.com/package/@fontsource-variable/inter) (the
version `trajectonomics/docs` pins), renamed from its `files/` names:

| Vendored file | Source file in `@fontsource-variable/inter@5.3.0` | SHA-256 |
| --- | --- | --- |
| `fonts/inter-latin-wght.woff2` | `files/inter-latin-wght-normal.woff2` (48,256 bytes) | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| `fonts/inter-latin-ext-wght.woff2` | `files/inter-latin-ext-wght-normal.woff2` (85,068 bytes) | `34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956` |

The `unicode-range` values in `inter.css` are copied verbatim from that package's `index.css`.
Inter is licensed under the SIL Open Font License 1.1, whose text ships as
[INTER-OFL-1.1.txt](./INTER-OFL-1.1.txt).

## Licence

The art comes from the owner of Trajectonomics and is **not** MIT, unlike the code packages. It is
all rights reserved: you may render it unchanged inside products and documentation published by
Trajectonomics. See [NOTICE](./NOTICE). The wordmark was outlined from Inter SemiBold. The Brand
Typeface files (`dist/fonts/*.woff2` and `dist/fonts/inter.css`) are Inter, licensed under the SIL
Open Font License 1.1 in [INTER-OFL-1.1.txt](./INTER-OFL-1.1.txt); the artwork's licence is
unchanged by that.

Source, issues and the glossary: <https://github.com/trajectonomics/design-system>.
