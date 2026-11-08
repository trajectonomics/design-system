import { expect } from "bun:test"
import { semanticTokenContract } from "@trajectonomics/design-system"
import { ThemeError, type ThemeErrorCode } from "./index"

/** Literal values for every Contract role, built without using core's built-in Themes. */
export function tokensForContract(): Record<string, string> {
	const tokens: Record<string, string> = {}
	for (const role of semanticTokenContract.roles) {
		if (role.type === "color") tokens[role.name] = "#123456"
		else if (role.type === "length") tokens[role.name] = "1rem"
		else tokens[role.name] = "Inter, sans-serif"
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
