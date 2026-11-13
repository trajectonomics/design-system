import { describe, expect, it } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
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

/** The owner's source file for one package subpath. */
async function sourceSvg(exportPath: string): Promise<string> {
	const asset = brandAssetSvgs.find((candidate) => candidate.exportPath === exportPath)
	if (asset === undefined) throw new Error(`${exportPath} is not one of the shipped SVGs`)
	return readFile(join(BRAND_SOURCE_SVG, asset.sourceName), "utf8")
}

/** The hex colours an SVG paints with, as written. */
function hexFills(svg: string): readonly string[] {
	return [...svg.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)].map((match) => match[1] ?? "")
}

/** Perceived brightness of a `#rgb` or `#rrggbb` colour, from 0 (black) to 1 (white). */
function brightness(hex: string): number {
	const digits = hex.slice(1)
	const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits
	const channels = [0, 2, 4].map((start) => Number.parseInt(full.slice(start, start + 2), 16))
	return channels.reduce((total, channel) => total + channel, 0) / (3 * 255)
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

	it("leaves the inline variants to the surrounding text colour", async () => {
		for (const exportPath of ["./logo/mark.svg", "./logo/wordmark.svg"]) {
			const svg = await sourceSvg(exportPath)
			expect({ exportPath, currentColor: svg.includes("currentColor") }).toEqual({
				exportPath,
				currentColor: true,
			})
			expect({ exportPath, fills: hexFills(svg) }).toEqual({ exportPath, fills: [] })
		}
	})

	it("keeps the on-light variants dark and the on-dark variants light", async () => {
		for (const exportPath of ["./logo/mark-on-light.svg", "./logo/wordmark-on-light.svg"]) {
			for (const fill of hexFills(await sourceSvg(exportPath))) {
				expect({ exportPath, fill, dark: brightness(fill) < 0.5 }).toEqual({
					exportPath,
					fill,
					dark: true,
				})
			}
		}
		for (const exportPath of ["./logo/mark-on-dark.svg", "./logo/wordmark-on-dark.svg"]) {
			for (const fill of hexFills(await sourceSvg(exportPath))) {
				expect({ exportPath, fill, light: brightness(fill) > 0.5 }).toEqual({
					exportPath,
					fill,
					light: true,
				})
			}
		}
	})

	it("lets the favicon SVG follow the reader's colour scheme", async () => {
		expect(await sourceSvg(faviconSvgExportPath)).toContain("prefers-color-scheme")
	})

	it("keeps the owner's licence beside the art it governs", async () => {
		const manifest = await packageManifest()

		expect(manifest.files).toContain("NOTICE")
		expect(await Bun.file(join(PACKAGE_ROOT, "NOTICE")).exists()).toBe(true)
		expect(await Bun.file(join(PACKAGE_ROOT, "INTER-OFL-1.1.txt")).exists()).toBe(true)
	})
})
