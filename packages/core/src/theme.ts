import { CONTRACT_ROLE_NAMES, type SemanticTokenName, semanticTokenContract } from "./contract"
import type { PrimitiveToken } from "./primitive-token"
import { createSemanticToken } from "./semantic-token"

/** A Theme: a named, frozen set of literal values that resolves every role in the Contract. */
export interface Theme {
	readonly name: string
	readonly contractVersion: number
	readonly tokens: Readonly<Record<string, string>>
}

/** One Primitive Token chosen for every role in the Semantic Token Contract. */
export type RolePrimitives = Readonly<Record<SemanticTokenName, PrimitiveToken>>

/** Resolves a built-in Theme from one Primitive Token per Contract role. */
export function defineBuiltInTheme(name: string, rolePrimitives: RolePrimitives): Theme {
	const tokens: Record<string, string> = {}
	for (const role of CONTRACT_ROLE_NAMES) {
		tokens[role] = createSemanticToken({ name: role, primitive: rolePrimitives[role] }).value
	}
	return Object.freeze({
		name,
		contractVersion: semanticTokenContract.version,
		tokens: Object.freeze(tokens),
	})
}
