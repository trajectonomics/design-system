/**
 * The published Brand Typeface: the Inter woff2 subsets the assets package
 * ships, and the `@font-face` stylesheet generated from them. Pure data, no
 * filesystem access.
 */

/** One woff2 subset of the Brand Typeface. */
export interface BrandTypefaceSubset {
	/** The package subpath a consumer imports, e.g. `./fonts/inter-latin-wght.woff2`. */
	readonly exportPath: string
	/** The file's name in the package's `fonts` directory, where it is vendored. */
	readonly sourceName: string
	/** The subset's `unicode-range`, verbatim from the source package's stylesheet. */
	readonly unicodeRange: string
}

/** The `font-family` name the Brand Typeface's stylesheet declares. */
export const brandTypefaceFontFamily = "Inter Variable"

/** The package subpath of the generated `@font-face` stylesheet. */
export const brandTypefaceStylesheetExportPath = "./fonts/inter.css"

/** The Inter woff2 subsets the Brand Typeface ships, latin first. */
export const brandTypefaceSubsets: readonly BrandTypefaceSubset[] = Object.freeze([
	Object.freeze({
		exportPath: "./fonts/inter-latin-wght.woff2",
		sourceName: "inter-latin-wght.woff2",
		unicodeRange:
			"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
	}),
	Object.freeze({
		exportPath: "./fonts/inter-latin-ext-wght.woff2",
		sourceName: "inter-latin-ext-wght.woff2",
		unicodeRange:
			"U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
	}),
])

/** Every package subpath that serves the Brand Typeface, except `./package.json`. */
export const brandTypefaceExportPaths: readonly string[] = Object.freeze([
	brandTypefaceStylesheetExportPath,
	...brandTypefaceSubsets.map((subset) => subset.exportPath),
])

/** The `@font-face` stylesheet the build writes to `dist/fonts/inter.css`. */
export function brandTypefaceStylesheet(): string {
	const faces = brandTypefaceSubsets.map(
		(subset) => `@font-face {
  font-family: "${brandTypefaceFontFamily}";
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url("./${subset.sourceName}") format("woff2-variations");
  unicode-range: ${subset.unicodeRange};
}`,
	)
	return `${faces.join("\n\n")}\n`
}
