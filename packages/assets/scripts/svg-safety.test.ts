import { describe, expect, it } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { brandAssetSvgs } from "./brand-assets"
import { inspectSvg } from "./svg-safety"

const BRAND_SOURCE_SVG = join(import.meta.dir, "..", "..", "..", "brand-source", "svg")

async function ownerSource(name: string): Promise<string> {
	return readFile(join(BRAND_SOURCE_SVG, name), "utf8")
}

function rules(svg: string): readonly string[] {
	return inspectSvg(svg).map((finding) => finding.rule)
}

describe("shipped SVG safety", () => {
	it("passes every SVG the owner supplied", async () => {
		for (const asset of brandAssetSvgs) {
			const findings = inspectSvg(await ownerSource(asset.sourceName))
			expect({ source: asset.sourceName, findings }).toEqual({
				source: asset.sourceName,
				findings: [],
			})
		}
	})

	it("rejects an SVG without a viewBox", () => {
		expect(rules('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>')).toEqual([
			"viewBox",
		])
	})

	it("rejects an SVG that carries a script", () => {
		expect(rules('<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>')).toEqual(["script"])
	})

	it("rejects an SVG with an event handler or a foreignObject", () => {
		expect(rules('<svg viewBox="0 0 1 1" onload="alert(1)" />')).toEqual(["script"])
		expect(rules('<svg viewBox="0 0 1 1"><foreignObject /></svg>')).toEqual(["script"])
	})

	it("rejects an SVG that references an external file", () => {
		expect(
			rules('<svg viewBox="0 0 1 1"><use href="https://example.com/mark.svg" /></svg>'),
		).toEqual(["external-reference"])
		expect(rules('<svg viewBox="0 0 1 1"><image xlink:href="./mark.png" /></svg>')).toEqual([
			"external-reference",
		])
		expect(
			rules('<svg viewBox="0 0 1 1"><rect fill="url(https://example.com/p.svg#g)" /></svg>'),
		).toEqual(["external-reference"])
	})

	it("accepts references inside the same file", () => {
		const svg =
			'<svg viewBox="0 0 1 1"><defs><linearGradient id="g" /></defs><use href="#g" /><rect fill="url(#g)" /></svg>'
		expect(rules(svg)).toEqual([])
	})

	it("rejects an SVG that embeds a font", () => {
		expect(
			rules('<svg viewBox="0 0 1 1"><style>@font-face{font-family:x;src:url(#y)}</style></svg>'),
		).toEqual(["embedded-font"])
	})

	it("reports every rule an SVG breaks, in rule order", async () => {
		const sources = await readdir(BRAND_SOURCE_SVG)
		expect(sources.length).toBeGreaterThan(0)

		const broken = '<svg><script /><use href="a.svg" /><style>@font-face{}</style></svg>'
		expect(rules(broken)).toEqual(["viewBox", "script", "external-reference", "embedded-font"])
	})
})
