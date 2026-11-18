import { describe, expect, it } from "bun:test"
import { semanticTokenContract, type SemanticTokenName } from "./contract"
import { CONTRAST_EXCLUSIONS, CONTRAST_PAIRS, unmeasuredColourRoles } from "./contrast-pairs"

describe("the Contrast Pair table", () => {
	it("holds every colour role in the Contract to a pair or an exclusion", () => {
		expect(unmeasuredColourRoles()).toEqual([])
	})

	it("excludes color.border, a decorative divider and card edge, with its reason", () => {
		const border = CONTRAST_EXCLUSIONS.find((exclusion) => exclusion.role === "color.border")
		expect(border?.reason).toContain("decorative")
	})

	it("excludes no role the table already measures", () => {
		const measured = new Set(CONTRAST_PAIRS.flatMap((pair) => [pair.background, pair.foreground]))
		for (const exclusion of CONTRAST_EXCLUSIONS) {
			expect(measured.has(exclusion.role)).toBe(false)
		}
	})

	it("lists each Contrast Pair once", () => {
		const pairs = CONTRAST_PAIRS.map((pair) => `${pair.background} on ${pair.foreground}`)
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
