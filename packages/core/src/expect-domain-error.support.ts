import { expect } from "bun:test"
import { DomainError, type DomainErrorCode } from "./index"

/** Asserts that `run` throws a DomainError carrying `code` and `field`. */
export function expectDomainError(run: () => unknown, code: DomainErrorCode, field: string): void {
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
