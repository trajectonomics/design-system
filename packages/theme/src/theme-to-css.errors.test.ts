import { describe, it } from "bun:test"
import { semanticTokenContract, type Theme } from "@trajectonomics/design-system"
import { ThemeErrorCode, themeToCss } from "./index"
import { expectThemeError, tokensForContract } from "./theme.support"

const CONTRACT_VERSION = semanticTokenContract.version

function themeWith(tokens: Record<string, string>, name = "custom"): Theme {
	return { name, contractVersion: CONTRACT_VERSION, tokens }
}

describe("Theme CSS rejection", () => {
	it("rejects a Theme missing a Contract role before producing CSS", () => {
		const tokens = tokensForContract()
		delete tokens["color.ring"]
		expectThemeError(
			() => themeToCss(themeWith(tokens)),
			ThemeErrorCode.MISSING_CONTRACT_ROLE,
			"tokens.color.ring",
		)
	})

	it("rejects a role outside the closed Contract", () => {
		const tokens = { ...tokensForContract(), "color.sidebar": "#123456" }
		expectThemeError(
			() => themeToCss(themeWith(tokens)),
			ThemeErrorCode.UNKNOWN_CONTRACT_ROLE,
			"tokens.color.sidebar",
		)
	})

	it("rejects a Theme without a tokens section", () => {
		const theme = { name: "custom", contractVersion: CONTRACT_VERSION } as unknown as Theme
		expectThemeError(() => themeToCss(theme), ThemeErrorCode.MISSING_TOKENS_SECTION, "tokens")
	})

	it.each(["#123456;", "#123456; }", "#123456 }", "url(https://example.com/x.png)"])(
		"rejects the unsafe value %p before producing CSS",
		(unsafe) => {
			expectThemeError(
				() => themeToCss(themeWith({ ...tokensForContract(), "color.background": unsafe })),
				ThemeErrorCode.UNSAFE_TOKEN_VALUE,
				"tokens.color.background",
			)
		},
	)

	it.each(["1rem", "Inter, sans-serif", 42])("rejects the wrongly typed value %p", (wrong) => {
		const tokens = {
			...tokensForContract(),
			"color.background": wrong,
		} as unknown as Record<string, string>
		expectThemeError(
			() => themeToCss(themeWith(tokens)),
			ThemeErrorCode.WRONG_TOKEN_TYPE,
			"tokens.color.background",
		)
	})

	it.each(["", "   "])("rejects the blank Theme name %p", (name) => {
		expectThemeError(
			() => themeToCss(themeWith(tokensForContract(), name)),
			ThemeErrorCode.INVALID_THEME_NAME,
			"name",
		)
	})
})
