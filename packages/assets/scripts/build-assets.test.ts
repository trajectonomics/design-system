import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
	brandAssetExportPaths,
	brandAssetSvgs,
	distPath,
	faviconIco,
	faviconPngs,
	faviconSvgExportPath,
} from "./brand-assets"
import {
	brandFontSubsets,
	brandStylesheets,
	brandTypefaceExportPaths,
	brandTypefaceStylesheet,
	brandTypefaceStylesheetExportPath,
	brandTypefaceSubsets,
} from "./brand-typeface"
import { buildAssets } from "./build-assets"
import { pngSize, readIcoSizes } from "./raster"
import { rasteriseSvgToRgba } from "./rasterise"
import { inspectSvg } from "./svg-safety"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const BRAND_SOURCE_SVG = join(PACKAGE_ROOT, "..", "..", "brand-source", "svg")
const FONTS_DIRECTORY = join(PACKAGE_ROOT, "fonts")

let outputDirectory: string

beforeAll(async () => {
	outputDirectory = await mkdtemp(join(tmpdir(), "ds-assets-build-"))
	await buildAssets({
		sourceDirectory: BRAND_SOURCE_SVG,
		fontsDirectory: FONTS_DIRECTORY,
		outputDirectory,
	})
})

afterAll(async () => {
	await rm(outputDirectory, { recursive: true, force: true })
})

async function builtExport(exportPath: string): Promise<Uint8Array> {
	return new Uint8Array(await Bun.file(join(outputDirectory, distPath(exportPath))).arrayBuffer())
}

/** The channels of one pixel in a rendered square RGBA image, from its top-left origin. */
function pixelAt(pixels: Uint8Array, sizePx: number, x: number, y: number): readonly number[] {
	const start = (y * sizePx + x) * 4
	return Array.from(pixels.slice(start, start + 4))
}

/** Whether a pixel is the colour an SVG asks for, allowing for an anti-aliased edge. */
function isColour(pixel: readonly number[], rgb: readonly number[], tolerance = 3): boolean {
	return rgb.every((channel, index) => Math.abs((pixel[index] ?? -1) - channel) <= tolerance)
}

/** The light-scheme tile and mark the favicon SVG writes as literal hexes. */
const LIGHT_TILE_RGB: readonly [number, number, number] = [0x17, 0x17, 0x17]
const LIGHT_MARK_RGB: readonly [number, number, number] = [0xfa, 0xfa, 0xfa]

