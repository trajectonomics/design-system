# @trajectonomics/design-system-assets

Trajectonomics Brand Assets for consumer sites: the logo mark, the wordmark and the Favicon Set, as
package exports. The package also ships the Brand Typeface: the Inter, Aleo and Azeret Mono woff2
files and their `@font-face` stylesheets, as opt-in exports.

```bash
bun add @trajectonomics/design-system-assets@alpha
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
| `./logo/mark-tile.svg` | The logo mark on its filled tile, which follows `prefers-color-scheme` by itself. |
| `./favicon/favicon.svg` | The favicon: the mark on its tile, which follows `prefers-color-scheme` by itself. |
| `./favicon/favicon.ico` | The favicon at 16, 32 and 48 px, for browsers without SVG favicons. |
| `./favicon/apple-touch-icon.png` | The 180 px icon iOS uses for a home-screen bookmark. |
| `./favicon/icon-192.png` | The 192 px icon for an Android home screen or a web manifest. |
| `./favicon/icon-512.png` | The 512 px icon for an Android splash screen or a web manifest. |
| `./fonts/inter.css` | The Inter stylesheet: `@font-face` rules for `"Inter Variable"`, one per subset. |
| `./fonts/brand.css` | The brand stylesheet: `@font-face` rules for every family the package ships, plus a metric-matched fallback family per brand family. |
| `./fonts/inter-latin-wght.woff2` | The latin subset of Inter Variable (wght 100–900), woff2. |
| `./fonts/inter-latin-ext-wght.woff2` | The latin-ext subset of Inter Variable (wght 100–900), woff2. |
| `./fonts/aleo-latin-300.woff2` | The latin subset of Aleo Light (300), woff2. |
| `./fonts/aleo-latin-400.woff2` | The latin subset of Aleo Regular (400), woff2. |
| `./fonts/azeret-mono-latin-500.woff2` | The latin subset of Azeret Mono Medium (500), woff2. |

The rasters are generated at release build time from `favicon.svg`; they are not checked in. The
woff2 files are vendored unchanged (see [Provenance](#provenance)) and copied to `dist/fonts/` at
build time, together with the generated `inter.css` and the checked-in `brand.css`.

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
take the surrounding text colour, which is what a theme-aware header wants. `mark-tile.svg` is the mark on its filled tile for `<img>` consumers that cannot compose a tile in CSS: the tile is
near-black with a near-white mark under `prefers-color-scheme: light` and near-white with a dark
mark under `dark`, matching the `bg-primary`/`text-primary-foreground` pair in both Themes. The two
colours are written into the art as the values the built-in `light` and `dark` Themes give
`color.primary` and `color.primary.foreground` — `#171717` behind a `#fafafa` mark, then `#e5e5e5`
behind a `#171717` mark — so a custom Theme that resolves those roles differently is not followed by
the file.

The tile follows the page's colour scheme, not the band it sits on: `color.stage` is `#171717` in the
light Theme, so the light-scheme tile merges into the dark Stage Surface and only its mark shows.
Inline `./logo/mark.svg` with that band's `text-stage-foreground` there instead of stacking the tile
on it.

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
scheme with no script: the mark sits on its tile, near-black with a near-white mark in light and
near-white with a dark mark in dark. The ICO and the PNGs cannot adapt: they are the light-mode
rendering, the near-white mark on the near-black tile, so they already carry their own background
wherever a transparent icon would not read.

## Using the Brand Typeface

Import a stylesheet once and assign your own `--font-*` variable; the stylesheets declare only
`@font-face` rules, so they set no property on any element by themselves:

```css
@import "@trajectonomics/design-system-assets/fonts/brand.css";

:root {
  --font-sans: "Inter Variable", "Inter Fallback", ui-sans-serif, system-ui, "Segoe UI",
    "Leelawadee UI", Thonburi, "Noto Sans Thai", sans-serif;
  --font-display: "Aleo", "Aleo Fallback", Georgia, serif;
  --font-mono: "Azeret Mono", "Azeret Mono Fallback", ui-monospace, monospace;
}

[data-theme] {
  font-family: var(--font-sans);
}
```

`brand.css` declares every family the package ships — Inter Variable, Aleo and Azeret Mono — plus
a metric-matched fallback family per brand family (`"Inter Fallback"`, `"Aleo Fallback"`,
`"Azeret Mono Fallback"`), whose `size-adjust`, `ascent-override`, `descent-override` and
`line-gap-override` reproduce the web font's line box, so the first paint does not shift while the
woff2 loads. Put the fallback right behind the web font in your own stack, as above. `inter.css`
stays the Inter-only stylesheet for consumers that want just the body face.

