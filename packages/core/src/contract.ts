import type { TokenType } from "./token-type"

/** The name of a role in the Semantic Token Contract. */
export type SemanticTokenName =
	| "color.background"
	| "color.foreground"
	| "color.card"
	| "color.card.foreground"
	| "color.popover"
	| "color.popover.foreground"
	| "color.primary"
	| "color.primary.foreground"
	| "color.secondary"
	| "color.secondary.foreground"
	| "color.muted"
	| "color.muted.foreground"
	| "color.accent"
	| "color.accent.foreground"
	| "color.destructive"
	| "color.destructive.foreground"
	| "color.border"
	| "color.input"
	| "color.ring"
	| "color.stage"
	| "color.stage.foreground"
	| "radius.sm"
	| "radius.md"
	| "radius.lg"
	| "radius.xl"
	| "space.1"
	| "space.2"
	| "space.3"
	| "space.4"
	| "space.5"
	| "space.6"
	| "space.7"
	| "space.8"
	| "space.9"
	| "space.10"
	| "space.12"
	| "space.16"
	| "font.family.sans"
	| "font.family.mono"
	| "font.size.xs"
	| "font.size.sm"
	| "font.size.base"
	| "font.size.lg"
	| "font.size.xl"
	| "font.size.2xl"
	| "font.size.3xl"

/** A role in the Semantic Token Contract: a Semantic Token name and the Token Type it accepts. */
export interface SemanticTokenRole {
	readonly name: string
	readonly type: TokenType
}

/** The versioned, closed set of Semantic Token roles that every Theme must resolve. */
export interface SemanticTokenContract {
	readonly version: number
	readonly roles: readonly SemanticTokenRole[]
}

const ROLE_TYPES: Readonly<Record<SemanticTokenName, TokenType>> = {
	"color.background": "color",
	"color.foreground": "color",
	"color.card": "color",
	"color.card.foreground": "color",
	"color.popover": "color",
	"color.popover.foreground": "color",
	"color.primary": "color",
	"color.primary.foreground": "color",
	"color.secondary": "color",
	"color.secondary.foreground": "color",
	"color.muted": "color",
	"color.muted.foreground": "color",
	"color.accent": "color",
	"color.accent.foreground": "color",
	"color.destructive": "color",
	"color.destructive.foreground": "color",
	"color.border": "color",
	"color.input": "color",
	"color.ring": "color",
	"color.stage": "color",
	"color.stage.foreground": "color",
	"radius.sm": "length",
	"radius.md": "length",
	"radius.lg": "length",
	"radius.xl": "length",
	"space.1": "length",
	"space.2": "length",
	"space.3": "length",
	"space.4": "length",
	"space.5": "length",
	"space.6": "length",
	"space.7": "length",
	"space.8": "length",
	"space.9": "length",
	"space.10": "length",
	"space.12": "length",
	"space.16": "length",
	"font.family.sans": "fontFamily",
	"font.family.mono": "fontFamily",
	"font.size.xs": "length",
	"font.size.sm": "length",
	"font.size.base": "length",
	"font.size.lg": "length",
	"font.size.xl": "length",
	"font.size.2xl": "length",
	"font.size.3xl": "length",
}

/** The Contract role names, in Contract order. */
export const CONTRACT_ROLE_NAMES: readonly SemanticTokenName[] = Object.freeze(
	Object.keys(ROLE_TYPES) as SemanticTokenName[],
)

/** The versioned, closed Semantic Token Contract that every Theme resolves. */
export const semanticTokenContract: SemanticTokenContract = Object.freeze({
	version: 3,
	roles: Object.freeze(
		CONTRACT_ROLE_NAMES.map((name) => Object.freeze({ name, type: ROLE_TYPES[name] })),
	),
})
