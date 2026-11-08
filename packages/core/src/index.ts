/**
 * Pure design token model for @trajectonomics/design-system.
 * Invariant: All token objects are frozen, deterministic, and free of I/O.
 */

export type { SemanticTokenContract, SemanticTokenName, SemanticTokenRole } from "./contract"
export { semanticTokenContract } from "./contract"
export type { DesignToken } from "./design-token"
export { DomainError, DomainErrorCode } from "./errors"
export type { PrimitiveToken, PrimitiveTokenProps } from "./primitive-token"
export { createPrimitiveToken } from "./primitive-token"
export type { PrimitiveTokenPalette } from "./primitives"
export { primitiveTokens } from "./primitives"
export type { SemanticToken, SemanticTokenProps } from "./semantic-token"
export { createSemanticToken } from "./semantic-token"
export type { Theme } from "./theme"
export { themes } from "./themes"
export { darkTheme } from "./themes/dark"
export { lightTheme } from "./themes/light"
export type { TokenType } from "./token-type"
