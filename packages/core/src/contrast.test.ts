import { describe, expect, it } from "bun:test"
import { contrastFailures, contrastRatio, describeContrastFailure } from "./contrast"
import { FOCUS_INDICATOR_CONTRAST_PAIRS, TEXT_CONTRAST_PAIRS } from "./contrast-pairs"
import type { Theme } from "./theme"
import { themes } from "./themes"

describe("the WCAG contrast measure", () => {
	it("pins black on white at 21:1, white on white at 1:1, #777777 on white at 4.48:1 and white on #ff6467 at 2.89:1", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBe(21)
		expect(contrastRatio("#ffffff", "#ffffff")).toBe(1)
		expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2)
		expect(contrastRatio("#ffffff", "#ff6467")).toBeCloseTo(2.89, 2)
	})

	it("reads #rgb as #rrggbb", () => {
		expect(contrastRatio("#fff", "#000")).toBe(21)
	})

	it("reads no ratio from a value that is not #rgb or #rrggbb", () => {
		expect(contrastRatio("oklch(0.5 0 0)", "#ffffff")).toBeNull()
		expect(contrastRatio("#ffffff", "#abcd")).toBeNull()
		expect(contrastRatio("#ffffff", "red")).toBeNull()
	})
})

describe("built-in Themes", () => {
	it("meet the AA text floor on every Contrast Pair", () => {
		for (const theme of themes) {
			expect(contrastFailures(theme, TEXT_CONTRAST_PAIRS).map(describeContrastFailure)).toEqual([])
		}
	})

	it("meet the focus-indicator floor on every surface a control is offset against", () => {
		for (const theme of themes) {
			expect(
				contrastFailures(theme, FOCUS_INDICATOR_CONTRAST_PAIRS).map(describeContrastFailure),
			).toEqual([])
		}
	})

	it("fail a pair whose value it cannot read instead of skipping it", () => {
		const theme: Theme = {
			name: "unreadable",
			contractVersion: 3,
			tokens: { "color.background": "#ffffff", "color.ring": "oklch(0.5 0 0)" },
		}
		const failures = contrastFailures(theme, [
			{ background: "color.background", foreground: "color.ring", floor: 3 },
		])
		expect(failures.map(describeContrastFailure)).toEqual([
			"unreadable: color.ring oklch(0.5 0 0) on color.background #ffffff is not a colour value the measure can read",
		])
	})
})
