import { primitiveTokens } from "../primitives"
import { defineBuiltInTheme, type RolePrimitives, type Theme } from "../theme"

const { white, neutral50, neutral200, neutral400, neutral500, neutral800, neutral900, neutral950 } =
	primitiveTokens
const { red400 } = primitiveTokens

const rolePrimitives: RolePrimitives = {
	"color.background": neutral950,
	"color.foreground": neutral50,
	"color.card": neutral900,
	"color.card.foreground": neutral50,
	"color.popover": neutral900,
	"color.popover.foreground": neutral50,
	"color.primary": neutral200,
	"color.primary.foreground": neutral900,
	"color.secondary": neutral800,
	"color.secondary.foreground": neutral50,
	"color.muted": neutral800,
	"color.muted.foreground": neutral400,
	"color.accent": neutral800,
	"color.accent.foreground": neutral50,
	"color.destructive": red400,
	"color.destructive.foreground": white,
	"color.border": neutral800,
	"color.input": neutral800,
	"color.ring": neutral500,
}

/** The built-in dark Theme. */
export const darkTheme: Theme = defineBuiltInTheme("dark", rolePrimitives)
