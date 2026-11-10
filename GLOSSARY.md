# Domain Glossary: @trajectonomics/design-system

Ubiquitous language for `trajectonomics/design-system`. Every term defined here is binding across code, tests, documentation, and PR titles. Synonyms in a diff are defects.

## Core Terms

### Design Token
A named, platform-agnostic design decision (color, spacing, typography, etc.) with a typed value.

### Token Type
The kind of literal value a Design Token carries: a colour (`color`), a length or a font family.

### Primitive Token
A raw, context-free Design Token value such as a specific color or size. Primitive Tokens never reference another token.

### Semantic Token
A Design Token named by purpose (for example `color.primary`) that aliases a Primitive Token. Its name is a role in the Semantic Token Contract.

### Semantic Token Role
One name in the Semantic Token Contract together with the Token Type it accepts. Every Theme must resolve every role.

### Theme
A named set of values that resolves every Semantic Token for a given context (for example `light` or `dark`). A Theme is divided into sections: one section holds its token values, and later sections can hold other material. A Theme's name is a plain string. Themes form one flat list: no Theme is special, and `light` and `dark` are ordinary Themes.

### Semantic Token Contract
The fixed, closed set of Semantic Token names (roles) that every Theme must resolve, together with the Token Type each role accepts and the version of that set. It is defined only in this repository; no consumer can add or remove names. Every Theme is created in this repository first and then imported by client repositories.

### Theme CSS
The CSS form of a Theme: the values it resolves, expressed as CSS for an element and its descendants. Applying a Theme to an element makes that Theme's CSS apply to the element.

### Prebuilt Theme CSS
Theme CSS that ships as ready-to-import files for the built-in Themes. It comes from the same source as any other Theme's CSS.

### Tailwind Theme Stylesheet
A stylesheet that maps Tailwind utility colours onto Theme CSS, so utilities follow the active Theme.

### Web Consumer Contract
The stable surface a non-Svelte app may depend on: the `--ds-` custom properties, the `data-theme` selector that scopes them, the Tailwind Theme Stylesheet's colour names and the `theme` package's CSS exports. A change to it follows the per-surface compatibility rule in ADR 0005.

### Brand Asset
A static file that carries the Trajectonomics identity for consumers: the logo mark, the wordmark or a Favicon Set file. Brand Assets are not Design Tokens, and the art for them comes from the owner.

### Favicon Set
The Brand Assets a site needs for its browser and home-screen icons: an SVG favicon, an ICO, an Apple touch icon and 192 and 512 pixel PNGs.

### Hook
A reactive helper function, named `use*`, that the Svelte package exports for consumers (for example `useTheme`). A Hook exists only when a concrete component or consumer need requires it. Hooks belong to the Svelte package and never to the pure core.

### Component
A UI element exported by the Svelte package. A Component reads only Theme CSS and never chooses a Theme by name.

### Story
A preview of a Component in a named state, used to review UI changes visually.

### Invariant
A rule or condition that must hold true across all state transitions in this system.
