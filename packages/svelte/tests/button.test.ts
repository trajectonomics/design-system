import { render, screen } from "@testing-library/svelte"
import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { describe, expect, it } from "vitest"
import Button from "../src/button/button.svelte"
import { type ButtonVariant, useTheme } from "../src/index"

const VARIANTS: readonly [ButtonVariant, readonly string[]][] = [
	["default", ["bg-primary", "text-primary-foreground"]],
	["secondary", ["bg-secondary", "text-secondary-foreground"]],
	["destructive", ["bg-destructive", "text-destructive-foreground"]],
	["outline", ["border-input", "bg-background", "text-foreground"]],
	["ghost", ["hover:bg-accent", "hover:text-accent-foreground"]],
]

function themeCss(): string {
	return document.head.querySelector("style[data-ds-theme]")?.textContent ?? ""
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

	it("renders the same classes under different Themes", () => {
		const theme = useTheme()
		render(Button)
		const button = screen.getByRole("button")

		theme.setTheme(lightTheme)
		const lightClasses = button.className
		theme.setTheme(darkTheme)

		expect(button.className).toBe(lightClasses)
	})

	it("restyles through the active Theme without a rebuild", () => {
		const theme = useTheme()
		render(Button)
		const button = screen.getByRole("button")

		theme.setTheme(lightTheme)
		expect(button).toHaveClass("bg-primary")
		expect(themeCss()).toContain("--ds-color-primary: #171717;")

		theme.setTheme(darkTheme)
		expect(button).toHaveClass("bg-primary")
		expect(themeCss()).toContain("--ds-color-primary: #e5e5e5;")
	})
})
