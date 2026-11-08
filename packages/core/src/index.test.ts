import { describe, expect, it } from "bun:test"
import { primitiveTokens, semanticTokenContract, themes } from "./index"

describe("built-in Primitive Tokens", () => {
	it("are frozen literal tokens that never reference another token", () => {
		const tokens = Object.values(primitiveTokens)
		const names = new Set(tokens.map((token) => token.name))
		expect(tokens.length).toBeGreaterThan(0)
		for (const token of tokens) {
			expect(Object.isFrozen(token)).toBe(true)
			expect(token.value.startsWith("#")).toBe(true)
			expect(names.has(token.value)).toBe(false)
		}
	})

	it("are frozen as one palette", () => {
		expect(Object.isFrozen(primitiveTokens)).toBe(true)
	})
})

describe("built-in Themes", () => {
	it("resolves every role in the Contract in every built-in Theme", () => {
		const roleNames = semanticTokenContract.roles.map((role) => role.name)
		for (const theme of themes) {
			expect(Object.keys(theme.tokens).sort()).toEqual([...roleNames].sort())
		}
	})

	it("resolves every role to a literal colour", () => {
		for (const theme of themes) {
			for (const value of Object.values(theme.tokens)) {
				expect(value).toMatch(/^#[0-9a-f]{6}$/i)
			}
		}
	})

	it("treats light and dark as ordinary frozen Themes", () => {
		expect(themes.map((theme) => theme.name)).toEqual(["light", "dark"])
		for (const theme of themes) {
			expect(Object.isFrozen(theme)).toBe(true)
			expect(Object.isFrozen(theme.tokens)).toBe(true)
			expect(theme.contractVersion).toBe(semanticTokenContract.version)
		}
	})
})
