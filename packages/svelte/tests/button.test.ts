import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/svelte"
import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import Button from "../src/button/button.svelte"
import { type ButtonVariant, useTheme } from "../src/index"
import { compileButtonStyles } from "./compile-styles"

const VARIANTS: readonly [ButtonVariant, readonly string[]][] = [
	["default", ["bg-primary", "text-primary-foreground"]],
	["secondary", ["bg-secondary", "text-secondary-foreground"]],
	["destructive", ["bg-destructive", "text-destructive-foreground"]],
	["outline", ["border-input", "bg-background", "text-foreground"]],
	["ghost", ["hover:bg-accent", "hover:text-accent-foreground"]],
]

let compiledStyles: HTMLStyleElement

beforeAll(async () => {
	compiledStyles = document.createElement("style")
	compiledStyles.textContent = await compileButtonStyles()
	document.head.append(compiledStyles)
})

afterAll(() => {
	compiledStyles.remove()
})

function themeCss(): string {
	return document.head.querySelector("style[data-ds-theme]")?.textContent ?? ""
}

function sourceTexts(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name)
		return entry.isDirectory() ? sourceTexts(path) : [readFileSync(path, "utf8")]
	})
}

describe("Button", () => {
	it.each(VARIANTS)("renders the %s variant through Theme utilities", (variant, classes) => {
		render(Button, { props: { variant } })
		const button = screen.getByRole("button")
		for (const className of classes) expect(button).toHaveClass(className)
	})

	it("keeps the generated disabled state", () => {
		render(Button, { props: { disabled: true } })
		const button = screen.getByRole("button")
		expect(button).toBeDisabled()
		expect(button).toHaveClass("disabled:pointer-events-none")
		expect(button).toHaveClass("disabled:opacity-50")
	})

	it("focuses through the ring role", () => {
		render(Button)
		expect(screen.getByRole("button")).toHaveClass("focus-visible:ring-ring")
	})

	it("renders the same classes when the active Theme changes", () => {
		const theme = useTheme()
		render(Button)
		const button = screen.getByRole("button")

		theme.setTheme(lightTheme)
		const lightClasses = button.className
		const lightBackground = getComputedStyle(button).backgroundColor
		theme.setTheme(darkTheme)

		expect(button.className).toBe(lightClasses)
		expect(getComputedStyle(button).backgroundColor).not.toBe(lightBackground)
	})

	it("restyles through the active Theme without a rebuild", () => {
		const theme = useTheme()
		render(Button)
		const button = screen.getByRole("button")

		theme.setTheme(lightTheme)
		expect(button).toHaveClass("bg-primary")
		expect(themeCss()).toContain("--ds-color-primary: #171717;")
		expect(getComputedStyle(button).backgroundColor).toBe("rgb(23, 23, 23)")

		theme.setTheme(darkTheme)
		expect(button).toHaveClass("bg-primary")
		expect(themeCss()).toContain("--ds-color-primary: #e5e5e5;")
		expect(getComputedStyle(button).backgroundColor).toBe("rgb(229, 229, 229)")
	})

	it("never references a Theme name in the component source", () => {
		for (const source of sourceTexts(join(process.cwd(), "src"))) {
			expect(source).not.toMatch(/["'](?:light|dark)["']/)
		}
	})
})
