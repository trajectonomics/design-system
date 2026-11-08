import { type SemanticTokenName, semanticTokenContract } from "./contract"
import { DomainError, DomainErrorCode } from "./errors"
import type { PrimitiveToken } from "./primitive-token"
import type { TokenType } from "./token-type"

/** Input for creating a Semantic Token: one Contract role and the Primitive Token it aliases. */
export interface SemanticTokenProps {
	readonly name: SemanticTokenName
	readonly primitive: PrimitiveToken
}

/** A Semantic Token: a purpose-named Contract role that aliases one Primitive Token. */
export interface SemanticToken {
	readonly name: string
	readonly type: TokenType
	readonly primitiveName: string
	readonly value: string
}

/** Creates a frozen Semantic Token for a Contract role, aliasing one Primitive Token. */
export function createSemanticToken(props: SemanticTokenProps): SemanticToken {
	const name = props.name.trim()
	if (name.length === 0) {
		throw new DomainError(
			DomainErrorCode.INVALID_TOKEN_NAME,
			"name",
			"Semantic Token name must be non-empty.",
		)
	}
	const role = semanticTokenContract.roles.find((candidate) => candidate.name === name)
	if (role === undefined) {
		throw new DomainError(
			DomainErrorCode.UNKNOWN_CONTRACT_ROLE,
			"name",
			`"${name}" is not a role in the Semantic Token Contract.`,
		)
	}
	if (role.type !== props.primitive.type) {
		throw new DomainError(
			DomainErrorCode.ROLE_TYPE_MISMATCH,
			"primitive",
			`Role "${name}" accepts a ${role.type} value, but "${props.primitive.name}" is a ${props.primitive.type} Primitive Token.`,
		)
	}
	return Object.freeze({
		name,
		type: role.type,
		primitiveName: props.primitive.name,
		value: props.primitive.value,
	})
}
