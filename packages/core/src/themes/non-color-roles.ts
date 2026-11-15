import type { SemanticTokenName } from "../contract"
import type { PrimitiveToken } from "../primitive-token"
import { primitiveTokens } from "../primitives"

/** A Contract role whose Token Type is not `color`. */
export type NonColorRoleName = Exclude<SemanticTokenName, `color.${string}`>

/**
 * One Primitive Token per non-colour role. Radius, spacing, type scale and font
 * stacks are context-free, so every built-in Theme resolves them identically.
 */
export const nonColorRolePrimitives: Readonly<Record<NonColorRoleName, PrimitiveToken>> =
	Object.freeze({
		"radius.sm": primitiveTokens.length0_25rem,
		"radius.md": primitiveTokens.length0_375rem,
		"radius.lg": primitiveTokens.length0_5rem,
		"radius.xl": primitiveTokens.length0_75rem,
		"space.1": primitiveTokens.length0_25rem,
		"space.2": primitiveTokens.length0_5rem,
		"space.3": primitiveTokens.length0_75rem,
		"space.4": primitiveTokens.length1rem,
		"space.5": primitiveTokens.length1_25rem,
		"space.6": primitiveTokens.length1_5rem,
		"space.7": primitiveTokens.length1_75rem,
		"space.8": primitiveTokens.length2rem,
		"space.9": primitiveTokens.length2_25rem,
		"space.10": primitiveTokens.length2_5rem,
		"space.12": primitiveTokens.length3rem,
		"space.16": primitiveTokens.length4rem,
		"font.family.sans": primitiveTokens.fontSans,
		"font.family.mono": primitiveTokens.fontMono,
		"font.size.xs": primitiveTokens.length0_75rem,
		"font.size.sm": primitiveTokens.length0_875rem,
		"font.size.base": primitiveTokens.length1rem,
		"font.size.lg": primitiveTokens.length1_125rem,
		"font.size.xl": primitiveTokens.length1_25rem,
		"font.size.2xl": primitiveTokens.length1_5rem,
		"font.size.3xl": primitiveTokens.length1_875rem,
	})
