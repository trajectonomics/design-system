import { describe, expect, it } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { semanticTokenContract } from "@trajectonomics/design-system"
import { prebuiltThemeCss } from "./prebuilt-theme-css"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const STYLESHEET_PATH = join(PACKAGE_ROOT, "typography.css")
const MANIFEST_PATH = join(PACKAGE_ROOT, "package.json")

/** One rule of a stylesheet: the selectors that scope it and the declarations it sets. */
interface CssRule {
	readonly selectors: readonly string[]
	readonly declarations: readonly string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** The string entries of an unknown manifest field. */
function strings(value: unknown): readonly string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: []
}

/** The string-valued entries of an unknown manifest field. */
function stringMap(value: unknown): Readonly<Record<string, string>> {
	if (!isRecord(value)) throw new Error("manifest field is not a JSON object")
	return Object.fromEntries(
		Object.entries(value).filter(
			(entry): entry is [string, string] => typeof entry[1] === "string",
		),
	)
}

async function readStylesheet(): Promise<string> {
	return readFile(STYLESHEET_PATH, "utf8")
}

async function readManifest(): Promise<Record<string, unknown>> {
	const manifest: unknown = JSON.parse(await readFile(MANIFEST_PATH, "utf8"))
	if (!isRecord(manifest)) throw new Error("package.json is not a JSON object")
	return manifest
}

/** The rules of a stylesheet, in source order, with comments removed. */
function rules(css: string): readonly CssRule[] {
	const source = css.replaceAll(/\/\*[\s\S]*?\*\//g, "")
	return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
		selectors: (match[1] ?? "")
			.split(",")
			.map((selector) => selector.trim())
			.filter((selector) => selector.length > 0),
		declarations: (match[2] ?? "")
			.split(";")
			.map((declaration) => declaration.trim())
			.filter((declaration) => declaration.length > 0),
	}))
}

/** Every property a stylesheet declares, sorted and de-duplicated. */
function properties(css: string): readonly string[] {
	const names = rules(css).flatMap((rule) =>
		rule.declarations.map((declaration) => (declaration.split(":")[0] ?? "").trim()),
	)
	return [...new Set(names)].sort()
}

/** The first value a stylesheet gives a property, or `undefined` when no rule sets it. */
function firstDeclaredValue(css: string, property: string): string | undefined {
	for (const rule of rules(css)) {
		for (const declaration of rule.declarations) {
			const [name, ...rest] = declaration.split(":")
			if (name?.trim() === property) return rest.join(":").trim()
		}
	}
	return undefined
}

describe("System Typography Stylesheet", () => {
	it("publishes ./typography.css as a CSS export of the theme package", async () => {
		const manifest = await readManifest()
		const exportTargets = stringMap(manifest["exports"])

		expect(exportTargets["./typography.css"]).toBe("./typography.css")
		expect(strings(manifest["files"])).toContain("typography.css")
		expect(stringMap(manifest["scripts"])["lint:package"]).toContain("./typography.css")
	})

	it("names a system font stack that covers Thai without a font file", async () => {
		const stack = firstDeclaredValue(await readStylesheet(), "font-family")

		expect(stack).toBeDefined()
		expect(stack).toContain("ui-sans-serif")
		expect(stack).toContain("system-ui")
		expect(stack).toContain('"Leelawadee UI"')
		expect(stack).toContain("Thonburi")
		expect(stack).toContain('"Noto Sans Thai"')
		expect(stack?.endsWith("sans-serif")).toBe(true)
	})

	it("sets a line height that fits Thai vowels, taller for Thai text", async () => {
		const css = await readStylesheet()
		const thaiRules = rules(css).filter((rule) =>
			rule.selectors.some((selector) => selector.includes(":lang(th)")),
		)

		expect(firstDeclaredValue(css, "line-height")).toBe("1.7")
		expect(thaiRules.length).toBeGreaterThan(0)
		for (const rule of thaiRules) expect(rule.declarations).toContain("line-height: 1.8")
	})

	it("declares only the typography properties and keeps normal word breaking", async () => {
		const css = await readStylesheet()

		expect(firstDeclaredValue(css, "word-break")).toBe("normal")
		expect(properties(css)).toEqual(["font-family", "line-height", "word-break"])
	})

	it("scopes every rule to a themed element and to Thai language content", async () => {
		const css = await readStylesheet()

		expect(rules(css).flatMap((rule) => rule.selectors)).toEqual([
			"[data-theme]",
			"[data-theme]:lang(th)",
			"[data-theme] :lang(th)",
		])
	})

	it("loads no font file and imports nothing", async () => {
		const css = await readStylesheet()

		expect(css).not.toContain("@font-face")
		expect(css).not.toContain("@import")
		expect(css).not.toContain("url(")
		expect(css).not.toContain("data:")
	})

	it("declares no colour and no Semantic Token", async () => {
		const css = await readStylesheet()

		expect(css).not.toContain("--ds-")
		expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
		expect(css).not.toMatch(/\b(?:rgb|hsl|oklch|lab|lch|color-mix)\(/)
	})

	it("leaves the prebuilt Theme CSS colour-only", () => {
		for (const file of prebuiltThemeCss) expect(file.css).not.toContain("font-family")
	})

	it("leaves the Semantic Token Contract at version 1 with colour roles only", () => {
		expect(semanticTokenContract.version).toBe(1)
		for (const role of semanticTokenContract.roles) expect(role.type).toBe("color")
	})
})
