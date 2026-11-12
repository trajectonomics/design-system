/**
 * Writes the packages/assets `dist` directory: the owner's SVG sources and the
 * favicon rasters derived from the favicon SVG. Run with `bun run build`.
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
import { packIco } from "./raster"
import { rasteriseSvgToPng } from "./rasterise"
import { inspectSvg } from "./svg-safety"

/** Where the owner's brand source and the package's build output live. */
export interface BuildAssetsOptions {
	/** The directory that holds the owner's SVG sources. */
	readonly sourceDirectory: string
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

/** Writes every Brand Asset, failing on an SVG the safety rules reject. */
export async function buildAssets({
	sourceDirectory,
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
}

if (import.meta.main) {
	await buildAssets({
		sourceDirectory: fileURLToPath(new URL("../../../brand-source/svg", import.meta.url)),
		outputDirectory: fileURLToPath(new URL("../dist", import.meta.url)),
	})
}
