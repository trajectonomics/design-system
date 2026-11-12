import { describe, expect, it } from "bun:test"
import { packIco, pngSize, readIcoSizes } from "./raster"
import { RasterError } from "./raster-error"
import { rasteriseSvgToPng } from "./rasterise"

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** A PNG header only: enough for a dimension reader, and not a valid image. */
function pngHeader(widthPx: number, heightPx: number): Uint8Array {
	const bytes = new Uint8Array(33)
	bytes.set(PNG_SIGNATURE)
	new DataView(bytes.buffer).setUint32(8, 13)
	bytes.set([0x49, 0x48, 0x44, 0x52], 12)
	new DataView(bytes.buffer).setUint32(16, widthPx)
	new DataView(bytes.buffer).setUint32(20, heightPx)
	return bytes
}

function icoEntries(bytes: Uint8Array): readonly (readonly number[])[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const count = view.getUint16(4, true)
	return Array.from({ length: count }, (_, index) => {
		const entry = 6 + index * 16
		return [
			bytes[entry] ?? 0,
			bytes[entry + 1] ?? 0,
			view.getUint32(entry + 8, true),
			view.getUint32(entry + 12, true),
		]
	})
}

/** The rule a raster helper rejects its input with, or what went wrong instead. */
function rejectedCode(run: () => unknown): string {
	try {
		run()
	} catch (error) {
		return error instanceof RasterError ? error.code : `not a RasterError: ${String(error)}`
	}
	return "no-error"
}

async function rejectedCodeAsync(run: () => Promise<unknown>): Promise<string> {
	try {
		await run()
	} catch (error) {
		return error instanceof RasterError ? error.code : `not a RasterError: ${String(error)}`
	}
	return "no-error"
}

describe("PNG dimensions", () => {
	it("reads the pixel dimensions from the IHDR chunk", () => {
		expect(pngSize(pngHeader(180, 180))).toEqual({ widthPx: 180, heightPx: 180 })
	})

	it("rejects bytes too short to hold an IHDR chunk", () => {
		expect(rejectedCode(() => pngSize(new Uint8Array(10)))).toBe("png-too-short")
	})

	it("rejects bytes without the PNG signature", () => {
		expect(rejectedCode(() => pngSize(new Uint8Array(40)))).toBe("png-wrong-signature")
	})

	it("rejects a PNG whose first chunk is not IHDR", () => {
		const bytes = pngHeader(16, 16)
		bytes[12] = 0
		expect(rejectedCode(() => pngSize(bytes))).toBe("png-missing-ihdr")
	})
})

describe("ICO packing", () => {
	it("packs one entry per image and reads the sizes back", () => {
		const images = [16, 32, 48].map((sizePx) => ({ sizePx, png: pngHeader(sizePx, sizePx) }))

		expect(readIcoSizes(packIco(images))).toEqual([16, 32, 48])
	})

	it("points each entry at the image data it describes", () => {
		const images = [16, 32].map((sizePx) => ({ sizePx, png: pngHeader(sizePx, sizePx) }))
		const bytes = packIco(images)

		expect([...bytes.slice(0, 6)]).toEqual([0, 0, 1, 0, 2, 0])
		expect(icoEntries(bytes)).toEqual([
			[16, 16, 33, 6 + 2 * 16],
			[32, 32, 33, 6 + 2 * 16 + 33],
		])
	})

	it("rejects an empty ICO", () => {
		expect(rejectedCode(() => packIco([]))).toBe("ico-empty")
	})

	it("rejects more images than an ICO directory can hold", () => {
		const images = Array.from({ length: 256 }, () => ({ sizePx: 16, png: pngHeader(16, 16) }))
		expect(rejectedCode(() => packIco(images))).toBe("ico-too-many-images")
	})

	it("rejects a size an ICO entry cannot hold", () => {
		const code = (sizePx: number): string =>
			rejectedCode(() => packIco([{ sizePx, png: pngHeader(sizePx, sizePx) }]))

		expect(code(0)).toBe("ico-size-out-of-range")
		expect(code(257)).toBe("ico-size-out-of-range")
	})

	it("rejects an image that is not the declared square size", () => {
		expect(rejectedCode(() => packIco([{ sizePx: 32, png: pngHeader(16, 16) }]))).toBe(
			"ico-image-size-mismatch",
		)
		expect(rejectedCode(() => packIco([{ sizePx: 32, png: pngHeader(32, 16) }]))).toBe(
			"ico-image-size-mismatch",
		)
	})

	it("rejects bytes too short to be an ICO file", () => {
		expect(rejectedCode(() => readIcoSizes(new Uint8Array(4)))).toBe("ico-too-short")
	})

	it("rejects an ICO header that does not describe icons", () => {
		expect(rejectedCode(() => readIcoSizes(new Uint8Array([0, 0, 2, 0, 0, 0])))).toBe(
			"ico-not-an-ico",
		)
	})

	it("rejects an ICO directory that promises more entries than it holds", () => {
		const truncated = new Uint8Array(6 + 16)
		new DataView(truncated.buffer).setUint16(2, 1, true)
		new DataView(truncated.buffer).setUint16(4, 2, true)

		expect(rejectedCode(() => readIcoSizes(truncated))).toBe("ico-directory-truncated")
	})
})

describe("SVG rasterising", () => {
	it("rejects a size below one pixel", async () => {
		const svg = '<svg viewBox="0 0 1 1"><path d="M0 0" /></svg>'
		expect(await rejectedCodeAsync(() => rasteriseSvgToPng(svg, 0))).toBe(
			"raster-size-out-of-range",
		)
	})
})
