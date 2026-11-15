import { describe, expect, it } from "bun:test"
import { darkTheme, lightTheme, semanticTokenContract } from "@trajectonomics/design-system"
import { defineTheme, themeToCss } from "./index"
import { tokensForContract } from "./theme.support"

const CUSTOM_NAME = "brand-ocean"

const CUSTOM_CSS = `[data-theme="brand-ocean"] {
  --ds-color-background: #123456;
  --ds-color-foreground: #123456;
  --ds-color-card: #123456;
  --ds-color-card-foreground: #123456;
  --ds-color-popover: #123456;
  --ds-color-popover-foreground: #123456;
  --ds-color-primary: #123456;
  --ds-color-primary-foreground: #123456;
  --ds-color-secondary: #123456;
  --ds-color-secondary-foreground: #123456;
  --ds-color-muted: #123456;
  --ds-color-muted-foreground: #123456;
  --ds-color-accent: #123456;
  --ds-color-accent-foreground: #123456;
  --ds-color-destructive: #123456;
  --ds-color-destructive-foreground: #123456;
  --ds-color-border: #123456;
  --ds-color-input: #123456;
  --ds-color-ring: #123456;
  --ds-radius-sm: 1rem;
  --ds-radius-md: 1rem;
  --ds-radius-lg: 1rem;
  --ds-radius-xl: 1rem;
  --ds-space-1: 1rem;
  --ds-space-2: 1rem;
  --ds-space-3: 1rem;
  --ds-space-4: 1rem;
  --ds-space-5: 1rem;
  --ds-space-6: 1rem;
  --ds-space-7: 1rem;
  --ds-space-8: 1rem;
  --ds-space-9: 1rem;
  --ds-space-10: 1rem;
  --ds-space-12: 1rem;
  --ds-space-16: 1rem;
  --ds-font-family-sans: Inter, sans-serif;
  --ds-font-family-mono: Inter, sans-serif;
  --ds-font-size-xs: 1rem;
  --ds-font-size-sm: 1rem;
  --ds-font-size-base: 1rem;
  --ds-font-size-lg: 1rem;
  --ds-font-size-xl: 1rem;
  --ds-font-size-2xl: 1rem;
  --ds-font-size-3xl: 1rem;
}
`

function customTheme(name: string = CUSTOM_NAME) {
	return defineTheme({ name, tokens: tokensForContract() })
}

describe("Theme CSS", () => {
	it("renders every Contract role as a --ds- custom property in Contract order", () => {
		expect(themeToCss(customTheme())).toBe(CUSTOM_CSS)
	})

	it("produces byte-identical CSS for the same Theme", () => {
		const theme = customTheme()
		expect(themeToCss(theme)).toBe(themeToCss(theme))
	})

	it("ignores the caller's token insertion order", () => {
		const tokens = Object.fromEntries(Object.entries(tokensForContract()).reverse())
		const outOfOrder = { name: CUSTOM_NAME, contractVersion: semanticTokenContract.version, tokens }
		expect(themeToCss(outOfOrder)).toBe(CUSTOM_CSS)
	})

	it("never mutates the caller's Theme", () => {
		const tokens = Object.freeze(tokensForContract())
		const theme = Object.freeze({
			name: CUSTOM_NAME,
			contractVersion: semanticTokenContract.version,
			tokens,
		})
		themeToCss(theme)
		expect(theme.tokens).toEqual(tokensForContract())
	})

	it("scopes each Theme to its own data-theme attribute selector", () => {
		const css = themeToCss(lightTheme) + themeToCss(darkTheme)
		expect(css).toContain('[data-theme="light"] {')
		expect(css).toContain('[data-theme="dark"] {')
		expect(css).not.toContain(":root")
	})

	it.each([
		["light", '[data-theme="light"]'],
		["brand-ocean", '[data-theme="brand-ocean"]'],
		['brand "ocean"', '[data-theme="brand \\"ocean\\""]'],
		["brand\\ocean", '[data-theme="brand\\\\ocean"]'],
		["brand\nnewline", '[data-theme="brand\\a newline"]'],
		["  padded  ", '[data-theme="padded"]'],
	] as const)("emits a Theme named %p with its own selector", (name, selector) => {
		expect(themeToCss(customTheme(name)).startsWith(`${selector} {`)).toBe(true)
	})

	it.each(["#fff", "#ffffffcc", "rgb(1, 2, 3)", "hsl(210 40% 50%)", "oklch(0.7 0.1 200)"])(
		"emits any valid Theme value %p",
		(value) => {
			const tokens = { ...tokensForContract(), "color.primary": value }
			const css = themeToCss(defineTheme({ name: CUSTOM_NAME, tokens }))
			expect(css).toContain(`--ds-color-primary: ${value};`)
		},
	)

	it("emits a length role and a font family role under their --ds- names", () => {
		const tokens = {
			...tokensForContract(),
			"radius.xl": "0.75rem",
			"space.4": "1rem",
			"font.family.sans": "ui-sans-serif, sans-serif",
			"font.size.base": "1.125rem",
		}
		const css = themeToCss(defineTheme({ name: CUSTOM_NAME, tokens }))
		expect(css).toContain("--ds-radius-xl: 0.75rem;")
		expect(css).toContain("--ds-space-4: 1rem;")
		expect(css).toContain("--ds-font-family-sans: ui-sans-serif, sans-serif;")
		expect(css).toContain("--ds-font-size-base: 1.125rem;")
	})

	it("never substitutes a built-in Theme's values for a Theme reusing its name", () => {
		const css = themeToCss(customTheme("light"))
		expect(css).toContain("--ds-color-background: #123456;")
		expect(css).not.toContain("#ffffff")
	})
})
