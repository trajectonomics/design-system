import { describe, expect, it } from "bun:test"
import { createDesignToken, DomainError, DomainErrorCode } from "./index"

describe("createDesignToken", () => {
	it("creates a frozen Design Token with trimmed name and value", () => {
		const token = createDesignToken({ name: " color.blue.500 ", value: " #3b82f6 " })
		expect(token.name).toBe("color.blue.500")
		expect(token.value).toBe("#3b82f6")
		expect(Object.isFrozen(token)).toBe(true)
	})

	it("rejects a blank name with INVALID_TOKEN_NAME on field name", () => {
		try {
			createDesignToken({ name: "   ", value: "#000" })
			throw new Error("expected createDesignToken to throw")
		} catch (err) {
			expect(err).toBeInstanceOf(DomainError)
			expect((err as DomainError).code).toBe(DomainErrorCode.INVALID_TOKEN_NAME)
			expect((err as DomainError).field).toBe("name")
		}
	})
})
