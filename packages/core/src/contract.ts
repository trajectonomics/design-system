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

/** A role in the Semantic Token Contract: a Semantic Token name and the Token Type it accepts. */
export interface SemanticTokenRole {
	readonly name: string
	readonly type: TokenType
}

/** The fixed, closed set of Semantic Token names that every Theme must resolve. */
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
}

/** The Contract role names, in Contract order. */
export const CONTRACT_ROLE_NAMES: readonly SemanticTokenName[] = Object.freeze(
	Object.keys(ROLE_TYPES) as SemanticTokenName[],
)

/** The Contract roles as frozen data, in Contract order. */
export const CONTRACT_ROLES: readonly SemanticTokenRole[] = Object.freeze(
	CONTRACT_ROLE_NAMES.map((name) => Object.freeze({ name, type: ROLE_TYPES[name] })),
)

/** The versioned, closed Semantic Token Contract that every Theme resolves. */
export const semanticTokenContract: SemanticTokenContract = Object.freeze({
	version: 1,
	roles: CONTRACT_ROLES,
})
