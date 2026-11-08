import type { PrimitiveToken } from "./primitive-token"
import type { SemanticToken } from "./semantic-token"

/** A Design Token: either a Primitive Token or a Semantic Token. */
export type DesignToken = PrimitiveToken | SemanticToken
