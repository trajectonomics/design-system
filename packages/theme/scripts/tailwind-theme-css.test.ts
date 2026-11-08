import { describe, expect, it } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { darkTheme, lightTheme, semanticTokenContract } from "@trajectonomics/design-system"
import { themeToCss } from "../src/index"
import { buildTailwindThemeCss, tailwindColorName } from "./tailwind-theme-css"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const SHIPPED_CSS_PATH = join(PACKAGE_ROOT, "tailwind.css")
const TAILWIND_BIN = join(PACKAGE_ROOT, "node_modules/.bin/tailwindcss")

async function readShippedCss(): Promise<string> {
	return readFile(SHIPPED_CSS_PATH, "utf8")
}

function contractMappings(): Map<string, string> {
	const mappings = new Map<string, string>()
	for (const role of semanticTokenContract.roles) {
		mappings.set(tailwindColorName(role.name), `--ds-${role.name.replaceAll(".", "-")}`)
	}
	return mappings
}

function cssDeclarations(css: string, selector: string): ReadonlyMap<string, string> {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const block = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ""
	const declarations = new Map<string, string>()
	for (const match of block.matchAll(/([\w-]+):\s*([^;]+);/g)) {
		const property = match[1]
		const value = match[2]
		if (property !== undefined && value !== undefined) declarations.set(property, value.trim())
	}
	return declarations
}

function resolveUtilityValue(css: string, themeName: string, utility: string, property: string) {
	const theme = cssDeclarations(css, `[data-theme="${themeName}"]`)
	const rule = cssDeclarations(css, `.${utility}`)
	const value = rule.get(property)
	if (value === undefined) throw new Error(`No ${property} for .${utility}`)
	return value.replace(/var\((--ds-[\w-]+)\)/g, (_match, variable: string) => {
		const resolved = theme.get(variable)
		if (resolved === undefined) throw new Error(`No ${variable} in ${themeName}`)
		return resolved
	})
}

async function compileFixture(stylesheet: string): Promise<string> {
	const fixture = await mkdtemp(join(PACKAGE_ROOT, "tw-fixture-"))
	try {
		const input = join(fixture, "input.css")
		const html = join(fixture, "index.html")
		const output = join(fixture, "output.css")
		await writeFile(
			input,
			`@import "tailwindcss" source(none);\n${stylesheet}\n@source "./index.html";\n`,
		)
		await writeFile(
			html,
			[
				'<div class="bg-primary text-primary-foreground border-border ring-ring"></div>',
				'<div class="focus:ring-ring bg-background text-foreground"></div>',
			].join("\n"),
		)
		const process = Bun.spawn({
			cmd: [TAILWIND_BIN, "-i", input, "-o", output],
			cwd: PACKAGE_ROOT,
			stdout: "pipe",
			stderr: "pipe",
		})
		const [stderr, exitCode] = await Promise.all([
			new Response(process.stderr).text(),
			process.exited,
		])
		if (exitCode !== 0) throw new Error(`Tailwind failed: ${stderr}`)
		for (let attempt = 0; attempt < 20; attempt += 1) {
			try {
				return await readFile(output, "utf8")
			} catch {
				await Bun.sleep(10)
			}
		}
		throw new Error(`Tailwind produced no output: ${output}`)
	} finally {
		await rm(fixture, { recursive: true, force: true })
	}
}

describe("Tailwind theme stylesheet", () => {
	it("maps every Contract role to a Tailwind colour that reads its --ds- variable", async () => {
		const css = await readShippedCss()
		const mappings = new Map<string, string>()
		for (const match of css.matchAll(/--color-([\w-]+):\s*var\((--ds-[\w-]+)\);/g)) {
			const name = match[1]
			const variable = match[2]
			if (name === undefined || variable === undefined) throw new Error("Malformed mapping")
			mappings.set(name, variable)
		}
		expect(mappings).toEqual(contractMappings())
	})

	it("is the stylesheet generated from the Contract, with no drift", async () => {
		expect(await readShippedCss()).toBe(buildTailwindThemeCss())
	})

	it("compiles a fixture whose utilities read the --ds- variables", async () => {
		const output = await compileFixture(await readShippedCss())
		expect(output).toContain(".bg-primary {")
		expect(output).toContain("background-color: var(--ds-color-primary);")
		expect(output).toContain(".text-primary-foreground {")
		expect(output).toContain("color: var(--ds-color-primary-foreground);")
		expect(output).toContain(".border-border {")
		expect(output).toContain("border-color: var(--ds-color-border);")
		expect(output).toContain(".ring-ring {")
		expect(output).toContain("--tw-ring-color: var(--ds-color-ring);")
	})

	it("restyles a compiled Tailwind utility when data-theme switches, with no rebuild", async () => {
		const css = [
			await compileFixture(await readShippedCss()),
			themeToCss(lightTheme),
			themeToCss(darkTheme),
		].join("\n")

		const light = resolveUtilityValue(css, "light", "bg-primary", "background-color")
		const dark = resolveUtilityValue(css, "dark", "bg-primary", "background-color")

		expect(light).toBe("#171717")
		expect(dark).toBe("#e5e5e5")
		expect(light).not.toBe(dark)
	})
})
