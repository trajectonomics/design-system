/**
 * The binary form of the derived favicon rasters: reading a PNG's dimensions
 * and packing an ICO from PNG images. Pure: bytes in, bytes out.
 */
import { RasterError } from "./raster-error"

/** The pixels a PNG declares. */
export interface PngSize {
	readonly widthPx: number
	readonly heightPx: number
}

/** One image inside an ICO file: its square size and the PNG bytes it holds. */
export interface IcoImage {
	readonly sizePx: number
	readonly png: Uint8Array
}

const PNG_SIGNATURE: readonly number[] = Object.freeze([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])
const PNG_HEADER_BYTES = 33
const ICO_HEADER_BYTES = 6
const ICO_ENTRY_BYTES = 16
const ICO_MAX_IMAGES = 255
/** An ICO entry stores a size in one byte, where 0 means 256. */
const ICO_MAX_SIZE_PX = 256

/** Width and height from a PNG's IHDR chunk; throws when the bytes are not a PNG. */
export function pngSize(bytes: Uint8Array): PngSize {
	if (bytes.length < PNG_HEADER_BYTES) {
		throw new RasterError("png-too-short", "Too short to be a PNG with an IHDR chunk")
	}
	for (const [index, byte] of PNG_SIGNATURE.entries()) {
		if (bytes[index] !== byte) {
			throw new RasterError("png-wrong-signature", "Not a PNG: the signature does not match")
		}
	}
	const firstChunk = new TextDecoder().decode(bytes.slice(12, 16))
	if (firstChunk !== "IHDR") {
		throw new RasterError("png-missing-ihdr", `Not a PNG: the first chunk is ${firstChunk}`)
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	return Object.freeze({ widthPx: view.getUint32(16), heightPx: view.getUint32(20) })
}

/** Writes one directory entry, copies its PNG after `dataOffset`, and returns the next offset. */
function writeIcoEntry(
	bytes: Uint8Array,
	view: DataView,
	entryOffset: number,
	image: IcoImage,
	dataOffset: number,
): number {
	if (!Number.isInteger(image.sizePx) || image.sizePx < 1 || image.sizePx > ICO_MAX_SIZE_PX) {
		throw new RasterError(
			"ico-size-out-of-range",
			`An ICO entry cannot hold ${image.sizePx} pixels`,
		)
	}
	const png = pngSize(image.png)
	if (png.widthPx !== image.sizePx || png.heightPx !== image.sizePx) {
		throw new RasterError(
			"ico-image-size-mismatch",
			`An ICO entry for ${image.sizePx} pixels holds a ${png.widthPx}x${png.heightPx} image`,
		)
	}
	const stored = image.sizePx === ICO_MAX_SIZE_PX ? 0 : image.sizePx
	bytes[entryOffset] = stored
	bytes[entryOffset + 1] = stored
	view.setUint16(entryOffset + 4, 1, true)
	view.setUint16(entryOffset + 6, 32, true)
	view.setUint32(entryOffset + 8, image.png.length, true)
	view.setUint32(entryOffset + 12, dataOffset, true)
	bytes.set(image.png, dataOffset)
	return dataOffset + image.png.length
}

/** An ICO file: one PNG-compressed image for every declared square size. */
export function packIco(images: readonly IcoImage[]): Uint8Array {
	if (images.length === 0) {
		throw new RasterError("ico-empty", "An ICO carries at least one image")
	}
	if (images.length > ICO_MAX_IMAGES) {
		throw new RasterError("ico-too-many-images", `An ICO carries at most ${ICO_MAX_IMAGES} images`)
	}
	const imageBytes = images.reduce((total, image) => total + image.png.length, 0)
	const bytes = new Uint8Array(ICO_HEADER_BYTES + ICO_ENTRY_BYTES * images.length + imageBytes)
	const view = new DataView(bytes.buffer)
	view.setUint16(0, 0, true)
	view.setUint16(2, 1, true)
	view.setUint16(4, images.length, true)

	let dataOffset = ICO_HEADER_BYTES + ICO_ENTRY_BYTES * images.length
	for (const [index, image] of images.entries()) {
		const entryOffset = ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES
		dataOffset = writeIcoEntry(bytes, view, entryOffset, image, dataOffset)
	}
	return bytes
}

/** The pixel size of every image an ICO holds, in directory order. */
export function readIcoSizes(bytes: Uint8Array): readonly number[] {
	if (bytes.length < ICO_HEADER_BYTES) {
		throw new RasterError("ico-too-short", "Too short to be an ICO file")
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	if (view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) {
		throw new RasterError("ico-not-an-ico", "Not an ICO file: the header does not describe icons")
	}
	const count = view.getUint16(4, true)
	const sizes: number[] = []
	for (let index = 0; index < count; index += 1) {
		const entry = ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES
		if (bytes.length < entry + ICO_ENTRY_BYTES) {
			throw new RasterError("ico-directory-truncated", "Truncated ICO directory")
		}
		const width = bytes[entry] ?? ICO_MAX_SIZE_PX
		sizes.push(width === 0 ? ICO_MAX_SIZE_PX : width)
	}
	return Object.freeze(sizes)
}
