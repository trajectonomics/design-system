/**
 * Writes the packages/assets `dist` directory: the owner's SVG sources, the
 * favicon rasters derived from the favicon SVG, and the Brand Typeface's woff2
 * files with their generated `@font-face` stylesheet. Run with `bun run build`.
 */
import { mkdir, readFile, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
	brandAssetSvgs,
	distPath,
	faviconIco,
	faviconPngs,
	faviconSvgExportPath,
} from "./brand-assets"
import {
	brandFontSubsets,
	brandStylesheets,
	brandTypefaceStylesheet,
	brandTypefaceStylesheetExportPath,
	brandTypefaceSubsets,
} from "./brand-typeface"
import { packIco } from "./raster"
import { rasteriseSvgToPng } from "./rasterise"
import { inspectSvg } from "./svg-safety"

/** Where the brand sources and the package's build output live. */
export interface BuildAssetsOptions {
	/** The directory that holds the owner's SVG sources. */
	readonly sourceDirectory: string
	/** The directory that holds the vendored Brand Typeface woff2 files. */
	readonly fontsDirectory: string
	/** The directory to write; it is replaced, so a stale file cannot ship. */
	readonly outputDirectory: string
}

async function writeAsset(
	outputDirectory: string,
	exportPath: string,
	contents: string | Uint8Array,
): Promise<void> {
	const path = join(outputDirectory, distPath(exportPath))
	await mkdir(dirname(path), { recursive: true })
	await Bun.write(path, contents)
}

/** Writes every Brand Asset and the Brand Typeface, failing on an SVG the safety rules reject. */
export async function buildAssets({
	sourceDirectory,
	fontsDirectory,
	outputDirectory,
}: BuildAssetsOptions): Promise<void> {
	await rm(outputDirectory, { recursive: true, force: true })

	for (const asset of brandAssetSvgs) {
		const svg = await readFile(join(sourceDirectory, asset.sourceName), "utf8")
		const findings = inspectSvg(svg)
		if (findings.length > 0) {
			const rules = findings.map((finding) => finding.rule).join(", ")
			throw new Error(`${asset.sourceName} cannot ship as a Brand Asset: ${rules}`)
		}
		await writeAsset(outputDirectory, asset.exportPath, svg)
	}

	// The rasters derive from the SVG as it ships, so a consumer's PNG fallback
	// and its SVG favicon can never disagree.
	const faviconSvg = await readFile(join(outputDirectory, distPath(faviconSvgExportPath)), "utf8")
	for (const png of faviconPngs) {
		await writeAsset(
			outputDirectory,
			png.exportPath,
			await rasteriseSvgToPng(faviconSvg, png.sizePx),
		)
	}

	const icoImages = []
	for (const sizePx of faviconIco.sizesPx) {
		icoImages.push({ sizePx, png: await rasteriseSvgToPng(faviconSvg, sizePx) })
	}
	await writeAsset(outputDirectory, faviconIco.exportPath, packIco(icoImages))

	// The Brand Typeface ships as the vendored woff2 bytes plus the stylesheet
	// generated from the same data, so the CSS can never drift from the files.
	for (const subset of [...brandTypefaceSubsets, ...brandFontSubsets]) {
		await writeAsset(
			outputDirectory,
			subset.exportPath,
			await readFile(join(fontsDirectory, subset.sourceName)),
		)
	}
	for (const stylesheet of brandStylesheets) {
		await writeAsset(
			outputDirectory,
			stylesheet.exportPath,
			await readFile(join(fontsDirectory, stylesheet.sourceName), "utf8"),
		)
	}
	await writeAsset(outputDirectory, brandTypefaceStylesheetExportPath, brandTypefaceStylesheet())
}

if (import.meta.main) {
	await buildAssets({
		sourceDirectory: fileURLToPath(new URL("../../../brand-source/svg", import.meta.url)),
		fontsDirectory: fileURLToPath(new URL("../fonts", import.meta.url)),
		outputDirectory: fileURLToPath(new URL("../dist", import.meta.url)),
	})
}
