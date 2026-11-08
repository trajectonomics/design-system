import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fireEvent, render, screen } from "@testing-library/svelte"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import App from "../src/App.svelte"

function buttonStylesheet(): string {
	return readFileSync(
		join(process.cwd(), "node_modules/@trajectonomics/design-system-svelte/dist/style.css"),
		"utf8",
	)
}

let compiledStyles: HTMLStyleElement

beforeAll(() => {
	compiledStyles = document.createElement("style")
	compiledStyles.textContent = buttonStylesheet()
	document.head.append(compiledStyles)
})

afterAll(() => {
	compiledStyles.remove()
})

describe("consumer app", () => {
	it("switches the Theme and changes the rendered values", async () => {
		render(App)
		const button = screen.getByRole("button")

		expect(document.documentElement.getAttribute("data-theme")).toBe("light")
		expect(document.head.textContent).toContain("--ds-color-primary: #171717;")
		expect(button).toHaveClass("bg-primary")
		expect(getComputedStyle(button).backgroundColor).toBe("rgb(23, 23, 23)")

		await fireEvent.click(button)

		expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
		expect(document.head.textContent).toContain("--ds-color-primary: #e5e5e5;")
		expect(button).toHaveClass("bg-primary")
		expect(getComputedStyle(button).backgroundColor).toBe("rgb(229, 229, 229)")
	})

	it("uses the compiled stylesheet from the packed svelte package", () => {
		expect(buttonStylesheet()).toContain(".bg-primary{background-color:var(--ds-color-primary)}")
	})
})
