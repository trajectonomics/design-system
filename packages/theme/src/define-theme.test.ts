import { describe, expect, it } from "bun:test"
import { semanticTokenContract } from "@trajectonomics/design-system"
import { defineTheme } from "./index"
import { tokensForContract } from "./theme.support"

describe("defineTheme", () => {
	it("accepts a custom Theme with a name beyond light and dark", () => {
		const tokens = tokensForContract()
		const theme = defineTheme({ name: "brand-ocean", tokens })
		expect(theme.name).toBe("brand-ocean")
		expect(theme.contractVersion).toBe(semanticTokenContract.version)
		expect(theme.tokens).toEqual(tokens)
	})

	it("returns a frozen Theme with frozen tokens", () => {
		const theme = defineTheme({ name: "brand-ocean", tokens: tokensForContract() })
		expect(Object.isFrozen(theme)).toBe(true)
		expect(Object.isFrozen(theme.tokens)).toBe(true)
	})

	it("never mutates the caller's Theme input", () => {
		const tokens = Object.freeze(tokensForContract())
		const input = Object.freeze({ name: "brand-ocean", tokens })
		const theme = defineTheme(input)
		expect(theme.tokens).not.toBe(tokens)
		expect(tokens).toEqual(tokensForContract())
	})

	it("reads the Contract version instead of assuming the input's version", () => {
		const tokens = tokensForContract()
		const input = {
			name: "brand-future",
			contractVersion: semanticTokenContract.version + 1,
			tokens,
		}
		const theme = defineTheme(input)
		expect(theme.contractVersion).toBe(semanticTokenContract.version)
	})
})
