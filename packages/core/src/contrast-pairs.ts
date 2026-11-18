import { type SemanticTokenName, semanticTokenContract } from "./contract"
import type { ContrastPair } from "./contrast"

/** The WCAG 2.2 AA contrast floor for normal text, applied to every text pair. */
export const TEXT_CONTRAST_FLOOR: number = 4.5

/** The WCAG 2.2 SC 1.4.11 contrast floor for a focus indicator or a control's boundary. */
export const NON_TEXT_CONTRAST_FLOOR: number = 3

/** The surfaces a control and the page around it can sit on, against which the focus ring is offset. */
const FOCUS_INDICATOR_SURFACES: readonly SemanticTokenName[] = [
	"color.background",
	"color.card",
	"color.popover",
	"color.muted",
	"color.secondary",
	"color.stage",
]

/** The surfaces an input's boundary is drawn against, so the boundary identifies the control. */
const COMPONENT_BOUNDARY_SURFACES: readonly SemanticTokenName[] = [
	"color.background",
	"color.card",
	"color.popover",
	"color.muted",
	"color.secondary",
]

function textPair(background: SemanticTokenName, foreground: SemanticTokenName): ContrastPair {
	return Object.freeze({ background, foreground, floor: TEXT_CONTRAST_FLOOR })
}

function nonTextPair(background: SemanticTokenName, foreground: SemanticTokenName): ContrastPair {
	return Object.freeze({ background, foreground, floor: NON_TEXT_CONTRAST_FLOOR })
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

/**
 * The focus indicator against every surface a control sits on.
 *
 * `Button` draws `ring-offset-2 ring-offset-background`, so a band of `color.background`
 * separates the ring from the fill of the control it surrounds; the fill is never the pair.
 */
export const FOCUS_INDICATOR_CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze(
	FOCUS_INDICATOR_SURFACES.map((background) => nonTextPair(background, "color.ring")),
)

/**
 * The boundary that identifies an input against the surfaces it sits on.
 *
 * The `outline` Button reuses `color.input` for its border, so it is held to the same floor.
 */
export const COMPONENT_BOUNDARY_CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze(
	COMPONENT_BOUNDARY_SURFACES.map((background) => nonTextPair(background, "color.input")),
)

/** Every Contrast Pair the built-in Themes are held to. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze([
	...TEXT_CONTRAST_PAIRS,
	...FOCUS_INDICATOR_CONTRAST_PAIRS,
	...COMPONENT_BOUNDARY_CONTRAST_PAIRS,
])

/** A colour role the table does not measure, and why it is not a Contrast Pair. */
export interface ContrastExclusion {
	readonly role: SemanticTokenName
	readonly reason: string
}

/** The colour roles the table does not measure on purpose. */
export const CONTRAST_EXCLUSIONS: readonly ContrastExclusion[] = Object.freeze([
	Object.freeze({
		role: "color.border",
		reason:
			"a decorative divider and card edge, not the boundary that identifies a control, so WCAG 2.2 SC 1.4.11 does not hold it to a non-text floor",
	}),
])

/** The colour roles in the Contract that no Contrast Pair measures and no exclusion explains. */
export function unmeasuredColourRoles(): readonly SemanticTokenName[] {
	const measured = new Set<SemanticTokenName>()
	for (const pair of CONTRAST_PAIRS) {
		measured.add(pair.background)
		measured.add(pair.foreground)
	}
	const excluded = new Set(CONTRAST_EXCLUSIONS.map((exclusion) => exclusion.role))
	return Object.freeze(
		semanticTokenContract.roles
			.filter((role) => role.type === "color")
			.map((role) => role.name as SemanticTokenName)
			.filter((role) => !measured.has(role) && !excluded.has(role)),
	)
}
