import { describe, expect, it } from "bun:test"
import type { PrimitiveTokenProps, TokenType } from "./index"
import { createPrimitiveToken, DomainError, DomainErrorCode } from "./index"

describe("Primitive Tokens", () => {
	it("holds a literal value and is frozen", () => {
		const token = createPrimitiveToken({
			name: " color.white ",
			type: "color",
			value: " #ffffff ",
		})
		expect(token).toEqual({ name: "color.white", type: "color", value: "#ffffff" })
		expect(Object.isFrozen(token)).toBe(true)
	})

	it("does not mutate the caller-supplied object", () => {
		const props = { name: " color.white ", type: "color" as const, value: " #ffffff " }
		createPrimitiveToken(props)
		expect(props).toEqual({ name: " color.white ", type: "color", value: " #ffffff " })
	})

	it("accepts a length value and a font family value", () => {
		const length = createPrimitiveToken({ name: "space.4", type: "length", value: "1rem" })
		const fontFamily = createPrimitiveToken({
			name: "font.sans",
			type: "fontFamily",
			value: '"Berkeley Mono", ui-monospace, monospace',
		})
		expect(length.value).toBe("1rem")
		expect(fontFamily.value).toBe('"Berkeley Mono", ui-monospace, monospace')
	})
})

const validValues: readonly PrimitiveTokenProps[] = [
	{ name: "color.a", type: "color", value: "#3b82f6" },
	{ name: "color.b", type: "color", value: "#3b82f6cc" },
	{ name: "color.c", type: "color", value: "oklch(0.62 0.19 259)" },
	{ name: "space.a", type: "length", value: "0" },
	{ name: "space.b", type: "length", value: "-0.5rem" },
	{ name: "font.a", type: "fontFamily", value: "ui-monospace" },
	{ name: "font.b", type: "fontFamily", value: '"Berkeley Mono", monospace' },
]

const invalidValues: readonly PrimitiveTokenProps[] = [
	{ name: "color.a", type: "color", value: "red" },
	{ name: "color.b", type: "color", value: "color.neutral.900" },
	{ name: "color.c", type: "color", value: "rgb(foo)" },
	{ name: "color.d", type: "color", value: "rgb(0 0 0); }" },
	{ name: "color.e", type: "color", value: "url(#ffffff)" },
	{ name: "space.a", type: "length", value: "#ffffff" },
	{ name: "space.b", type: "length", value: "4" },
	{ name: "font.a", type: "fontFamily", value: "#ffffff" },
	{ name: "font.b", type: "fontFamily", value: "Inter; color: red" },
	{ name: "font.c", type: "fontFamily", value: "Inter } body { color: red" },
]

describe("Primitive Token rules", () => {
	for (const props of validValues) {
		it(`accepts the ${props.type} value ${props.value}`, () => {
			expect(createPrimitiveToken(props).value).toBe(props.value)
		})
	}

	for (const props of invalidValues) {
		it(`rejects the ${props.type} value ${props.value}`, () => {
			expectDomainError(
				() => createPrimitiveToken(props),
				DomainErrorCode.INVALID_TOKEN_VALUE,
				"value",
			)
		})
	}

	it("rejects a blank name with INVALID_TOKEN_NAME on field name", () => {
		expectDomainError(
			() => createPrimitiveToken({ name: "   ", type: "color", value: "#ffffff" }),
			DomainErrorCode.INVALID_TOKEN_NAME,
			"name",
		)
	})

	it("rejects an unknown Token Type with INVALID_TOKEN_TYPE on field type", () => {
		expectDomainError(
			() =>
				createPrimitiveToken({
					name: "shadow.sm",
					type: "shadow" as TokenType,
					value: "0 1px 2px #000000",
				}),
			DomainErrorCode.INVALID_TOKEN_TYPE,
			"type",
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
