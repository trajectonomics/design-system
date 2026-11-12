import { describe, expect, it } from "bun:test"
import { packIco, pngSize, readIcoSizes } from "./raster"

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

describe("PNG dimensions", () => {
	it("reads the pixel dimensions from the IHDR chunk", () => {
		expect(pngSize(pngHeader(180, 180))).toEqual({ widthPx: 180, heightPx: 180 })
	})

	it("rejects bytes that are not a PNG", () => {
		expect(() => pngSize(new Uint8Array([1, 2, 3]))).toThrow()
		expect(() => pngSize(new TextEncoder().encode('<svg viewBox="0 0 1 1" />'))).toThrow()
	})
})

describe("ICO packing", () => {
	it("packs one entry per image and reads the sizes back", () => {
		const images = [16, 32, 48].map((sizePx) => ({ sizePx, png: pngHeader(sizePx, sizePx) }))
		const sizes = readIcoSizes(packIco(images))

		expect(sizes).toEqual([16, 32, 48])
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

	it("rejects an image whose PNG is not the declared square size", () => {
		expect(() => packIco([{ sizePx: 32, png: pngHeader(16, 16) }])).toThrow()
		expect(() => packIco([{ sizePx: 32, png: pngHeader(32, 16) }])).toThrow()
	})

	it("rejects a size an ICO entry cannot hold, and an empty ICO", () => {
		expect(() => packIco([{ sizePx: 0, png: pngHeader(0, 0) }])).toThrow()
		expect(() => packIco([{ sizePx: 257, png: pngHeader(257, 257) }])).toThrow()
		expect(() => packIco([])).toThrow()
	})

	it("rejects read-back of bytes that are not an ICO", () => {
		expect(() => readIcoSizes(new Uint8Array(4))).toThrow()
	})
})
