import { describe, expect, it } from "bun:test"
import { semanticTokenContract } from "./index"

describe("Semantic Token Contract", () => {
	it("carries a version number", () => {
		expect(typeof semanticTokenContract.version).toBe("number")
		expect(semanticTokenContract.version).toBeGreaterThanOrEqual(1)
	})

	it("starts with the shadcn role set under dotted names", () => {
		expect(semanticTokenContract.roles.map((role) => role.name)).toEqual([
			"color.background",
			"color.foreground",
			"color.card",
			"color.card.foreground",
			"color.popover",
			"color.popover.foreground",
			"color.primary",
			"color.primary.foreground",
			"color.secondary",
			"color.secondary.foreground",
			"color.muted",
			"color.muted.foreground",
			"color.accent",
			"color.accent.foreground",
			"color.destructive",
			"color.destructive.foreground",
			"color.border",
			"color.input",
			"color.ring",
		])
	})

	it("is closed: the Contract and every role are frozen", () => {
		expect(Object.isFrozen(semanticTokenContract)).toBe(true)
		expect(Object.isFrozen(semanticTokenContract.roles)).toBe(true)
		for (const role of semanticTokenContract.roles) {
			expect(Object.isFrozen(role)).toBe(true)
		}
	})
})
