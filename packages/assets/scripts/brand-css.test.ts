import { describe, expect, it } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const BRAND_CSS_PATH = join(PACKAGE_ROOT, "fonts", "brand.css")
const THEME_TYPOGRAPHY_CSS_PATH = join(PACKAGE_ROOT, "..", "theme", "typography.css")

const LATIN_UNICODE_RANGE =
	"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
const LATIN_EXT_UNICODE_RANGE =
	"U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"

/** One @font-face block of a stylesheet: its declarations, in source order. */
interface FontFace {
	readonly declarations: readonly string[]
}

/** The @font-face blocks of a stylesheet, in source order, with comments removed. */
function fontFaces(css: string): readonly FontFace[] {
	const source = css.replaceAll(/\/\*[\s\S]*?\*\//g, "")
	return [...source.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => ({
		declarations: (match[1] ?? "")
			.split(";")
			.map((declaration) => declaration.trim())
			.filter((declaration) => declaration.length > 0),
	}))
}

/** The value one declaration gives a property, or `undefined` when no declaration sets it. */
function declared(face: FontFace, property: string): string | undefined {
	for (const declaration of face.declarations) {
		const [name, ...rest] = declaration.split(":")
		if (name?.trim() === property) return rest.join(":").trim()
	}
	return undefined
}

/** A percentage declaration as a fraction, e.g. `108.3%` as `1.083`. */
function fraction(value: string | undefined): number {
	if (value === undefined || !value.endsWith("%")) throw new Error(`not a percentage: ${value}`)
	return Number.parseFloat(value.slice(0, -1)) / 100
}

/** The faces brand.css must declare, in order: five web faces, then three fallbacks. */
const expectedFaces = [
	{
		family: "Inter Variable",
		weight: "100 900",
		src: 'url("./inter-latin-wght.woff2") format("woff2-variations")',
		unicodeRange: LATIN_UNICODE_RANGE,
	},
	{
		family: "Inter Variable",
		weight: "100 900",
		src: 'url("./inter-latin-ext-wght.woff2") format("woff2-variations")',
		unicodeRange: LATIN_EXT_UNICODE_RANGE,
	},
	{
		family: "Aleo",
		weight: "300",
		src: 'url("./aleo-latin-300.woff2") format("woff2")',
		unicodeRange: LATIN_UNICODE_RANGE,
	},
	{
		family: "Aleo",
		weight: "400",
		src: 'url("./aleo-latin-400.woff2") format("woff2")',
		unicodeRange: LATIN_UNICODE_RANGE,
	},
	{
		family: "Azeret Mono",
		weight: "500",
		src: 'url("./azeret-mono-latin-500.woff2") format("woff2")',
		unicodeRange: LATIN_UNICODE_RANGE,
	},
] as const

/** The metric-matched fallback faces, with the local font each one stands in for. */
const expectedFallbacks = [
	{
		family: "Inter Fallback",
		webFamily: "Inter Variable",
		src: 'local("Arial")',
		sizeAdjust: "108.3%",
		ascent: "89.45%",
		descent: "22.27%",
		lineGap: "0%",
	},
	{
		family: "Aleo Fallback",
		webFamily: "Aleo",
		src: 'local("Times New Roman")',
		sizeAdjust: "108.36%",
		ascent: "83.52%",
		descent: "27.22%",
		lineGap: "0%",
	},
	{
		family: "Azeret Mono Fallback",
		webFamily: "Azeret Mono",
		src: 'local("Courier New")',
		sizeAdjust: "103.02%",
		ascent: "90.96%",
		descent: "22.33%",
		lineGap: "0%",
	},
] as const

/** Each brand family's hhea metrics, so the fallback overrides can be checked against them. */
const familyMetrics = {
	"Inter Variable": { unitsPerEm: 2048, ascent: 1984, descent: 494 },
	Aleo: { unitsPerEm: 1000, ascent: 905, descent: 295 },
	"Azeret Mono": { unitsPerEm: 1000, ascent: 937, descent: 230 },
} as const

describe("brand.css", () => {
	it("declares exactly the expected faces: the five web faces, then the three fallbacks", async () => {
		const faces = fontFaces(await readFile(BRAND_CSS_PATH, "utf8"))

		expect(faces).toHaveLength(expectedFaces.length + expectedFallbacks.length)
		const webFaces = faces.slice(0, expectedFaces.length)
		for (const [index, expected] of expectedFaces.entries()) {
			const face = webFaces[index]
			if (face === undefined) throw new Error(`missing web face ${index}`)
			expect(declared(face, "font-family")).toBe(`"${expected.family}"`)
			expect(declared(face, "font-weight")).toBe(expected.weight)
			expect(declared(face, "src")).toBe(expected.src)
			expect(declared(face, "unicode-range")).toBe(expected.unicodeRange)
		}
		const fallbackFaces = faces.slice(expectedFaces.length)
		for (const [index, expected] of expectedFallbacks.entries()) {
			const face = fallbackFaces[index]
			if (face === undefined) throw new Error(`missing fallback face ${index}`)
			expect(declared(face, "font-family")).toBe(`"${expected.family}"`)
			expect(declared(face, "src")).toBe(expected.src)
			expect(declared(face, "size-adjust")).toBe(expected.sizeAdjust)
			expect(declared(face, "ascent-override")).toBe(expected.ascent)
			expect(declared(face, "descent-override")).toBe(expected.descent)
			expect(declared(face, "line-gap-override")).toBe(expected.lineGap)
		}
	})

	it("gives every web face font-display swap, a latin unicode-range and a woff2 source", async () => {
		const faces = fontFaces(await readFile(BRAND_CSS_PATH, "utf8")).slice(0, expectedFaces.length)

		for (const face of faces) {
			expect(declared(face, "font-style")).toBe("normal")
			expect(declared(face, "font-display")).toBe("swap")
			const range = declared(face, "unicode-range")
			expect(range === LATIN_UNICODE_RANGE || range === LATIN_EXT_UNICODE_RANGE).toBe(true)
			expect(declared(face, "src")).toMatch(
				/^url\("\.\/[^"]+\.woff2"\) format\("woff2(-variations)?"\)$/,
			)
		}
	})

	it("references exactly the woff2 files the package ships", async () => {
		const css = await readFile(BRAND_CSS_PATH, "utf8")
		const referenced = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((match) => match[1] ?? "")

		expect([...referenced].sort()).toEqual(
			[
				"inter-latin-wght.woff2",
				"inter-latin-ext-wght.woff2",
				"aleo-latin-300.woff2",
				"aleo-latin-400.woff2",
				"azeret-mono-latin-500.woff2",
			].sort(),
		)
	})

	it("declares @font-face only, so it sets no property on any element", async () => {
		const css = await readFile(BRAND_CSS_PATH, "utf8")
		const withoutFaces = css
			.replace(/@font-face\s*\{[^}]*\}/g, "")
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.trim()

		expect(withoutFaces).toBe("")
	})

	it("matches each fallback's line box to its brand family, so the first paint does not shift", async () => {
		const faces = fontFaces(await readFile(BRAND_CSS_PATH, "utf8"))
		const fallbackFaces = faces.slice(expectedFaces.length)
		const webFamilies = [...new Set(expectedFaces.map((face) => face.family))]

		for (const [index, expected] of expectedFallbacks.entries()) {
			const face = fallbackFaces[index]
			if (face === undefined) throw new Error(`missing fallback face ${index}`)
			const family = expected.webFamily
			const metrics = familyMetrics[family as keyof typeof familyMetrics]
			if (metrics === undefined) throw new Error(`no metrics pinned for ${family}`)
			const sizeAdjust = fraction(declared(face, "size-adjust"))

			// ascent-override and descent-override apply after size-adjust, so their
			// product must reproduce the web font's own ascent and descent.
			expect(fraction(declared(face, "ascent-override")) * sizeAdjust).toBeCloseTo(
				metrics.ascent / metrics.unitsPerEm,
				3,
			)
			expect(fraction(declared(face, "descent-override")) * sizeAdjust).toBeCloseTo(
				metrics.descent / metrics.unitsPerEm,
				3,
			)
			expect(fraction(declared(face, "line-gap-override")) * sizeAdjust).toBeCloseTo(0, 3)
			expect(webFamilies).toContain(family)
		}
	})
})

describe("the theme package's typography.css", () => {
	it("still declares no font file and no @font-face, so it stays the zero-payload default", async () => {
		const css = await readFile(THEME_TYPOGRAPHY_CSS_PATH, "utf8")

		expect(css).not.toContain("@font-face")
		expect(css).not.toContain("@import")
		expect(css).not.toContain("url(")
		expect(css).not.toContain("data:")
	})
})
