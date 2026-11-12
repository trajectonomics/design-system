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
} from "./brand-assets"
import { buildAssets } from "./build-assets"
import { pngSize, readIcoSizes } from "./raster"
import { inspectSvg } from "./svg-safety"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const BRAND_SOURCE_SVG = join(PACKAGE_ROOT, "..", "..", "brand-source", "svg")

let outputDirectory: string

beforeAll(async () => {
	outputDirectory = await mkdtemp(join(tmpdir(), "ds-assets-build-"))
	await buildAssets({ sourceDirectory: BRAND_SOURCE_SVG, outputDirectory })
})

afterAll(async () => {
	await rm(outputDirectory, { recursive: true, force: true })
})

async function builtExport(exportPath: string): Promise<Uint8Array> {
	return new Uint8Array(await Bun.file(join(outputDirectory, distPath(exportPath))).arrayBuffer())
}

describe("Brand Asset build", () => {
	it("writes every exported Brand Asset into the output directory", async () => {
		const missing: string[] = []
		for (const exportPath of brandAssetExportPaths) {
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

	it("refuses to ship an SVG that carries active content", async () => {
		const source = await mkdtemp(join(tmpdir(), "ds-assets-source-"))
		try {
			await cp(BRAND_SOURCE_SVG, source, { recursive: true })
			await writeFile(
				join(source, "favicon.svg"),
				'<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>',
			)

			await expect(buildAssets({ sourceDirectory: source, outputDirectory })).rejects.toThrow(
				/script/,
			)
		} finally {
			await rm(source, { recursive: true, force: true })
		}
	})
})
