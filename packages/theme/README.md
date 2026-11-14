# @trajectonomics/design-system-theme

Pure behaviour for the Trajectonomics design system: `defineTheme` with Contract validation, Theme CSS emission, the prebuilt `light` and `dark` Theme CSS, the Tailwind Theme Stylesheet and the System Typography Stylesheet.

```bash
bun add @trajectonomics/design-system-theme @trajectonomics/design-system
```

`@trajectonomics/design-system` is a peer dependency. The package exports `./themes/light.css`, `./themes/dark.css`, `./tailwind.css` and `./typography.css`.

`typography.css` is optional. Import it beside the prebuilt Theme CSS to give text on a themed element a system font stack with Thai coverage, a line height that fits Thai vowels, and normal word breaking. It loads no font file and declares no `--ds-` property, and it is not a Theme.

Source, issues and the glossary: <https://github.com/trajectonomics/design-system>. MIT licensed.
