/**
 * The rules the raster helpers reject input with: one code per rule, so a
 * build failure names the rule instead of a generic message.
 */

/** A rule the raster helpers can reject their input with. */
export type RasterErrorCode =
	| "png-too-short"
	| "png-wrong-signature"
	| "png-missing-ihdr"
	| "ico-empty"
	| "ico-too-many-images"
	| "ico-size-out-of-range"
	| "ico-image-size-mismatch"
	| "ico-too-short"
	| "ico-not-an-ico"
	| "ico-directory-truncated"
	| "raster-size-out-of-range"

/** Input the raster helpers cannot read or pack, with the rule it broke. */
export class RasterError extends Error {
	/** The rule the input broke. */
	readonly code: RasterErrorCode

	constructor(code: RasterErrorCode, detail: string) {
		super(detail)
		this.name = "RasterError"
		this.code = code
	}
}
