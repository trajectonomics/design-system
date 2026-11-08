import { render, screen } from "@testing-library/svelte"
import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { describe, expect, it } from "vitest"
import ThemeProbe from "./theme-probe.svelte"

describe("useTheme in a component", () => {
	it("reads the active Theme reactively when the Theme changes", async () => {
		const { rerender } = render(ThemeProbe, { props: { theme: lightTheme } })
		expect(screen.getByTestId("active-theme").textContent).toBe("light")

		await rerender({ theme: darkTheme })
		expect(screen.getByTestId("active-theme").textContent).toBe("dark")
	})
})
