import { describe, expect, it } from "bun:test"
import {
	brandTypefaceExportPaths,
	brandTypefaceFontFamily,
	brandTypefaceStylesheet,
	brandTypefaceStylesheetExportPath,
	brandTypefaceSubsets,
} from "./brand-typeface"

describe("Brand Typeface data", () => {
	it("ships the stylesheet and the latin and latin-ext woff2 subsets as package exports", () => {
		expect([...brandTypefaceExportPaths].sort()).toEqual(
			[
				"./fonts/inter.css",
				"./fonts/inter-latin-ext-wght.woff2",
				"./fonts/inter-latin-wght.woff2",
			].sort(),
		)
		expect(brandTypefaceStylesheetExportPath).toBe("./fonts/inter.css")
	})

	it("declares every subset once, with its own export path and source file", () => {
		expect(new Set(brandTypefaceSubsets.map((subset) => subset.exportPath)).size).toBe(
			brandTypefaceSubsets.length,
		)
		for (const subset of brandTypefaceSubsets) {
			expect(subset.exportPath).toBe(`./fonts/${subset.sourceName}`)
		}
	})

	it("pins each subset's unicode-range verbatim from the source package's stylesheet", () => {
		expect(brandTypefaceSubsets.map((subset) => subset.unicodeRange)).toEqual([
			"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
			"U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
		])
	})
})

describe("Brand Typeface stylesheet", () => {
	it("declares one @font-face per subset under the Inter Variable family", () => {
		const css = brandTypefaceStylesheet()
		const faces = css.match(/@font-face \{/g) ?? []

		expect(faces).toHaveLength(brandTypefaceSubsets.length)
		for (const subset of brandTypefaceSubsets) {
			expect(css).toContain(`font-family: "${brandTypefaceFontFamily}";`)
			expect(css).toContain(`src: url("./${subset.sourceName}") format("woff2-variations");`)
			expect(css).toContain(`unicode-range: ${subset.unicodeRange};`)
		}
	})

	it("gives every face font-display swap and the full variable weight range", () => {
		const css = brandTypefaceStylesheet()
		const faces = css.split("@font-face {").slice(1)

		for (const face of faces) {
			expect(face).toContain("font-style: normal;")
			expect(face).toContain("font-display: swap;")
			expect(face).toContain("font-weight: 100 900;")
		}
	})

	it("declares @font-face only, so it sets no property on any element", () => {
		const css = brandTypefaceStylesheet()
		const withoutFaces = css.replace(/@font-face \{[^}]*\}/g, "").trim()

		expect(withoutFaces).toBe("")
	})

	it("references exactly the woff2 files the package ships", () => {
		const css = brandTypefaceStylesheet()
		const referenced = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((match) => match[1] ?? "")

		expect([...referenced].sort()).toEqual(
			brandTypefaceSubsets.map((subset) => subset.sourceName).sort(),
		)
	})
})
