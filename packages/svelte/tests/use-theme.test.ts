import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { defineTheme } from "@trajectonomics/design-system-theme"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { useTheme } from "../src/index"

const customTheme = defineTheme({
	name: "brand-ocean",
	tokens: { ...lightTheme.tokens, "color.primary": "#123456" },
})

const lightNamedCustomTheme = defineTheme({
	name: "light",
	tokens: { ...lightTheme.tokens, "color.primary": "#abcdef" },
})

function themeStyles(): HTMLStyleElement[] {
	return [...document.head.querySelectorAll<HTMLStyleElement>("style[data-ds-theme]")]
}

beforeEach(() => {
	document.body.replaceChildren()
	for (const style of themeStyles()) style.remove()
	document.documentElement.removeAttribute("data-theme")
})

afterEach(() => {
	for (const style of themeStyles()) style.remove()
	document.documentElement.removeAttribute("data-theme")
})

describe("useTheme", () => {
	it("sets data-theme on the chosen element and injects the Theme CSS", () => {
		const element = document.createElement("div")
		document.body.append(element)

		const theme = useTheme({ element: () => element })
		theme.setTheme(lightTheme)

		expect(element.getAttribute("data-theme")).toBe("light")
		expect(theme.current).toBe(lightTheme)
		expect(themeStyles()).toHaveLength(1)
		expect(themeStyles()[0]?.textContent).toContain("--ds-color-primary: #171717;")
	})

	it("accepts any valid Theme, not only the built-in ones", () => {
		const element = document.createElement("div")
		document.body.append(element)

		useTheme({ element: () => element }).setTheme(customTheme)

		expect(element.getAttribute("data-theme")).toBe("brand-ocean")
		expect(themeStyles()[0]?.textContent).toContain("--ds-color-primary: #123456;")
	})

	it("scopes a Theme to a nested element without affecting the page", () => {
		const nested = document.createElement("section")
		document.body.append(nested)

		useTheme().setTheme(darkTheme, nested)

		expect(nested.getAttribute("data-theme")).toBe("dark")
		expect(document.documentElement.hasAttribute("data-theme")).toBe(false)
		expect(document.body.hasAttribute("data-theme")).toBe(false)
		expect(themeStyles()[0]?.textContent).toContain("--ds-color-primary: #e5e5e5;")
	})

	it("replaces the injected CSS and the attribute when the Theme changes", () => {
		const element = document.createElement("div")
		document.body.append(element)

		const theme = useTheme({ element: () => element })
		theme.setTheme(lightTheme)
		theme.setTheme(darkTheme)

		expect(element.getAttribute("data-theme")).toBe("dark")
		expect(themeStyles()).toHaveLength(1)
		expect(themeStyles()[0]?.textContent).toContain("--ds-color-primary: #e5e5e5;")
		expect(themeStyles()[0]?.textContent).not.toContain("--ds-color-primary: #171717;")
	})

	it("never switches on a Theme name", () => {
		const element = document.createElement("div")
		document.body.append(element)

		useTheme({ element: () => element }).setTheme(lightNamedCustomTheme)

		expect(element.getAttribute("data-theme")).toBe("light")
		expect(themeStyles()[0]?.textContent).toContain("--ds-color-primary: #abcdef;")
		expect(themeStyles()[0]?.textContent).not.toContain("--ds-color-primary: #171717;")
	})

	it("applies the initial Theme when one is supplied", () => {
		const element = document.createElement("div")
		document.body.append(element)

		const theme = useTheme({ element: () => element, theme: customTheme })

		expect(theme.current).toBe(customTheme)
		expect(element.getAttribute("data-theme")).toBe("brand-ocean")
	})

	it("moves a Theme from the page to a nested element", () => {
		const nested = document.createElement("section")
		document.body.append(nested)

		const theme = useTheme({ element: () => document.documentElement })
		theme.setTheme(lightTheme)
		theme.setTheme(darkTheme, nested)

		expect(document.documentElement.hasAttribute("data-theme")).toBe(false)
		expect(nested.getAttribute("data-theme")).toBe("dark")
	})

	it("clears the previous element's data-theme when the Theme moves", () => {
		const first = document.createElement("div")
		const second = document.createElement("div")
		document.body.append(first, second)

		const theme = useTheme({ element: () => first })
		theme.setTheme(lightTheme)
		theme.setTheme(darkTheme, second)

		expect(first.hasAttribute("data-theme")).toBe(false)
		expect(second.getAttribute("data-theme")).toBe("dark")
	})
})
