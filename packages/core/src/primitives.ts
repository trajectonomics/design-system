import { createPrimitiveToken, type PrimitiveToken } from "./primitive-token"

/** The built-in Primitive Tokens: the raw palette every built-in Theme draws from. */
export interface PrimitiveTokenPalette {
	readonly white: PrimitiveToken
	readonly neutral50: PrimitiveToken
	readonly neutral100: PrimitiveToken
	readonly neutral200: PrimitiveToken
	readonly neutral400: PrimitiveToken
	readonly neutral500: PrimitiveToken
	readonly neutral600: PrimitiveToken
	readonly neutral800: PrimitiveToken
	readonly neutral900: PrimitiveToken
	readonly neutral950: PrimitiveToken
	readonly red400: PrimitiveToken
	readonly red600: PrimitiveToken
	readonly orange600: PrimitiveToken
	readonly orange700: PrimitiveToken
	// Length keys encode their value without dots or dashes (`length0_25rem` is `0.25rem`).
	readonly length0_25rem: PrimitiveToken
	readonly length0_375rem: PrimitiveToken
	readonly length0_5rem: PrimitiveToken
	readonly length0_75rem: PrimitiveToken
	readonly length0_875rem: PrimitiveToken
	readonly length1rem: PrimitiveToken
	readonly length1_125rem: PrimitiveToken
	readonly length1_25rem: PrimitiveToken
	readonly length1_5rem: PrimitiveToken
	readonly length1_75rem: PrimitiveToken
	readonly length1_875rem: PrimitiveToken
	readonly length2rem: PrimitiveToken
	readonly length2_25rem: PrimitiveToken
	readonly length2_5rem: PrimitiveToken
	readonly length3rem: PrimitiveToken
	readonly length4rem: PrimitiveToken
	readonly fontSans: PrimitiveToken
	readonly fontMono: PrimitiveToken
}

/** The built-in Primitive Tokens, frozen as one palette. */
export const primitiveTokens: PrimitiveTokenPalette = Object.freeze({
	white: createPrimitiveToken({ name: "color.white", type: "color", value: "#ffffff" }),
	neutral50: createPrimitiveToken({ name: "color.neutral.50", type: "color", value: "#fafafa" }),
	neutral100: createPrimitiveToken({ name: "color.neutral.100", type: "color", value: "#f5f5f5" }),
	neutral200: createPrimitiveToken({ name: "color.neutral.200", type: "color", value: "#e5e5e5" }),
	neutral400: createPrimitiveToken({ name: "color.neutral.400", type: "color", value: "#a1a1a1" }),
	neutral500: createPrimitiveToken({ name: "color.neutral.500", type: "color", value: "#737373" }),
	neutral600: createPrimitiveToken({ name: "color.neutral.600", type: "color", value: "#525252" }),
	neutral800: createPrimitiveToken({ name: "color.neutral.800", type: "color", value: "#262626" }),
	neutral900: createPrimitiveToken({ name: "color.neutral.900", type: "color", value: "#171717" }),
	neutral950: createPrimitiveToken({ name: "color.neutral.950", type: "color", value: "#0a0a0a" }),
	red400: createPrimitiveToken({ name: "color.red.400", type: "color", value: "#ff6467" }),
	red600: createPrimitiveToken({ name: "color.red.600", type: "color", value: "#e7000b" }),
	orange600: createPrimitiveToken({ name: "color.orange.600", type: "color", value: "#ea580c" }),
	orange700: createPrimitiveToken({ name: "color.orange.700", type: "color", value: "#c2410c" }),
	length0_25rem: createPrimitiveToken({ name: "length.0-25rem", type: "length", value: "0.25rem" }),
	length0_375rem: createPrimitiveToken({
		name: "length.0-375rem",
		type: "length",
		value: "0.375rem",
	}),
	length0_5rem: createPrimitiveToken({ name: "length.0-5rem", type: "length", value: "0.5rem" }),
	length0_75rem: createPrimitiveToken({ name: "length.0-75rem", type: "length", value: "0.75rem" }),
	length0_875rem: createPrimitiveToken({
		name: "length.0-875rem",
		type: "length",
		value: "0.875rem",
	}),
	length1rem: createPrimitiveToken({ name: "length.1rem", type: "length", value: "1rem" }),
	length1_125rem: createPrimitiveToken({
		name: "length.1-125rem",
		type: "length",
		value: "1.125rem",
	}),
	length1_25rem: createPrimitiveToken({ name: "length.1-25rem", type: "length", value: "1.25rem" }),
	length1_5rem: createPrimitiveToken({ name: "length.1-5rem", type: "length", value: "1.5rem" }),
	length1_75rem: createPrimitiveToken({ name: "length.1-75rem", type: "length", value: "1.75rem" }),
	length1_875rem: createPrimitiveToken({
		name: "length.1-875rem",
		type: "length",
		value: "1.875rem",
	}),
	length2rem: createPrimitiveToken({ name: "length.2rem", type: "length", value: "2rem" }),
	length2_25rem: createPrimitiveToken({ name: "length.2-25rem", type: "length", value: "2.25rem" }),
	length2_5rem: createPrimitiveToken({ name: "length.2-5rem", type: "length", value: "2.5rem" }),
	length3rem: createPrimitiveToken({ name: "length.3rem", type: "length", value: "3rem" }),
	length4rem: createPrimitiveToken({ name: "length.4rem", type: "length", value: "4rem" }),
	fontSans: createPrimitiveToken({
		name: "font.sans",
		type: "fontFamily",
		value:
			'ui-sans-serif, system-ui, "Segoe UI", "Leelawadee UI", Thonburi, "Noto Sans Thai", sans-serif',
	}),
	fontMono: createPrimitiveToken({
		name: "font.mono",
		type: "fontFamily",
		value:
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
	}),
})
