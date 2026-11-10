import { describe, expect, it } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { prebuiltThemeCss } from "./prebuilt-theme-css"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const TAILWIND_CSS_PATH = join(PACKAGE_ROOT, "tailwind.css")
const MANIFEST_PATH = join(PACKAGE_ROOT, "package.json")

/** The `--ds-` custom properties a stylesheet declares, sorted. */
function dsVariableNames(css: string): readonly string[] {
	const names = [...css.matchAll(/--ds-[\w-]+(?=\s*:)/g)].map((match) => match[0])
	return [...new Set(names)].sort()
}

/** The selectors a stylesheet uses to scope its declarations, in source order. */
function selectors(css: string): readonly string[] {
	return [...css.matchAll(/[^{}]+(?=\{)/g)]
		.map((match) => match[0].trim())
		.filter((selector) => selector.length > 0)
}

/** The Tailwind utility colour names a stylesheet maps, sorted. */
function tailwindColorNames(css: string): readonly string[] {
	return [...css.matchAll(/--color-([\w-]+):/g)].map((match) => match[1] ?? "").sort()
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** The subpath keys of a package manifest's `exports` map, sorted. */
function exportSubpaths(manifest: unknown): readonly string[] {
	if (!isRecord(manifest)) throw new Error("package.json is not a JSON object")
	const exportsField = manifest["exports"]
	if (!isRecord(exportsField)) throw new Error("package.json has no exports map")
	return Object.keys(exportsField).sort()
}

describe("Web Consumer Contract", () => {
	it("pins the --ds- variable names exposed by the prebuilt Theme CSS", () => {
		const names = prebuiltThemeCss.flatMap((file) => dsVariableNames(file.css))
		expect([...new Set(names)].sort()).toEqual([
			"--ds-color-accent",
			"--ds-color-accent-foreground",
			"--ds-color-background",
			"--ds-color-border",
			"--ds-color-card",
			"--ds-color-card-foreground",
			"--ds-color-destructive",
			"--ds-color-destructive-foreground",
			"--ds-color-foreground",
			"--ds-color-input",
			"--ds-color-muted",
			"--ds-color-muted-foreground",
			"--ds-color-popover",
			"--ds-color-popover-foreground",
			"--ds-color-primary",
			"--ds-color-primary-foreground",
			"--ds-color-ring",
			"--ds-color-secondary",
			"--ds-color-secondary-foreground",
		])
	})

	it("pins the data-theme selector form and declares no default Theme", () => {
		for (const file of prebuiltThemeCss) {
			const themeName = file.fileName.replace(/\.css$/, "")
			expect(selectors(file.css)).toEqual([`[data-theme="${themeName}"]`])
		}
	})

	it("pins the Tailwind colour names", async () => {
		const css = await readFile(TAILWIND_CSS_PATH, "utf8")
		expect(tailwindColorNames(css)).toEqual([
			"accent",
			"accent-foreground",
			"background",
			"border",
			"card",
			"card-foreground",
			"destructive",
			"destructive-foreground",
			"foreground",
			"input",
			"muted",
			"muted-foreground",
			"popover",
			"popover-foreground",
			"primary",
			"primary-foreground",
			"ring",
			"secondary",
			"secondary-foreground",
		])
	})

	it("pins the package export subpaths", async () => {
		const manifest: unknown = JSON.parse(await readFile(MANIFEST_PATH, "utf8"))
		expect(exportSubpaths(manifest)).toEqual([
			".",
			"./package.json",
			"./tailwind.css",
			"./themes/dark.css",
			"./themes/light.css",
		])
	})
})
