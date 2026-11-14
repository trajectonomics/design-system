import { createPrimitiveToken, type PrimitiveToken } from "./primitive-token"

/** The built-in Primitive Tokens: the raw colour palette every built-in Theme draws from. */
export interface PrimitiveTokenPalette {
	readonly white: PrimitiveToken
	readonly neutral50: PrimitiveToken
	readonly neutral100: PrimitiveToken
	readonly neutral200: PrimitiveToken
	readonly neutral400: PrimitiveToken
	readonly neutral500: PrimitiveToken
	readonly neutral800: PrimitiveToken
	readonly neutral900: PrimitiveToken
	readonly neutral950: PrimitiveToken
	readonly red400: PrimitiveToken
	readonly red600: PrimitiveToken
	readonly orange600: PrimitiveToken
	readonly orange700: PrimitiveToken
}

/** The built-in Primitive Tokens, frozen as one palette. */
export const primitiveTokens: PrimitiveTokenPalette = Object.freeze({
	white: createPrimitiveToken({ name: "color.white", type: "color", value: "#ffffff" }),
	neutral50: createPrimitiveToken({ name: "color.neutral.50", type: "color", value: "#fafafa" }),
	neutral100: createPrimitiveToken({ name: "color.neutral.100", type: "color", value: "#f5f5f5" }),
	neutral200: createPrimitiveToken({ name: "color.neutral.200", type: "color", value: "#e5e5e5" }),
	neutral400: createPrimitiveToken({ name: "color.neutral.400", type: "color", value: "#a1a1a1" }),
	neutral500: createPrimitiveToken({ name: "color.neutral.500", type: "color", value: "#737373" }),
	neutral800: createPrimitiveToken({ name: "color.neutral.800", type: "color", value: "#262626" }),
	neutral900: createPrimitiveToken({ name: "color.neutral.900", type: "color", value: "#171717" }),
	neutral950: createPrimitiveToken({ name: "color.neutral.950", type: "color", value: "#0a0a0a" }),
	red400: createPrimitiveToken({ name: "color.red.400", type: "color", value: "#ff6467" }),
	red600: createPrimitiveToken({ name: "color.red.600", type: "color", value: "#e7000b" }),
	orange600: createPrimitiveToken({ name: "color.orange.600", type: "color", value: "#ea580c" }),
	orange700: createPrimitiveToken({ name: "color.orange.700", type: "color", value: "#c2410c" }),
})
