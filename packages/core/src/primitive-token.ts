import { DomainError, DomainErrorCode } from "./errors"
import { isTokenType, isTokenValue, type TokenType } from "./token-type"

/** A Primitive Token: a raw, context-free value that never references another token. */
export interface PrimitiveToken {
	readonly name: string
	readonly type: TokenType
	readonly value: string
}

/** Input for creating a Primitive Token. */
export type PrimitiveTokenProps = PrimitiveToken

/** Creates a frozen Primitive Token, rejecting invalid names, Token Types or literal values. */
export function createPrimitiveToken(props: PrimitiveTokenProps): PrimitiveToken {
	const name = props.name.trim()
	if (name.length === 0) {
		throw new DomainError(
			DomainErrorCode.INVALID_TOKEN_NAME,
			"name",
			"Design Token name must be non-empty.",
		)
	}
	if (!isTokenType(props.type)) {
		throw new DomainError(
			DomainErrorCode.INVALID_TOKEN_TYPE,
			"type",
			'Token Type must be "color", "length" or "fontFamily".',
		)
	}
	const value = props.value.trim()
	if (!isTokenValue(props.type, value)) {
		throw new DomainError(
			DomainErrorCode.INVALID_TOKEN_VALUE,
			"value",
			`A ${props.type} Design Token value must be a literal ${props.type}.`,
		)
	}
	return Object.freeze({ name, type: props.type, value })
}
