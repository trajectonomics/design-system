import { expect } from "bun:test"
import { semanticTokenContract, type TokenType } from "@trajectonomics/design-system"
import { ThemeError, type ThemeErrorCode } from "./index"

const LITERAL_BY_TYPE: Readonly<Record<TokenType, string>> = {
	color: "#123456",
	length: "1rem",
	fontFamily: "Inter, sans-serif",
}

/** Literal values for every Contract role, built without using core's built-in Themes. */
export function tokensForContract(): Record<string, string> {
	const tokens: Record<string, string> = {}
	for (const role of semanticTokenContract.roles) {
		tokens[role.name] = LITERAL_BY_TYPE[role.type]
	}
	return tokens
}

/** Asserts that `run` throws a ThemeError carrying `code` and `field`. */
export function expectThemeError(run: () => unknown, code: ThemeErrorCode, field: string): void {
	let caught: unknown
	try {
		run()
	} catch (error) {
		caught = error
	}
	expect(caught).toBeInstanceOf(ThemeError)
	if (!(caught instanceof ThemeError)) {
		throw new Error("expected a ThemeError")
	}
	expect(caught.code).toBe(code)
	expect(caught.field).toBe(field)
}
