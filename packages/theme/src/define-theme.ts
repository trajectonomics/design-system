import type { Theme } from "@trajectonomics/design-system"
import { semanticTokenContract } from "@trajectonomics/design-system"
import type { ThemeInput } from "./theme-input"
import { validateTheme } from "./validation"

/** Defines a Theme from a name and a literal value for every role in the Semantic Token Contract. */
export function defineTheme(input: ThemeInput): Theme {
	const validated = validateTheme(input)
	return Object.freeze({
		name: validated.name,
		contractVersion: semanticTokenContract.version,
		tokens: Object.freeze({ ...validated.tokens }),
	})
}
