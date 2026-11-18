import { primitiveTokens } from "../primitives"
import { defineBuiltInTheme, type RolePrimitives, type Theme } from "../theme"
import { nonColorRolePrimitives } from "./non-color-roles"

const { neutral50, neutral200, neutral400, neutral500, neutral800, neutral900, neutral950 } =
	primitiveTokens
const { red400, orange600 } = primitiveTokens

const rolePrimitives: RolePrimitives = {
	...nonColorRolePrimitives,
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
	"color.accent": orange600,
	"color.accent.foreground": neutral950,
	"color.destructive": red400,
	"color.destructive.foreground": neutral950,
	"color.border": neutral800,
	"color.input": neutral500,
	"color.ring": neutral500,
	"color.stage": neutral950,
	"color.stage.foreground": neutral50,
}

/** The built-in dark Theme. */
export const darkTheme: Theme = defineBuiltInTheme("dark", rolePrimitives)
