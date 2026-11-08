import { describe, expect, it } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { darkTheme, lightTheme } from "@trajectonomics/design-system"
import { themeToCss } from "../src/index"
import { prebuiltThemeCss } from "./prebuilt-theme-css"
import { writePrebuiltThemeCss } from "./write-theme-css"

describe("prebuilt Theme CSS", () => {
	it("ships light and dark files for the built-in Themes", () => {
		expect(prebuiltThemeCss.map((file) => file.fileName)).toEqual(["light.css", "dark.css"])
		const lightCss = prebuiltThemeCss[0]?.css ?? ""
		const darkCss = prebuiltThemeCss[1]?.css ?? ""
		expect(lightCss).toContain('[data-theme="light"] {')
		expect(lightCss).toContain("--ds-color-background: #ffffff;")
		expect(lightCss).toContain("--ds-color-primary: #171717;")
		expect(darkCss).toContain('[data-theme="dark"] {')
		expect(darkCss).toContain("--ds-color-background: #0a0a0a;")
		expect(darkCss).toContain("--ds-color-primary: #e5e5e5;")
	})

	it("writes the files that match the public emitter output", async () => {
		const directory = await mkdtemp(join(tmpdir(), "ds-theme-css-"))
		try {
			await writePrebuiltThemeCss(directory)
			for (const theme of [lightTheme, darkTheme]) {
				const css = await readFile(join(directory, `${theme.name}.css`), "utf8")
				expect(css).toBe(themeToCss(theme))
			}
		} finally {
			await rm(directory, { recursive: true, force: true })
		}
	})
})
