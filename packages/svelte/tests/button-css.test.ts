import { describe, expect, it } from "vitest"
import { compileButtonStyles } from "./compile-styles"

describe("Button stylesheet", () => {
	it("compiles every variant to the --ds- Theme variables", async () => {
		const css = await compileButtonStyles()
		expect(css).toContain(".bg-primary {")
		expect(css).toContain("background-color: var(--ds-color-primary);")
		expect(css).toContain(".text-primary-foreground {")
		expect(css).toContain("color: var(--ds-color-primary-foreground);")
		expect(css).toContain(".bg-secondary {")
		expect(css).toContain("background-color: var(--ds-color-secondary);")
		expect(css).toContain(".bg-destructive {")
		expect(css).toContain("background-color: var(--ds-color-destructive);")
		expect(css).toContain(".border-input {")
		expect(css).toContain("border-color: var(--ds-color-input);")
		expect(css).toContain(".bg-background {")
		expect(css).toContain("background-color: var(--ds-color-background);")
		expect(css).toContain(".hover\\:bg-accent:hover {")
		expect(css).toContain("background-color: var(--ds-color-accent);")
	})

	it("compiles the focus ring from the ring role", async () => {
		const css = await compileButtonStyles()
		expect(css).toContain(".focus-visible\\:ring-ring:focus-visible {")
		expect(css).toContain("--tw-ring-color: var(--ds-color-ring);")
	})

	it("compiles a standalone stylesheet with no Tailwind directives or preflight", async () => {
		const css = await compileButtonStyles()
		expect(css).not.toContain('@import "tailwindcss"')
		expect(css).not.toContain("@theme")
		expect(css).not.toContain("box-sizing: border-box")
		expect(css).not.toContain("margin: 0;\n  padding: 0;")
		expect(css).toContain(".bg-primary")
		expect(css).toContain("var(--ds-color-primary)")
	})

	it("ships no hardcoded colours in the Button utility rules", async () => {
		const css = await compileButtonStyles()
		const buttonRules = [
			...css.matchAll(/\.(?:bg|text|border|hover|focus-visible)[^{]*\{([^}]*)\}/g),
		].map((match) => match[1] ?? "")
		expect(buttonRules.some((rule) => rule.includes("var(--ds-"))).toBe(true)
		for (const rule of buttonRules) expect(rule).not.toMatch(/#[0-9a-f]{3,8}/i)
	})
})
