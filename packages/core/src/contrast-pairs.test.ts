import { describe, expect, it } from "bun:test"
import { type SemanticTokenName, semanticTokenContract } from "./contract"
import {
	COMPONENT_BOUNDARY_CONTRAST_PAIRS,
	CONTRAST_EXCLUSIONS,
	CONTRAST_PAIRS,
	unmeasuredColourRoles,
} from "./contrast-pairs"

describe("the Contrast Pair table", () => {
	it("holds every colour role in the Contract to a pair or an exclusion", () => {
		expect(unmeasuredColourRoles()).toEqual([])
	})

	it("excludes only color.border, a decorative divider and card edge, with its reason", () => {
		expect(CONTRAST_EXCLUSIONS.map((exclusion) => exclusion.role)).toEqual(["color.border"])
		expect(CONTRAST_EXCLUSIONS[0]?.reason).toContain("decorative")
	})

	it("measures color.input as a component boundary on every surface a control sits on", () => {
		expect(COMPONENT_BOUNDARY_CONTRAST_PAIRS.map((pair) => pair.background)).toEqual([
			"color.background",
			"color.card",
			"color.popover",
			"color.muted",
			"color.secondary",
		])
		for (const pair of COMPONENT_BOUNDARY_CONTRAST_PAIRS) {
			expect(pair.foreground).toBe("color.input")
			expect(pair.floor).toBe(3)
		}
	})

	it("excludes no role the table already measures", () => {
		const measured = new Set(CONTRAST_PAIRS.flatMap((pair) => [pair.background, pair.foreground]))
		for (const exclusion of CONTRAST_EXCLUSIONS) {
			expect(measured.has(exclusion.role)).toBe(false)
		}
	})

	it("lists each Contrast Pair once", () => {
		const pairs = CONTRAST_PAIRS.map((pair) => `${pair.foreground} on ${pair.background}`)
		expect(new Set(pairs).size).toBe(pairs.length)
	})

	it("covers only colour roles, and every one of them", () => {
		const colourRoles = semanticTokenContract.roles
			.filter((role) => role.type === "color")
			.map((role) => role.name as SemanticTokenName)
			.sort()
		const tableRoles = new Set(CONTRAST_PAIRS.flatMap((pair) => [pair.background, pair.foreground]))
		const excludedRoles = new Set(CONTRAST_EXCLUSIONS.map((exclusion) => exclusion.role))
		expect([...tableRoles, ...excludedRoles].sort()).toEqual(colourRoles)
	})
})
