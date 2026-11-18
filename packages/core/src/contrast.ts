import type { SemanticTokenName } from "./contract"
import type { Theme } from "./theme"

/** A background role and the content or indicator role a Theme paints on it, with its floor. */
export interface ContrastPair {
	readonly background: SemanticTokenName
	readonly foreground: SemanticTokenName
	readonly floor: number
}

/** A Contrast Pair that missed its floor, or whose value the measure could not read. */
export interface ContrastFailure {
	readonly theme: string
	readonly pair: ContrastPair
	readonly backgroundValue: string
	readonly foregroundValue: string
	readonly ratio: number | null
}

/** A colour value the contrast measure can read: `#rgb` or `#rrggbb`. */
const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** The sRGB channels of a readable colour value, or `null` when it cannot be read. */
function srgbChannels(colour: string): [number, number, number] | null {
	if (!HEX_COLOUR.test(colour)) return null
	const digits = colour.slice(1)
	const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits
	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	]
}

/** The WCAG 2.2 linearisation of one 8-bit sRGB channel. */
function linearize(channel: number): number {
	const value = channel / 255
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/** The WCAG 2.2 relative luminance of a colour value, or `null` when it cannot be read. */
function relativeLuminance(colour: string): number | null {
	const channels = srgbChannels(colour)
	if (channels === null) return null
	const [red, green, blue] = channels
	return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue)
}

/** The WCAG 2.2 contrast ratio between two colour values, or `null` when either cannot be read. */
export function contrastRatio(foreground: string, background: string): number | null {
	const foregroundLuminance = relativeLuminance(foreground)
	const backgroundLuminance = relativeLuminance(background)
	if (foregroundLuminance === null || backgroundLuminance === null) return null
	const lighter = Math.max(foregroundLuminance, backgroundLuminance)
	const darker = Math.min(foregroundLuminance, backgroundLuminance)
	return (lighter + 0.05) / (darker + 0.05)
}

/** The pairs a Theme misses or cannot read, reported as data over every pair it was given. */
export function contrastFailures(
	theme: Theme,
	pairs: readonly ContrastPair[],
): readonly ContrastFailure[] {
	const failures: ContrastFailure[] = []
	for (const pair of pairs) {
		const foregroundValue = theme.tokens[pair.foreground] ?? ""
		const backgroundValue = theme.tokens[pair.background] ?? ""
		const ratio = contrastRatio(foregroundValue, backgroundValue)
		if (ratio === null || ratio < pair.floor) {
			failures.push(
				Object.freeze({ theme: theme.name, pair, foregroundValue, backgroundValue, ratio }),
			)
		}
	}
	return Object.freeze(failures)
}

/** A failure in words: the pair, both values and the measured ratio, rounded only to print. */
export function describeContrastFailure(failure: ContrastFailure): string {
	const { theme, pair, foregroundValue, backgroundValue, ratio } = failure
	const measured =
		ratio === null
			? `${foregroundValue} on ${pair.background} ${backgroundValue} is not a colour value the measure can read`
			: `${foregroundValue} on ${pair.background} ${backgroundValue} measures ${ratio.toFixed(2)}:1, under its ${pair.floor}:1 floor`
	return `${theme}: ${pair.foreground} ${measured}`
}
