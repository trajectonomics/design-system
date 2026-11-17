# Brand source

Owner-supplied Trajectonomics brand art, the source for `@trajectonomics/design-system-assets` (ticket #44). Agents must not redraw or invent brand art; take it from here.

- `svg/`: the source files. Every SVG has a `viewBox` and outlined paths (no live text). `mark.svg`, `wordmark.svg` and `lockup.svg` use `currentColor`; the `-on-light` files are black and the `-on-dark` files are white. `mark-tile.svg` is the mark on its filled tile and `favicon.svg` is the favicon silhouette on the same tile: both carry their own `prefers-color-scheme` rule, which swaps the tile and the mark between schemes.
- `webp/`: lossless raster copies of the same art, for places that cannot use SVG.
- `NOTICE`: the licence for these files (all rights reserved). It is not MIT, unlike the rest of the repository.
- `INTER-OFL-1.1.txt`: the licence of the typeface the wordmark was outlined from.

Provenance: the mark was traced from the owner's JPEG logo (`trajectonomics-logo-light.jpeg` and `trajectonomics-logo-1024.jpeg`, 99.95% pixel match); the wordmark is "Trajectonomics" in Inter SemiBold, outlined, generated at the owner's request on 2026-11-12. The owner approved both.

The two tiled files were composed at the owner's direction in `design-system#76`, against the
twenty.com header reference the issue names. The mark paths are copied unchanged from `mark.svg`
and from the original favicon silhouette; the tile is one full-bleed `rect` with a corner radius of
6/40 of the canvas; the two fills are the built-in Themes' `color.primary` and
`color.primary.foreground` values. Nothing was redrawn, and the owner approved the composition on
2026-11-15.
