import { describe, expect, it } from "bun:test"
import type { SemanticTokenName } from "./index"
import { createPrimitiveToken, createSemanticToken, DomainError, DomainErrorCode } from "./index"

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
			primitive: "color.neutral.900",
			value: "#171717",
		})
		expect(Object.isFrozen(token)).toBe(true)
	})

	it("does not mutate the caller-supplied object", () => {
		const props = { name: "color.primary" as const, primitive: neutral900 }
		createSemanticToken(props)
		expect(props).toEqual({ name: "color.primary", primitive: neutral900 })
	})

	it("rejects a name that is not in the Contract with UNKNOWN_CONTRACT_ROLE on field name", () => {
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

	it("rejects a Primitive Token of the wrong Token Type with ROLE_TYPE_MISMATCH on field primitive", () => {
		const length = createPrimitiveToken({ name: "space.4", type: "length", value: "1rem" })
		expectDomainError(
			() => createSemanticToken({ name: "color.primary", primitive: length }),
			DomainErrorCode.ROLE_TYPE_MISMATCH,
			"primitive",
		)
	})

	it("rejects a blank name with INVALID_TOKEN_NAME on field name", () => {
		expectDomainError(
			() => createSemanticToken({ name: "  " as SemanticTokenName, primitive: neutral900 }),
			DomainErrorCode.INVALID_TOKEN_NAME,
			"name",
		)
	})
})

function expectDomainError(run: () => unknown, code: DomainErrorCode, field: string): void {
	let caught: unknown
	try {
		run()
	} catch (error) {
		caught = error
	}
	expect(caught).toBeInstanceOf(DomainError)
	if (!(caught instanceof DomainError)) {
		throw new Error("expected a DomainError")
	}
	expect(caught.code).toBe(code)
	expect(caught.field).toBe(field)
}
