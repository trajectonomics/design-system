# Domain Glossary: @trajectonomics/design-system

Ubiquitous language for `trajectonomics/design-system`. Every term defined here is binding across code, tests, documentation, and PR titles. Synonyms in a diff are defects.

## Core Terms

### Design Token
A named, platform-agnostic design decision (color, spacing, typography, etc.) with a typed value.

### Primitive Token
A raw, context-free Design Token value such as a specific color or size. Primitive Tokens never reference another token.

### Semantic Token
A Design Token named by purpose (for example `color.text.primary`) that aliases a Primitive Token.

### Theme
A named set of values that resolves every Semantic Token for a given context (for example `light` or `dark`). Themes form one flat list: no Theme is special, and `light` and `dark` are ordinary Themes.

### Semantic Token Contract
The fixed, closed set of Semantic Token names that every Theme must resolve. It is defined only in this repository; no consumer can add or remove names. Every Theme is created in this repository first and then imported by client repositories.

### Hook
A reactive helper function, named `use*`, that the Svelte package exports for consumers (for example `useTheme`). A Hook exists only when a concrete component or consumer need requires it. Hooks belong to the Svelte package and never to the pure core.

### Invariant
A rule or condition that must hold true across all state transitions in this system.
