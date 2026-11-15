import { describe, expect, it } from "bun:test"
import { createPrimitiveToken, primitiveTokens, semanticTokenContract, themes } from "./index"

describe("built-in Primitive Tokens", () => {
	it("are frozen literal tokens that never reference another token", () => {
		const tokens = Object.values(primitiveTokens)
		const names = new Set(tokens.map((token) => token.name))
		expect(tokens.length).toBeGreaterThan(0)
		for (const token of tokens) {
			expect(Object.isFrozen(token)).toBe(true)
			expect(names.has(token.value)).toBe(false)
		}
	})

	it("hold one distinct value each", () => {
		const tokens = Object.values(primitiveTokens)
		expect(new Set(tokens.map((token) => token.value)).size).toBe(tokens.length)
	})

	it("hold the 16 length values and 2 font stacks Contract v2 needs", () => {
		const tokens = Object.values(primitiveTokens)
		const valuesOf = (type: string) =>
			tokens
				.filter((token) => token.type === type)
				.map((token) => token.value)
				.sort()
		expect(valuesOf("length")).toEqual(
			[
				"0.25rem",
				"0.375rem",
				"0.5rem",
				"0.75rem",
				"0.875rem",
				"1rem",
				"1.125rem",
				"1.25rem",
				"1.5rem",
				"1.75rem",
				"1.875rem",
				"2rem",
				"2.25rem",
				"2.5rem",
				"3rem",
				"4rem",
			].sort(),
		)
		expect(valuesOf("fontFamily")).toEqual(
			[
				'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
				'ui-sans-serif, system-ui, "Segoe UI", "Leelawadee UI", Thonburi, "Noto Sans Thai", sans-serif',
			].sort(),
		)
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

	it("resolves every role to a literal its role's Token Type accepts", () => {
		for (const theme of themes) {
			for (const role of semanticTokenContract.roles) {
				const value = theme.tokens[role.name]!
				expect(createPrimitiveToken({ name: role.name, type: role.type, value }).value).toBe(value)
			}
		}
	})

	it("resolves the length and font family roles to the same values in every Theme", () => {
		const nonColorRoles = semanticTokenContract.roles.filter((role) => role.type !== "color")
		const [first, ...rest] = themes
		for (const theme of rest) {
			for (const role of nonColorRoles) {
				expect(theme.tokens[role.name]).toBe(first!.tokens[role.name])
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
