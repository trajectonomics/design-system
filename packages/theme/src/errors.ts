/** Machine-readable rejection codes for Theme definition. */
export enum ThemeErrorCode {
	INVALID_THEME_NAME = "INVALID_THEME_NAME",
	MISSING_TOKENS_SECTION = "MISSING_TOKENS_SECTION",
	MISSING_CONTRACT_ROLE = "MISSING_CONTRACT_ROLE",
	UNKNOWN_CONTRACT_ROLE = "UNKNOWN_CONTRACT_ROLE",
	WRONG_TOKEN_TYPE = "WRONG_TOKEN_TYPE",
	UNSAFE_TOKEN_VALUE = "UNSAFE_TOKEN_VALUE",
}

/** Error thrown when a Theme violates a domain rule; carries a distinct `code` and the offending `field`. */
export class ThemeError extends Error {
	readonly code: ThemeErrorCode
	readonly field: string

	constructor(code: ThemeErrorCode, field: string, message: string) {
		super(`[${code}]: ${message}`)
		this.name = "ThemeError"
		this.code = code
		this.field = field
	}
}
