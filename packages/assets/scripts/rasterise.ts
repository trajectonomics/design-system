/**
 * Renders SVG to PNG with the resvg WASM rasteriser: no native binary, so the
 * same build works on Bun locally and on the CI runner without extra packages.
 * The WASM module ships inside the dev dependency; the build never uses the
 * network.
 */
import { readFile } from "node:fs/promises"
import { initWasm, Resvg } from "@resvg/resvg-wasm"
import { RasterError } from "./raster-error"

/** The resvg renderer fitted to one pixel size. */
type Rasteriser = InstanceType<typeof Resvg>

let wasmReady: Promise<void> | null = null

/** Loads the rasteriser once per process, from the installed dev dependency. */
function loadWasm(): Promise<void> {
	wasmReady ??= readFile(new URL(import.meta.resolve("@resvg/resvg-wasm/index_bg.wasm"))).then(
		(bytes) => initWasm(bytes),
	)
	return wasmReady
}

/** The rasteriser for `svg` fitted to a square of `sizePx` pixels, after the one-time WASM load. */
async function rasteriser(svg: string, sizePx: number): Promise<Rasteriser> {
	if (!Number.isInteger(sizePx) || sizePx < 1) {
		throw new RasterError("raster-size-out-of-range", `A raster cannot be ${sizePx} pixels wide`)
	}
	await loadWasm()
	return new Resvg(svg, { fitTo: { mode: "width", value: sizePx } })
}

/** Renders an SVG to a square PNG of `sizePx` pixels with a transparent background. */
export async function rasteriseSvgToPng(svg: string, sizePx: number): Promise<Uint8Array> {
	return (await rasteriser(svg, sizePx)).render().asPng()
}

/** Renders an SVG to the RGBA pixels of a `sizePx`-square image, four bytes per pixel. */
export async function rasteriseSvgToRgba(svg: string, sizePx: number): Promise<Uint8Array> {
	return (await rasteriser(svg, sizePx)).render().pixels
}
