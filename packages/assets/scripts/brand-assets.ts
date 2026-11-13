/**
 * The published Brand Assets: which package subpath each file serves, and the
 * sizes the derived favicon rasters must have. Pure data, no filesystem access.
 */

/** An SVG that ships unchanged from the owner's brand source. */
export interface BrandAssetSvg {
	/** The package subpath a consumer imports, e.g. `./logo/mark.svg`. */
	readonly exportPath: string
	/** The file's name in `brand-source/svg`, where the owner supplied it. */
	readonly sourceName: string
}

/** A PNG rendered at build time from the favicon SVG. */
export interface FaviconPng {
	/** The package subpath a consumer imports, e.g. `./favicon/icon-192.png`. */
	readonly exportPath: string
	/** The square pixel size the raster is rendered at. */
	readonly sizePx: number
}

/** The favicon SVG; the rasters derive from the file this subpath serves. */
export const faviconSvgExportPath = "./favicon/favicon.svg"

/** The logo and favicon SVGs, in the order a consumer reads the package. */
export const brandAssetSvgs: readonly BrandAssetSvg[] = Object.freeze([
	Object.freeze({ exportPath: "./logo/mark.svg", sourceName: "mark.svg" }),
	Object.freeze({ exportPath: "./logo/wordmark.svg", sourceName: "wordmark.svg" }),
	Object.freeze({ exportPath: "./logo/mark-on-light.svg", sourceName: "mark-on-light.svg" }),
	Object.freeze({ exportPath: "./logo/mark-on-dark.svg", sourceName: "mark-on-dark.svg" }),
	Object.freeze({
		exportPath: "./logo/wordmark-on-light.svg",
		sourceName: "wordmark-on-light.svg",
	}),
	Object.freeze({ exportPath: "./logo/wordmark-on-dark.svg", sourceName: "wordmark-on-dark.svg" }),
	Object.freeze({ exportPath: faviconSvgExportPath, sourceName: "favicon.svg" }),
])

/** The Favicon Set's raster icons, one PNG per pixel size. */
export const faviconPngs: readonly FaviconPng[] = Object.freeze([
	Object.freeze({ exportPath: "./favicon/apple-touch-icon.png", sizePx: 180 }),
	Object.freeze({ exportPath: "./favicon/icon-192.png", sizePx: 192 }),
	Object.freeze({ exportPath: "./favicon/icon-512.png", sizePx: 512 }),
])

/** The ICO, packed at build time from one PNG per pixel size. */
export const faviconIco: { readonly exportPath: string; readonly sizesPx: readonly number[] } =
	Object.freeze({
		exportPath: "./favicon/favicon.ico",
		sizesPx: Object.freeze([16, 32, 48]),
	})

/** Every package subpath that serves a Brand Asset, except `./package.json`. */
export const brandAssetExportPaths: readonly string[] = Object.freeze([
	...brandAssetSvgs.map((asset) => asset.exportPath),
	faviconIco.exportPath,
	...faviconPngs.map((png) => png.exportPath),
])

/** The path inside the package's `dist` directory that an export subpath serves. */
export function distPath(exportPath: string): string {
	return exportPath.replace(/^\.\//, "")
}
