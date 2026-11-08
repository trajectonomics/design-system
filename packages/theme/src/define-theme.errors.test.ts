import { describe, it } from "bun:test"
import { defineTheme, ThemeErrorCode, type ThemeInput } from "./index"
import { expectThemeError, tokensForContract } from "./theme.support"

describe("defineTheme validation", () => {
	it("rejects a Theme without a tokens section with its own code", () => {
		const input = { name: "custom" } as unknown as ThemeInput
		expectThemeError(() => defineTheme(input), ThemeErrorCode.MISSING_TOKENS_SECTION, "tokens")
	})

	it("rejects a null Theme input as an invalid name", () => {
		expectThemeError(
			() => defineTheme(null as unknown as ThemeInput),
			ThemeErrorCode.INVALID_THEME_NAME,
			"name",
		)
	})

	it("rejects a Theme missing a Contract role with the caller's input path", () => {
		const tokens = tokensForContract()
		delete tokens["color.ring"]
		expectThemeError(
			() => defineTheme({ name: "custom", tokens }),
			ThemeErrorCode.MISSING_CONTRACT_ROLE,
			"tokens.color.ring",
		)
	})

	it("rejects a role outside the closed Contract", () => {
		const tokens = { ...tokensForContract(), "color.sidebar": "#123456" }
		expectThemeError(
			() => defineTheme({ name: "custom", tokens }),
			ThemeErrorCode.UNKNOWN_CONTRACT_ROLE,
			"tokens.color.sidebar",
		)
	})

	it.each(["1rem", "Inter, sans-serif", 42])("rejects the wrongly typed value %p", (wrong) => {
		const tokens = {
			...tokensForContract(),
			"color.background": wrong,
		} as unknown as Record<string, string>
		expectThemeError(
			() => defineTheme({ name: "custom", tokens }),
			ThemeErrorCode.WRONG_TOKEN_TYPE,
			"tokens.color.background",
		)
	})

	it.each(["#123456;", "#123456; }", "#123456 }", "url(https://example.com/x.png)"])(
		"rejects the unsafe value %p before checking its Token Type",
		(unsafe) => {
			const tokens = { ...tokensForContract(), "color.background": unsafe }
			expectThemeError(
				() => defineTheme({ name: "custom", tokens }),
				ThemeErrorCode.UNSAFE_TOKEN_VALUE,
				"tokens.color.background",
			)
		},
	)

	it.each(["", "   "])("rejects the blank Theme name %p", (name) => {
		expectThemeError(
			() => defineTheme({ name, tokens: tokensForContract() }),
			ThemeErrorCode.INVALID_THEME_NAME,
			"name",
		)
	})
})
