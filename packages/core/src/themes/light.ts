import { primitiveTokens } from "../primitives"
import { type ContractAliases, defineBuiltInTheme, type Theme } from "../theme"

const { white, neutral50, neutral100, neutral200, neutral400, neutral500, neutral900, neutral950 } =
	primitiveTokens
const { red600 } = primitiveTokens

const aliases: ContractAliases = {
	"color.background": white,
	"color.foreground": neutral950,
	"color.card": white,
	"color.card.foreground": neutral950,
	"color.popover": white,
	"color.popover.foreground": neutral950,
	"color.primary": neutral900,
	"color.primary.foreground": neutral50,
	"color.secondary": neutral100,
	"color.secondary.foreground": neutral900,
	"color.muted": neutral100,
	"color.muted.foreground": neutral500,
	"color.accent": neutral100,
	"color.accent.foreground": neutral900,
	"color.destructive": red600,
	"color.destructive.foreground": white,
	"color.border": neutral200,
	"color.input": neutral200,
	"color.ring": neutral400,
}

/** The built-in light Theme. */
export const lightTheme: Theme = defineBuiltInTheme("light", aliases)
