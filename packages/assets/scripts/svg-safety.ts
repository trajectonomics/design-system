/**
 * The rules an SVG must satisfy before it may ship as a Brand Asset. A file
 * that carries active content or needs the network cannot be a safe static
 * asset, so the build refuses it instead of publishing it.
 */

/** A rule every shipped SVG must satisfy. */
export type SvgRule = "viewBox" | "script" | "external-reference" | "embedded-font"

/** One broken rule, with what the SVG does to break it. */
export interface SvgFinding {
	readonly rule: SvgRule
	readonly detail: string
}

const HREF_REFERENCE = /\b(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi
const CSS_REFERENCE = /\burl\(\s*["']?([^"')]*)["']?\s*\)/gi
const EVENT_HANDLER = /\son[a-z]+\s*=/i

/** Every reference that points outside the file itself. */
function externalReferences(svg: string): readonly string[] {
	const references: string[] = []
	for (const match of svg.matchAll(HREF_REFERENCE)) {
		const reference = (match[1] ?? "").trim()
		if (reference !== "" && !reference.startsWith("#")) references.push(`href="${reference}"`)
	}
	for (const match of svg.matchAll(CSS_REFERENCE)) {
		const reference = (match[1] ?? "").trim()
		if (reference !== "" && !reference.startsWith("#")) references.push(`url(${reference})`)
	}
	return references
}

/** Every rule the SVG breaks, in rule order; an empty list means it may ship. */
export function inspectSvg(svg: string): readonly SvgFinding[] {
	const findings: SvgFinding[] = []
	if (!/\bviewBox\s*=/.test(svg)) {
		findings.push({ rule: "viewBox", detail: "no viewBox attribute" })
	}
	if (/<script\b/i.test(svg) || /<foreignObject\b/i.test(svg) || EVENT_HANDLER.test(svg)) {
		findings.push({ rule: "script", detail: "carries active content" })
	}
	const references = externalReferences(svg)
	if (references.length > 0) {
		findings.push({ rule: "external-reference", detail: references.join(", ") })
	}
	if (/@font-face/i.test(svg) || /<font\b/i.test(svg)) {
		findings.push({ rule: "embedded-font", detail: "embeds a font" })
	}
	return Object.freeze(findings)
}
