# ADR 0005: Web Consumer Contract

## Status

Accepted

## Context

`trajectonomics/docs` (Fumadocs, Astro, React, Tailwind v4) is the first consumer that is not
Svelte, and the marketing site follows. The `theme` package already ships prebuilt Theme CSS
(`themes/light.css`, `themes/dark.css`) and a Tailwind v4 stylesheet (`tailwind.css`), so the web
preset exists. What was missing is a written statement of which parts a non-Svelte app may depend
on, how a Theme is selected, and what a release means for each surface. Brand Assets (logo,
wordmark, Favicon Set) do not exist anywhere in the organisation yet.

## Decision

**The web preset is the existing CSS.** The prebuilt Theme CSS and the Tailwind Theme Stylesheet
are the preset. There is no JS or Tailwind "preset" export: Tailwind v4 has no JS presets, and a
CSS stylesheet is its v4 form. A consumer maps `--ds-*` to its own variables and owns its layout;
for example the Fumadocs `--fd-*` mapping stays in `trajectonomics/docs`.

**The Web Consumer Contract is a stable surface.** It is the set of:

- the `--ds-` custom properties, named `--ds-` plus the Semantic Token Role name with dots replaced
  by dashes (ADR 0003 defines the rule; this ADR only makes its output public API),
- the `[data-theme="<name>"]` selector that scopes them,
- the Tailwind Theme Stylesheet's utility colour names,
- the CSS sub-path exports of the `theme` package.

**Selection is explicit.** No Theme is special (see the Glossary), so the prebuilt CSS defines no
default Theme. A consumer sets `data-theme` on `<html>` or on any element, before first paint to
avoid a flash. A page without `data-theme` is unstyled. The `theme` package gets no runtime helper
for this: Hooks belong to the Svelte package. The README documents an inline snippet, how to sync a
`.dark` class or `prefers-color-scheme`, and a copy-paste `dark:` variant tied to `data-theme`. The
Tailwind stylesheet itself ships no `dark` variant, because it would change `dark:` behaviour for
every Tailwind consumer.

**Compatibility rule, per surface.**

- CSS surface: adding a Semantic Token Role is additive (a minor release). Renaming or removing a
  role, changing the `--ds-` prefix or the selector, or renaming a CSS export is breaking.
- `core` and `defineTheme` surface: adding a role is breaking for anyone who calls `defineTheme` on
  their own input, because it now fails with `MISSING_CONTRACT_ROLE`. It needs a Semantic Token
  Contract version bump, a `core` release first, the `theme` and `svelte` peer ranges updated
  explicitly (a `^0.1.0` caret stops below `0.2.0`), and a `feat!` commit. `scripts/version.ts`
  maps that to a minor while the package is on 0.x.

**No new roles for this.** Fonts, radius, sidebar and chart roles stay out until a component, or
the docs design decision (`trajectonomics/docs#10`), names a need (ADR 0003). That would be a
separate Spec. A System Typography Stylesheet may ship without those roles; see the amendment.

**Brand Assets are a separate leaf package.** Logo mark, wordmark and Favicon Set publish as
`@trajectonomics/design-system-assets`: static files with no dependencies and no peer dependencies,
with its own release workflow (`release-assets.yml`, tag prefix `assets-v`), so art changes and Theme
changes release independently (ADR 0002). The art and the licence for it come from the owner; agents
do not invent brand art. That package's layout and release pipeline are recorded in ADR 0002's
amendment, and its publishing steps in `docs/publishing.md`
(`trajectonomics/design-system#34`). Its `exports` subpaths are that package's own contract, pinned by
its own tests: Brand Assets are not Design Tokens, so they are not part of the Web Consumer Contract
above.

## Considered alternatives

- **Ship a `dark` variant in `tailwind.css`.** Convenient, but it silently changes `dark:` for
  every Tailwind consumer. Rejected; documented instead.
- **Define a default Theme in the prebuilt CSS.** Makes a bare page look right, but gives one Theme
  a special status, against the Glossary. Rejected.
- **Put assets in the `theme` package.** Cheaper (no new package to publish), but couples art
  releases to Theme releases, which ADR 0002 avoids. Rejected.

## Consequences

- A non-Svelte consumer can depend on the surface above, and a change to it is a visible, versioned
  event (a snapshot test pins it).
- A new Semantic Token Role costs a coordinated `core`, `theme` and `svelte` release, not just a
  `core` bump.
- Consumers must set `data-theme` themselves; the cost of one attribute buys a Theme list with no
  special case.

## Amendment: System Typography Stylesheet

- 2026-11-14: the theme package gains an optional CSS export, `./typography.css`, the System
  Typography Stylesheet (`trajectonomics/design-system#53`). It is part of the Web Consumer
  Contract's CSS export list. Adding the export is additive (a minor release). It adds no Semantic
  Token Role, and prebuilt Theme CSS stays colour-only. `fontFamily` stays a Token Type with no
  role. A later Component that needs a font-family role is still a separate Spec, as "No new roles
  for this" says. The sheet uses system fonts only: no `@font-face` and no font file. That choice
  meets the marketing page's ban on font files; it is not a ban on a self-hosted face under a later
  spec. Social images and page layout stay out of this repository. Where a social image lives is
  not decided here.

## Amendment: Brand Typeface exports in the assets package

- 2026-11-14: the assets package ships the Brand Typeface (the Glossary's new term) as opt-in
  `./fonts/*` exports — `./fonts/inter.css` plus the Inter woff2 files —
  (`trajectonomics/design-system#61`). Those subpaths are the assets package's own contract, pinned
  by its own tests, not part of the Web Consumer Contract above; adding them is additive (a minor
  release). The Brand Typeface is licensed under the SIL Open Font License 1.1
  (`INTER-OFL-1.1.txt`), not the artwork's NOTICE. `typography.css` stays system-only: no
  `@font-face` and no font file, so the zero-payload default is unchanged, and consumers keep
  owning their `--font-*` variable assignment.

## Amendment: Semantic Token Contract v2 (length and fontFamily roles)

- 2026-11-14: the approved Spec `trajectonomics/design-system#60` extends the Contract to version 2
  with 25 `length` and `fontFamily` roles: `radius.sm|md|lg|xl`, `space.1`–`space.10`, `space.12`,
  `space.16`, `font.family.sans`, `font.family.mono` and `font.size.xs|sm|base|lg|xl|2xl|3xl`. The
  `--ds-*` custom properties for these roles, and the Tailwind Theme Stylesheet's mapped names
  (`--radius-*`, `--spacing-*`, `--font-*`, `--text-*` alongside `--color-*`), join the Web Consumer
  Contract. This supersedes the "utility colour names" clause above, the "No new roles for this"
  clause, and the System Typography Stylesheet amendment's "prebuilt Theme CSS stays colour-only" and
  "`fontFamily` stays a Token Type with no role" lines. Compatibility follows the per-surface rule
  above unchanged: additive (a minor release) on the CSS surface; breaking for `defineTheme` callers,
  so it ships with Contract version 2, a `feat!` commit, explicit peer ranges (`^0.1.0-alpha.3` on
  `@trajectonomics/design-system` in `theme` and `svelte`, `^0.1.0-alpha.4` on
  `@trajectonomics/design-system-theme` in `svelte`, on the current pre-`0.1.0` alpha line) and release
  order `core` → `theme` → `svelte`. Shadow roles stay out: no Token Type accepts a shadow literal, so
  a `shadow` Token Type or composed shadow roles are a separate Spec. The System Typography
  Stylesheet stays unchanged and optional; the built-in Themes' `font.family.sans` carries the same
  system stack.
