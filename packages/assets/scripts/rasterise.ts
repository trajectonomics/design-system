/**
 * Renders SVG to PNG with the resvg WASM rasteriser: no native binary, so the
 * same build works on Bun locally and on the CI runner without extra packages.
 * The WASM module ships inside the dev dependency; the build never uses the
 * network.
 */
import { readFile } from "node:fs/promises"
import { initWasm, Resvg } from "@resvg/resvg-wasm"

let wasmReady: Promise<void> | null = null

/** Loads the rasteriser once per process, from the installed dev dependency. */
function loadWasm(): Promise<void> {
	wasmReady ??= readFile(new URL(import.meta.resolve("@resvg/resvg-wasm/index_bg.wasm"))).then(
		(bytes) => initWasm(bytes),
	)
	return wasmReady
}

/** Renders an SVG to a square PNG of `sizePx` pixels with a transparent background. */
export async function rasteriseSvgToPng(svg: string, sizePx: number): Promise<Uint8Array> {
	if (!Number.isInteger(sizePx) || sizePx < 1) {
		throw new Error(`A PNG cannot be ${sizePx} pixels wide`)
	}
	await loadWasm()
	const image = new Resvg(svg, { fitTo: { mode: "width", value: sizePx } })
	return image.render().asPng()
}
