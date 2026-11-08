# ADR 0003: Themes as Runtime-Validated Data

## Status

Accepted

## Context

A Theme is a named set of values that resolves every Semantic Token in the Semantic Token Contract.
Themes are created in this repository first and then imported by client apps, and the same path must
later accept Themes generated from client configuration (white label) at runtime. That future makes
two things non-negotiable: a Theme cannot depend on a compile-time union of known names, and any
input derived from configuration must be validated before it reaches a CSS declaration.

At the same time, the starting component set comes from shadcn-svelte and expects the shadcn role
vocabulary. The Contract has to cover that vocabulary while staying small enough to stay honest.

## Decision

**Themes are plain, runtime-validated data.** A Theme is a sectioned object — a `tokens` section
today, with room for other sections later — with a plain string `name`. `defineTheme` is the one
checked path: it validates the input against the Contract at runtime and returns frozen data.
Names are never a union type, so adding a Theme never requires a type change, and components never
switch on a Theme name.

**Validation rules.** `defineTheme` rejects, each with its own `ThemeErrorCode` and a `field` that
mirrors the caller's input path:

1. a missing or non-object `tokens` section,
2. a missing Semantic Token,
3. an unknown Semantic Token (the Contract is closed),
4. a value of the wrong token type (colour, length, font family),
5. a value containing characters that could break out of a CSS declaration (`;`, `}`, `url(`),
6. an invalid Theme name (empty).

`ThemeError` lives in `theme` and mirrors core's `DomainError` shape (`code` + `field`), because
validation is theme behaviour and core must not depend on it. `UNKNOWN_CONTRACT_ROLE` keeps the same
code string in both enums because it is the same rule.

Built-in Themes are ordinary Themes: `light` and `dark` go through the same Theme resolution path and
have no special status.

**Amendment (`core` slice).** Dependencies point only `theme` → `core`, so `core` cannot call
`defineTheme`. `core` resolves its built-in Themes through one internal `defineBuiltInTheme` path
from one Primitive Token per Contract role. `defineTheme` remains the one checked path for raw Theme
input in `theme`, and the built-in Themes remain ordinary Themes with no special status.

**CSS emission is pure and deterministic.** A pure function turns any valid Theme into CSS custom
properties scoped by a `data-theme` selector. The same Theme always produces byte-identical CSS, so
builds are reproducible and cacheable. Variable names use the `--ds-` prefix plus the Semantic
Token name (for example `--ds-color-primary`).

**The Semantic Token Contract is closed and versioned.** Only this repository can add or remove
Semantic Tokens; consumers cannot extend the Contract. The Contract carries a version number so that
stored or generated Themes can be migrated when the Contract changes. `defineTheme` reads
`semanticTokenContract.version` on every call and records it on the returned Theme; a
`contractVersion` carried by a full Theme passed as input is ignored. Migrating stored Themes from
an older Contract remains out of scope for this slice. The Contract starts as the shadcn role set
under our dotted names:

- `color.background`, `color.foreground`
- `color.card`, `color.card.foreground`
- `color.popover`, `color.popover.foreground`
- `color.primary`, `color.primary.foreground`
- `color.secondary`, `color.secondary.foreground`
- `color.muted`, `color.muted.foreground`
- `color.accent`, `color.accent.foreground`
- `color.destructive`, `color.destructive.foreground`
- `color.border`, `color.input`, `color.ring`

Sidebar and chart names are excluded until a component needs them, and every other Semantic Token is
added only when a component needs it, so the Contract never fills with unused names.

**Seven white-label guardrails.** The full white-label feature set is out of scope for this slice.
These guardrails are the parts that must exist now, and each is enforced by at least one test:

1. Theme names are strings, not a union.
2. Validation and CSS emission are runtime functions that accept any valid Theme.
3. Components never reference a Theme by name.
4. The function that applies a Theme (`useTheme` in the Svelte package) accepts any Theme and scopes
   it to any element.
5. Token values are typed, and the emitter rejects unsafe values.
6. A Theme is a sectioned object.
7. The Semantic Token Contract carries a version number.

## Considered alternatives

- **A compile-time union of Theme names or a TypeScript-only Theme type.** Cheaper to write, but it
  makes generated Themes impossible and breaks guardrail 1. Rejected.
- **A class-based Theme with methods.** Keeps validation and emission close to the data, but a Theme
  could then no longer be stored, serialized, diffed or migrated as plain data. Rejected.
- **Validate only when building this repository's Themes.** Leaves generated Themes unvalidated and
  puts the unsafe-value checks on the wrong side of the boundary once client input exists. Rejected.

## Consequences

- A Theme generated from client configuration can use the same `defineTheme` path later without
  rework, and a new Theme needs no component change.
- Validation cost is paid once, when a Theme is defined, not on every render or every CSS read.
- The Contract is a closed world: adding a Semantic Token is a `core` change plus a version bump
  plus updates to every Theme. That is the point — an incomplete Theme cannot ship.
- Error codes and `field` paths are public API: client apps and tests distinguish failures by code,
  so a rule's code must never be repurposed for another rule.
- White label still needs work that this ADR does not cover: brand input schema, colour derivation,
  contrast enforcement, font loading, asset handling, runtime delivery, light/dark pairing, locked
  Semantic Tokens and Contract migration. The guardrails keep those additions from requiring a
  redesign.
