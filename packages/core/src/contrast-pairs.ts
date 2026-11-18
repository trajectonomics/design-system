import type { SemanticTokenName } from "./contract"
import type { ContrastPair } from "./contrast"

/** The WCAG 2.2 AA contrast floor for normal text, applied to every text pair. */
export const TEXT_CONTRAST_FLOOR: number = 4.5

function textPair(background: SemanticTokenName, foreground: SemanticTokenName): ContrastPair {
	return Object.freeze({ background, foreground, floor: TEXT_CONTRAST_FLOOR })
}

/**
 * The text pairs a built-in Theme paints, each at the AA text floor.
 *
 * There is no large-text allowance: a Theme carries no font size or weight, so the
 * allowance cannot be applied at this layer.
 */
export const TEXT_CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze([
	textPair("color.background", "color.foreground"),
	textPair("color.card", "color.card.foreground"),
	textPair("color.popover", "color.popover.foreground"),
	textPair("color.primary", "color.primary.foreground"),
	textPair("color.secondary", "color.secondary.foreground"),
	textPair("color.muted", "color.muted.foreground"),
	textPair("color.accent", "color.accent.foreground"),
	textPair("color.destructive", "color.destructive.foreground"),
	textPair("color.stage", "color.stage.foreground"),
	// A page paints body and secondary text on the neutral bands without switching its text role.
	textPair("color.card", "color.foreground"),
	textPair("color.popover", "color.foreground"),
	textPair("color.muted", "color.foreground"),
	textPair("color.secondary", "color.foreground"),
	textPair("color.background", "color.muted.foreground"),
	textPair("color.card", "color.muted.foreground"),
	textPair("color.popover", "color.muted.foreground"),
	textPair("color.secondary", "color.muted.foreground"),
])
