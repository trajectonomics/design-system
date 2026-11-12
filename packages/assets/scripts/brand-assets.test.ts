import { describe, expect, it } from "bun:test"
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import {
	brandAssetExportPaths,
	brandAssetSvgs,
	distPath,
	faviconIco,
	faviconPngs,
	faviconSvgExportPath,
} from "./brand-assets"

const PACKAGE_ROOT = join(import.meta.dir, "..")
const BRAND_SOURCE_SVG = join(PACKAGE_ROOT, "..", "..", "brand-source", "svg")

interface PackageManifest {
	readonly exports: Record<string, string>
	readonly files: readonly string[]
}

async function packageManifest(): Promise<PackageManifest> {
	return (await Bun.file(join(PACKAGE_ROOT, "package.json")).json()) as PackageManifest
}

describe("Brand Asset manifest", () => {
	it("pins the package exports to exactly the Brand Assets it ships", async () => {
		const manifest = await packageManifest()
		const exported = Object.keys(manifest.exports)
			.filter((subpath) => subpath !== "./package.json")
			.sort()

		expect(exported).toEqual([...brandAssetExportPaths].sort())
	})

	it("serves every export from the built dist directory", async () => {
		const manifest = await packageManifest()

		for (const subpath of brandAssetExportPaths) {
			expect(manifest.exports[subpath]).toBe(`./dist/${distPath(subpath)}`)
		}
	})

	it("derives every favicon raster from the favicon SVG it ships", () => {
		expect(brandAssetSvgs.map((asset) => asset.exportPath)).toContain(faviconSvgExportPath)
		expect(faviconSvgExportPath).toBe("./favicon/favicon.svg")
		expect(faviconPngs.map((png) => png.sizePx)).toEqual([180, 192, 512])
		expect(faviconIco.sizesPx).toEqual([16, 32, 48])
	})

	it("declares every export path once", () => {
		expect(new Set(brandAssetExportPaths).size).toBe(brandAssetExportPaths.length)
	})

	it("names a source file the owner supplied for every SVG it ships", async () => {
		const sources = await readdir(BRAND_SOURCE_SVG)

		for (const asset of brandAssetSvgs) {
			expect(sources).toContain(asset.sourceName)
		}
	})

	it("keeps the owner's licence beside the art it governs", async () => {
		const manifest = await packageManifest()

		expect(manifest.files).toContain("NOTICE")
		expect(await Bun.file(join(PACKAGE_ROOT, "NOTICE")).exists()).toBe(true)
		expect(await Bun.file(join(PACKAGE_ROOT, "INTER-OFL-1.1.txt")).exists()).toBe(true)
	})
})
