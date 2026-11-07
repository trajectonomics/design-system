/**
 * Pure design token model for @trajectonomics/design-system.
 * Invariant: All token objects are frozen, deterministic, and free of I/O.
 */

/** Machine-readable rejection codes for Design Token construction. */
export enum DomainErrorCode {
	INVALID_TOKEN_NAME = "INVALID_TOKEN_NAME",
}

/** Error thrown when input violates a domain rule; carries a distinct `code`. */
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

/** Input for creating a Design Token. */
export interface DesignTokenProps {
	readonly name: string
	readonly value: string
}

/** A named, platform-agnostic design decision with a typed value. */
export interface DesignToken {
	readonly name: string
	readonly value: string
}

/** Creates a frozen Design Token, rejecting an empty name. */
export function createDesignToken(props: DesignTokenProps): DesignToken {
	if (props.name.trim().length === 0) {
		throw new DomainError(
			DomainErrorCode.INVALID_TOKEN_NAME,
			"name",
			"Design Token name must be non-empty.",
		)
	}
	return Object.freeze({
		name: props.name.trim(),
		value: props.value.trim(),
	})
}