Each subset carries its own `unicode-range` and `font-display: swap`, so text renders immediately in
a fallback and only the needed subset downloads. The stylesheets cover latin and latin-ext only:
keep a Thai-capable system stack behind the brand family in your own `--font-*` value, so Thai
glyphs fall through to the system fonts. A page with a no-web-font budget does not import either
stylesheet at all; the theme package's `typography.css` stays the zero-payload default.

## Provenance

The Inter woff2 files are vendored unchanged from
[`@fontsource-variable/inter@5.3.0`](https://www.npmjs.com/package/@fontsource-variable/inter) (the
version `trajectonomics/docs` pins), renamed from its `files/` names. The Aleo and Azeret Mono woff2
files are the latin subsets Google Fonts serves through its css2 API for the exact weights the
brand uses, downloaded unchanged:

| Vendored file | Source | SHA-256 |
| --- | --- | --- |
| `fonts/inter-latin-wght.woff2` | `files/inter-latin-wght-normal.woff2` in `@fontsource-variable/inter@5.3.0` (48,256 bytes) | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| `fonts/inter-latin-ext-wght.woff2` | `files/inter-latin-ext-wght-normal.woff2` in `@fontsource-variable/inter@5.3.0` (85,068 bytes) | `34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956` |
| `fonts/aleo-latin-300.woff2` | latin subset of `Aleo:wght@300`, `https://fonts.gstatic.com/s/aleo/v16/c4m61nF8G8_s6gHhIOX0IYBo_KIpGlP6Fo8.woff2` (14,900 bytes) | `6005b949ecf692658fb051b7863a1b4e7ac6028679efe1d3f684e69c6171ba78` |
| `fonts/aleo-latin-400.woff2` | latin subset of `Aleo:wght@400`, `https://fonts.gstatic.com/s/aleo/v16/c4m61nF8G8_s6gHhIOX0IYBo_KJ3GlP6Fo8.woff2` (14,848 bytes) | `0b754f5985fd2b773d5fc55c2f7fb8a6b60c06f4bba08615789f4a24692fa20a` |
| `fonts/azeret-mono-latin-500.woff2` | latin subset of `Azeret+Mono:wght@500`, `https://fonts.gstatic.com/s/azeretmono/v21/3XF5ErsiyJsY9O_Gepph-FvtTQgMQUdNekSfrvVR1byb.woff2` (10,884 bytes) | `be8abdd09a16e1a4469f9e25959e50c80dade1ecf97e52e8b3c80f000a2a5570` |

The `unicode-range` values in `inter.css` are copied verbatim from that package's `index.css`; the
ones in `brand.css` are the latin ranges the css2 API serves. The fallback families' metric
overrides are computed from each family's hhea metrics against the fallback font's (Arial, Times
New Roman, Courier New), so each fallback's line box equals the web font's.

Inter, Aleo and Azeret Mono are each licensed under the SIL Open Font License 1.1, whose texts ship
as [INTER-OFL-1.1.txt](./INTER-OFL-1.1.txt), [ALEO-OFL-1.1.txt](./ALEO-OFL-1.1.txt) and
[AZERET-MONO-OFL-1.1.txt](./AZERET-MONO-OFL-1.1.txt), copied from
[github.com/google/fonts](https://github.com/google/fonts).

## Licence

The art comes from the owner of Trajectonomics and is **not** MIT, unlike the code packages. It is
all rights reserved: you may render it unchanged inside products and documentation published by
Trajectonomics. See [NOTICE](./NOTICE). The wordmark was outlined from Inter SemiBold. The Brand
Typeface files (`dist/fonts/*.woff2` and `dist/fonts/*.css`) are Inter, Aleo and Azeret Mono,
licensed under the SIL Open Font License 1.1 in [INTER-OFL-1.1.txt](./INTER-OFL-1.1.txt),
[ALEO-OFL-1.1.txt](./ALEO-OFL-1.1.txt) and [AZERET-MONO-OFL-1.1.txt](./AZERET-MONO-OFL-1.1.txt); the
artwork's licence is unchanged by that.

Source, issues and the glossary: <https://github.com/trajectonomics/design-system>.
