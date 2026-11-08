import {
	createPrimitiveToken,
	DomainError,
	DomainErrorCode,
	type SemanticTokenRole,
	semanticTokenContract,
} from "@trajectonomics/design-system"
import { ThemeError, ThemeErrorCode } from "./errors"
import type { ThemeInput } from "./theme-input"

const TOKENS_FIELD = "tokens"
const UNSAFE_VALUE = /[;}]|url\s*\(/i
const ROLE_NAMES = new Set(semanticTokenContract.roles.map((role) => role.name))

function tokenField(roleName: string): string {
	return `${TOKENS_FIELD}.${roleName}`
}

function assertThemeName(name: unknown): void {
	if (typeof name === "string" && name.trim().length > 0) return
	throw new ThemeError(
		ThemeErrorCode.INVALID_THEME_NAME,
		"name",
		"Theme name must be a non-empty string.",
	)
}

function assertSafeValue(value: string, field: string): void {
	if (!UNSAFE_VALUE.test(value)) return
	throw new ThemeError(
		ThemeErrorCode.UNSAFE_TOKEN_VALUE,
		field,
		"A Theme token value must not contain characters that can break out of a CSS declaration.",
	)
}

function assertTokenValue(role: SemanticTokenRole, value: unknown, field: string): string {
	if (typeof value !== "string") {
		throw new ThemeError(ThemeErrorCode.WRONG_TOKEN_TYPE, field, `"${role.name}" takes a string.`)
	}
	assertSafeValue(value, field)
	try {
		return createPrimitiveToken({ name: role.name, type: role.type, value }).value
	} catch (error) {
		if (error instanceof DomainError && error.code === DomainErrorCode.INVALID_TOKEN_VALUE) {
			throw new ThemeError(
				ThemeErrorCode.WRONG_TOKEN_TYPE,
				field,
				`"${role.name}" takes a ${role.type} value.`,
			)
		}
		throw error
	}
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
	return typeof value === "object" && value !== null
}

/** Validates a Theme against the Contract, returning its normalized values. */
export function validateTheme(input: ThemeInput): ThemeInput {
	assertThemeName(input.name)
	if (!isRecord(input.tokens)) {
		throw new ThemeError(
			ThemeErrorCode.MISSING_CONTRACT_ROLE,
			TOKENS_FIELD,
			"A Theme must have a tokens section.",
		)
	}
	const tokens: Record<string, string> = {}
	for (const role of semanticTokenContract.roles) {
		const field = tokenField(role.name)
		if (!Object.hasOwn(input.tokens, role.name)) {
			throw new ThemeError(
				ThemeErrorCode.MISSING_CONTRACT_ROLE,
				field,
				`Theme is missing the Contract role "${role.name}".`,
			)
		}
		tokens[role.name] = assertTokenValue(role, input.tokens[role.name], field)
	}
	for (const name of Object.keys(input.tokens)) {
		if (!ROLE_NAMES.has(name)) {
			throw new ThemeError(
				ThemeErrorCode.UNKNOWN_CONTRACT_ROLE,
				tokenField(name),
				`"${name}" is not a role in the Semantic Token Contract.`,
			)
		}
	}
	return { name: input.name, tokens }
}
