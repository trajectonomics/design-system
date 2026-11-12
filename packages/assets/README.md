# @trajectonomics/design-system-assets

Trajectonomics Brand Assets for consumer sites: the logo mark, the wordmark and the Favicon Set, as
package exports.

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

The rasters are generated at release build time from `favicon.svg`; they are not checked in.

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
black mark on a transparent background.

## Licence

The art comes from the owner of Trajectonomics and is **not** MIT, unlike the code packages. It is
all rights reserved: you may render it unchanged inside products and documentation published by
Trajectonomics. See [NOTICE](./NOTICE). The wordmark was outlined from Inter SemiBold, whose SIL Open
Font License 1.1 is in [INTER-OFL-1.1.txt](./INTER-OFL-1.1.txt).

Source, issues and the glossary: <https://github.com/trajectonomics/design-system>.
