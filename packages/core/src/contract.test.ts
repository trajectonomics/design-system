import { describe, expect, it } from "bun:test"
import { semanticTokenContract } from "./index"

/** Every role of Semantic Token Contract v3, with its Token Type, in Contract order. */
const V3_ROLES: [string, string][] = [
	["color.background", "color"],
	["color.foreground", "color"],
	["color.card", "color"],
	["color.card.foreground", "color"],
	["color.popover", "color"],
	["color.popover.foreground", "color"],
	["color.primary", "color"],
	["color.primary.foreground", "color"],
	["color.secondary", "color"],
	["color.secondary.foreground", "color"],
	["color.muted", "color"],
	["color.muted.foreground", "color"],
	["color.accent", "color"],
	["color.accent.foreground", "color"],
	["color.destructive", "color"],
	["color.destructive.foreground", "color"],
	["color.border", "color"],
	["color.input", "color"],
	["color.ring", "color"],
	["color.stage", "color"],
	["color.stage.foreground", "color"],
	["radius.sm", "length"],
	["radius.md", "length"],
	["radius.lg", "length"],
	["radius.xl", "length"],
	["space.1", "length"],
	["space.2", "length"],
	["space.3", "length"],
	["space.4", "length"],
	["space.5", "length"],
	["space.6", "length"],
	["space.7", "length"],
	["space.8", "length"],
	["space.9", "length"],
	["space.10", "length"],
	["space.12", "length"],
	["space.16", "length"],
	["font.family.sans", "fontFamily"],
	["font.family.mono", "fontFamily"],
	["font.size.xs", "length"],
	["font.size.sm", "length"],
	["font.size.base", "length"],
	["font.size.lg", "length"],
	["font.size.xl", "length"],
	["font.size.2xl", "length"],
	["font.size.3xl", "length"],
]

describe("Semantic Token Contract", () => {
	it("is version 3", () => {
		expect(semanticTokenContract.version).toBe(3)
	})

	it("is the closed v3 role set, colours first, each role with its Token Type", () => {
		expect(semanticTokenContract.roles.map((role) => [role.name, role.type])).toEqual(V3_ROLES)
	})

	it("is closed: the Contract and every role are frozen", () => {
		expect(Object.isFrozen(semanticTokenContract)).toBe(true)
		expect(Object.isFrozen(semanticTokenContract.roles)).toBe(true)
		for (const role of semanticTokenContract.roles) {
			expect(Object.isFrozen(role)).toBe(true)
		}
	})
})
