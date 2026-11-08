/** Machine-readable rejection codes for Design Token construction. */
export enum DomainErrorCode {
	INVALID_TOKEN_NAME = "INVALID_TOKEN_NAME",
	INVALID_TOKEN_TYPE = "INVALID_TOKEN_TYPE",
	INVALID_TOKEN_VALUE = "INVALID_TOKEN_VALUE",
	UNKNOWN_CONTRACT_ROLE = "UNKNOWN_CONTRACT_ROLE",
	ROLE_TYPE_MISMATCH = "ROLE_TYPE_MISMATCH",
}

/** Error thrown when input violates a domain rule; carries a distinct `code` and the offending `field`. */
export class DomainError extends Error {
	readonly code: DomainErrorCode
	readonly field: string

	constructor(code: DomainErrorCode, field: string, message: string) {
		super(`[${code}]: ${message}`)
		this.name = "DomainError"
		this.code = code
		this.field = field
	}
}
