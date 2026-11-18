import { primitiveTokens } from "../primitives"
import { defineBuiltInTheme, type RolePrimitives, type Theme } from "../theme"
import { nonColorRolePrimitives } from "./non-color-roles"

const { white, neutral50, neutral100, neutral200, neutral500, neutral600, neutral900, neutral950 } =
	primitiveTokens
const { red600, orange700 } = primitiveTokens

const rolePrimitives: RolePrimitives = {
	...nonColorRolePrimitives,
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
	"color.muted.foreground": neutral600,
	"color.accent": orange700,
	"color.accent.foreground": white,
	"color.destructive": red600,
	"color.destructive.foreground": white,
	"color.border": neutral200,
	"color.input": neutral500,
	"color.ring": neutral500,
	"color.stage": neutral900,
	"color.stage.foreground": neutral50,
}

/** The built-in light Theme. */
export const lightTheme: Theme = defineBuiltInTheme("light", rolePrimitives)
