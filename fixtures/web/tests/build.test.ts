import { describe, expect, it } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

const DIST_ASSETS = join(import.meta.dir, "..", "dist", "assets")

/** The built files Vite emitted, by name. */
async function builtFiles(): Promise<readonly string[]> {
	return readdir(DIST_ASSETS)
}

/** The built stylesheets Vite emitted, joined into one document. */
async function builtCss(): Promise<string> {
	const files = (await readdir(DIST_ASSETS)).filter((name) => name.endsWith(".css"))
	if (files.length === 0)
		throw new Error(`No built CSS in ${DIST_ASSETS}; run \`bun run build\` first`)
	const sheets = await Promise.all(files.map((name) => readFile(join(DIST_ASSETS, name), "utf8")))
	return sheets.join("\n")
}

/** The declarations of one Theme's `[data-theme]` block in the built CSS. */
function themeBlock(css: string, themeName: string): string {
	const match = new RegExp(`\\[data-theme=["']?${themeName}["']?\\]\\{([^}]*)\\}`).exec(css)
	const declarations = match?.[1]
	if (declarations === undefined)
		throw new Error(`No [data-theme=${themeName}] block in the built CSS`)
	return declarations
}

/** The value a block gives a custom property. */
function variableValue(declarations: string, name: string): string | undefined {
	return new RegExp(`${name}:\\s*([^;]+);`).exec(declarations)?.[1]?.trim()
}

describe("framework-free consumer build", () => {
	it("contains the variables from the prebuilt Theme CSS, for both Themes", async () => {
		const css = await builtCss()
		const light = themeBlock(css, "light")
		const dark = themeBlock(css, "dark")
		const lightBackground = variableValue(light, "--ds-color-background")
		const darkBackground = variableValue(dark, "--ds-color-background")

		expect(lightBackground).toBeDefined()
		expect(darkBackground).toBeDefined()
		expect(lightBackground).not.toBe(darkBackground)
		expect(variableValue(light, "--ds-color-primary")).toBeDefined()
		expect(variableValue(dark, "--ds-color-primary")).toBeDefined()
	})

	it("resolves the Tailwind utilities against the Theme variables", async () => {
		const css = await builtCss()
		expect(css).toMatch(/\.bg-primary\s*\{[^}]*background-color:\s*var\(--ds-color-primary\)/)
		expect(css).toMatch(
			/\.text-primary-foreground\s*\{[^}]*color:\s*var\(--ds-color-primary-foreground\)/,
		)
		expect(css).toMatch(/\.border-border\s*\{[^}]*border-color:\s*var\(--ds-color-border\)/)
	})

	it("compiles the documented dark variant against data-theme", async () => {
		const css = await builtCss()
		expect(css).toMatch(/\.dark\\:bg-card[^{]*:where\(\[data-theme=["']?dark["']?\]/)
	})
})

describe("System Typography Stylesheet import", () => {
	it("gives themed text a system stack with Thai coverage, and loads no font file", async () => {
		const css = await builtCss()
		const themed = /\[data-theme\]\{([^}]*)\}/.exec(css)?.[1] ?? ""
		const thai =
			/\[data-theme\]:lang\(th\),\[data-theme\] :lang\(th\)\{([^}]*)\}/.exec(css)?.[1] ?? ""

		expect(themed).toContain("Leelawadee UI")
		expect(themed).toContain("Thonburi")
		expect(themed).toContain("Noto Sans Thai")
		expect(themed).toContain("line-height:1.7")
		expect(themed).toContain("word-break:normal")
		expect(thai).toBe("line-height:1.8")
		expect(css).not.toContain("@font-face")
	})
})

describe("Brand Asset import", () => {
	it("resolves a Brand Asset subpath to a file the build emits", async () => {
		const files = await builtFiles()
		const svg = files.find((name) => name.startsWith("mark-on-light-") && name.endsWith(".svg"))
		if (svg === undefined) throw new Error(`No emitted Brand Asset in ${DIST_ASSETS}`)
		const contents = await readFile(join(DIST_ASSETS, svg), "utf8")

		expect(contents).toContain('viewBox="0 0 1024 1024"')
		expect(contents).toContain('fill="#000"')

		const script = files.find((name) => name.endsWith(".js"))
		if (script === undefined) throw new Error(`No emitted script in ${DIST_ASSETS}`)
		expect(await readFile(join(DIST_ASSETS, script), "utf8")).toContain(svg)
	})
})
