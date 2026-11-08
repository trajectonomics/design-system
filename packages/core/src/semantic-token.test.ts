import { describe, expect, it } from "bun:test"
import { expectDomainError } from "./expect-domain-error.support"
import type { SemanticTokenName } from "./index"
import { createPrimitiveToken, createSemanticToken, DomainErrorCode } from "./index"

const neutral900 = createPrimitiveToken({
	name: "color.neutral.900",
	type: "color",
	value: "#171717",
})

describe("Semantic Tokens", () => {
	it("aliases one Primitive Token and resolves its literal value", () => {
		const token = createSemanticToken({ name: "color.primary", primitive: neutral900 })
		expect(token).toEqual({
			name: "color.primary",
			type: "color",
			primitiveName: "color.neutral.900",
			value: "#171717",
		})
		expect(Object.isFrozen(token)).toBe(true)
	})

	it("does not mutate the caller-supplied object", () => {
		const props = { name: "color.primary" as const, primitive: neutral900 }
		createSemanticToken(props)
		expect(props).toEqual({ name: "color.primary", primitive: neutral900 })
	})

	it("rejects a name outside the Semantic Token Contract", () => {
		expectDomainError(
			() =>
				createSemanticToken({
					name: "color.sidebar" as SemanticTokenName,
					primitive: neutral900,
				}),
			DomainErrorCode.UNKNOWN_CONTRACT_ROLE,
			"name",
		)
	})

	it("rejects a Primitive Token whose Token Type does not match the role", () => {
		const length = createPrimitiveToken({ name: "space.4", type: "length", value: "1rem" })
		expectDomainError(
			() => createSemanticToken({ name: "color.primary", primitive: length }),
			DomainErrorCode.ROLE_TYPE_MISMATCH,
			"primitive",
		)
	})

	it("rejects a Semantic Token with a blank name", () => {
		expectDomainError(
			() => createSemanticToken({ name: "  " as SemanticTokenName, primitive: neutral900 }),
			DomainErrorCode.INVALID_TOKEN_NAME,
			"name",
		)
	})
})