describe("Brand Asset build", () => {
	it("writes every exported file into the output directory, so every export resolves", async () => {
		const missing: string[] = []
		for (const exportPath of [...brandAssetExportPaths, ...brandTypefaceExportPaths]) {
			if (!(await Bun.file(join(outputDirectory, distPath(exportPath))).exists())) {
				missing.push(exportPath)
			}
		}

		expect(missing).toEqual([])
	})

	it("ships every SVG as the source the owner supplied, without a finding", async () => {
		for (const asset of brandAssetSvgs) {
			const source = await readFile(join(BRAND_SOURCE_SVG, asset.sourceName), "utf8")
			const built = new TextDecoder().decode(await builtExport(asset.exportPath))

			expect(inspectSvg(built)).toEqual([])
			expect(built).toBe(source)
		}
	})

	it("renders each PNG at its declared square size", async () => {
		for (const png of faviconPngs) {
			expect({
				exportPath: png.exportPath,
				size: pngSize(await builtExport(png.exportPath)),
			}).toEqual({
				exportPath: png.exportPath,
				size: { widthPx: png.sizePx, heightPx: png.sizePx },
			})
		}
	})

	it("packs the ICO from PNGs of each declared size", async () => {
		const bytes = await builtExport(faviconIco.exportPath)

		expect(readIcoSizes(bytes)).toEqual([...faviconIco.sizesPx])
	})

	it("keeps the smallest favicon a tile whose mark reaches the centre, with transparent fillets", async () => {
		const sizePx = Math.min(...faviconIco.sizesPx)
		const svg = new TextDecoder().decode(await builtExport(faviconSvgExportPath))
		const pixels = await rasteriseSvgToRgba(svg, sizePx)
		const middle = Math.floor(sizePx / 2)
		const edge = pixelAt(pixels, sizePx, middle, 0)
		const centre = [
			pixelAt(pixels, sizePx, middle - 1, middle - 1),
			pixelAt(pixels, sizePx, middle, middle - 1),
			pixelAt(pixels, sizePx, middle - 1, middle),
			pixelAt(pixels, sizePx, middle, middle),
		]
		const corners = [
			pixelAt(pixels, sizePx, 0, 0),
			pixelAt(pixels, sizePx, sizePx - 1, 0),
			pixelAt(pixels, sizePx, 0, sizePx - 1),
			pixelAt(pixels, sizePx, sizePx - 1, sizePx - 1),
		]

		// The middle of the top edge is inside the tile, so it is the tile colour at full opacity.
		expect({ edge }).toEqual({ edge: [...LIGHT_TILE_RGB, 255] })
		// The mark's stem is copied from the owner's art unchanged, so it sits just left
		// of the geometric centre: the mark reaches the middle of the favicon rather than
		// owning all four central pixels.
		expect(centre.filter((pixel) => isColour(pixel, LIGHT_MARK_RGB)).length).toBeGreaterThanOrEqual(
			2,
		)
		// The fillet leaves each corner outside the tile's rounded rectangle, so no
		// corner may be opaque: an opaque square here is the bug this test exists for.
		for (const corner of corners) {
			expect(corner[3] ?? 255).toBeLessThan(128)
		}
	})

	it("refuses to ship an SVG that carries active content", async () => {
		const source = await mkdtemp(join(tmpdir(), "ds-assets-source-"))
		const rejectedOutput = await mkdtemp(join(tmpdir(), "ds-assets-rejected-"))
		try {
			await cp(BRAND_SOURCE_SVG, source, { recursive: true })
			await writeFile(
				join(source, "favicon.svg"),
				'<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>',
			)

			await expect(
				buildAssets({
					sourceDirectory: source,
					fontsDirectory: FONTS_DIRECTORY,
					outputDirectory: rejectedOutput,
				}),
			).rejects.toThrow(/script/)
		} finally {
			await rm(source, { recursive: true, force: true })
			await rm(rejectedOutput, { recursive: true, force: true })
		}
	})
})

describe("Brand Typeface build", () => {
	it("ships every woff2 subset byte-identical to the vendored source", async () => {
		for (const subset of [...brandTypefaceSubsets, ...brandFontSubsets]) {
			const source = await readFile(join(FONTS_DIRECTORY, subset.sourceName))

			expect(await builtExport(subset.exportPath)).toEqual(new Uint8Array(source))
		}
	})

	it("ships every checked-in stylesheet byte-identical to the vendored source", async () => {
		for (const stylesheet of brandStylesheets) {
			const source = await readFile(join(FONTS_DIRECTORY, stylesheet.sourceName), "utf8")

			expect(new TextDecoder().decode(await builtExport(stylesheet.exportPath))).toBe(source)
		}
	})

	it("writes the @font-face stylesheet generated from the Brand Typeface data", async () => {
		const css = new TextDecoder().decode(await builtExport(brandTypefaceStylesheetExportPath))

		expect(css).toBe(brandTypefaceStylesheet())
	})

	it("gives the stylesheet one complete unicode-range per subset and swap display", async () => {
		const css = new TextDecoder().decode(await builtExport(brandTypefaceStylesheetExportPath))
		const ranges = [...css.matchAll(/unicode-range: ([^;]+);/g)].map((match) => match[1] ?? "")

		expect(ranges).toEqual(brandTypefaceSubsets.map((subset) => subset.unicodeRange))
		expect(css).toContain("font-display: swap;")
		expect(css).toContain("font-weight: 100 900;")
		for (const subset of brandTypefaceSubsets) {
			expect(css).toContain(`url("./${subset.sourceName}")`)
		}
	})
})
