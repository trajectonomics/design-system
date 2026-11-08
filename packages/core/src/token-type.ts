/** The type of a Design Token value: a colour, a length or a font family. */
export type TokenType = "color" | "length" | "fontFamily"

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const COLOR_FUNCTION =
	/^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(\s*(?:none|[+.\d%-])[^();}]*\)$/i
const LENGTH =
	/^(?:0|-?(?:\d+|\d*\.\d+)(?:px|rem|em|%|ch|ex|vh|vw|vmin|vmax|svh|svw|lvh|lvw|dvh|dvw|pt|pc|cm|mm|in|fr|cqw|cqi|cqh|cqb|cqmin|cqmax))$/
const FONT_FAMILY =
	/^(?:"[^";{}()]+"|'[^';{}()]+'|[a-z][a-z0-9 -]*)(?:\s*,\s*(?:"[^";{}()]+"|'[^';{}()]+'|[a-z][a-z0-9 -]*))*$/i

/** Returns true when `value` is one of the three Token Types. */
export function isTokenType(value: string): value is TokenType {
	return value === "color" || value === "length" || value === "fontFamily"
}

/** Returns true when `value` is a literal that `type` accepts. */
export function isTokenValue(type: TokenType, value: string): boolean {
	switch (type) {
		case "color":
			return HEX_COLOR.test(value) || COLOR_FUNCTION.test(value)
		case "length":
			return LENGTH.test(value)
		case "fontFamily":
			return FONT_FAMILY.test(value)
	}
}
