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

/** Every custom property a stylesheet declares, sorted, so a new namespace cannot slip in. */
function declaredVariables(css: string): readonly string[] {
	const names = [...css.matchAll(/--[\w-]+(?=\s*:)/g)].map((match) => match[0])
	return [...new Set(names)].sort()
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
			"--ds-color-stage",
			"--ds-color-stage-foreground",
			"--ds-font-family-mono",
			"--ds-font-family-sans",
			"--ds-font-size-2xl",
			"--ds-font-size-3xl",
			"--ds-font-size-base",
			"--ds-font-size-lg",
			"--ds-font-size-sm",
			"--ds-font-size-xl",
			"--ds-font-size-xs",
			"--ds-radius-lg",
			"--ds-radius-md",
			"--ds-radius-sm",
			"--ds-radius-xl",
			"--ds-space-1",
			"--ds-space-10",
			"--ds-space-12",
			"--ds-space-16",
			"--ds-space-2",
			"--ds-space-3",
			"--ds-space-4",
			"--ds-space-5",
			"--ds-space-6",
			"--ds-space-7",
			"--ds-space-8",
			"--ds-space-9",
		])
	})

	it("pins the data-theme selector form and declares no default Theme", () => {
		for (const file of prebuiltThemeCss) {
			const themeName = file.fileName.replace(/\.css$/, "")
			expect(selectors(file.css)).toEqual([`[data-theme="${themeName}"]`])
		}
	})

	it("pins the Tailwind theme variable names across every role namespace", async () => {
		const css = await readFile(TAILWIND_CSS_PATH, "utf8")
		expect(declaredVariables(css)).toEqual([
			"--color-accent",
			"--color-accent-foreground",
			"--color-background",
			"--color-border",
			"--color-card",
			"--color-card-foreground",
			"--color-destructive",
			"--color-destructive-foreground",
			"--color-foreground",
			"--color-input",
			"--color-muted",
			"--color-muted-foreground",
			"--color-popover",
			"--color-popover-foreground",
			"--color-primary",
			"--color-primary-foreground",
			"--color-ring",
			"--color-secondary",
			"--color-secondary-foreground",
			"--color-stage",
			"--color-stage-foreground",
			"--font-mono",
			"--font-sans",
			"--radius-lg",
			"--radius-md",
			"--radius-sm",
			"--radius-xl",
			"--spacing-1",
			"--spacing-10",
			"--spacing-12",
			"--spacing-16",
			"--spacing-2",
			"--spacing-3",
			"--spacing-4",
			"--spacing-5",
			"--spacing-6",
			"--spacing-7",
			"--spacing-8",
			"--spacing-9",
			"--text-2xl",
			"--text-3xl",
			"--text-base",
			"--text-lg",
			"--text-sm",
			"--text-xl",
			"--text-xs",
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
			"./typography.css",
		])
	})
})
