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

function validateThemeName(name: unknown): string {
	if (typeof name === "string" && name.trim().length > 0) return name.trim()
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
export function validateTheme(input: unknown): ThemeInput {
	const candidate = isRecord(input) ? input : undefined
	const name = validateThemeName(candidate?.["name"])
	const tokens = candidate?.["tokens"]
	if (!isRecord(tokens)) {
		throw new ThemeError(
			ThemeErrorCode.MISSING_TOKENS_SECTION,
			TOKENS_FIELD,
			"A Theme must have a tokens section.",
		)
	}
	const validated: Record<string, string> = {}
	for (const role of semanticTokenContract.roles) {
		const field = tokenField(role.name)
		if (!Object.hasOwn(tokens, role.name)) {
			throw new ThemeError(
				ThemeErrorCode.MISSING_CONTRACT_ROLE,
				field,
				`Theme is missing the Contract role "${role.name}".`,
			)
		}
		validated[role.name] = assertTokenValue(role, tokens[role.name], field)
	}
	for (const roleName of Object.keys(tokens)) {
		if (!ROLE_NAMES.has(roleName)) {
			throw new ThemeError(
				ThemeErrorCode.UNKNOWN_CONTRACT_ROLE,
				tokenField(roleName),
				`"${roleName}" is not a role in the Semantic Token Contract.`,
			)
		}
	}
	return { name, tokens: validated }
}
