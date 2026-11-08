// Semver rules shared by every package release: the bump a set of commit
// messages asks for, the next stable version, and the next alpha of a base.
// Pure: data in, data out.

/** Version part to increment. */
export type Bump = "major" | "minor" | "patch"

/** A requested bump: auto reads the commits, otherwise the caller decides. */
export type BumpRequest = Bump | "auto"

/** Release channel: alpha for every merge, stable for a manual release. */
export type Channel = "alpha" | "stable"

/** The three numeric parts of a stable version. */
export interface StableParts {
	readonly major: number
	readonly minor: number
	readonly patch: number
}

const STABLE = /^(\d+)\.(\d+)\.(\d+)$/
const BREAKING_SUBJECT = /^\w+(\([^)]*\))?!:/
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m
const FEAT = /^feat(\([^)]*\))?:/

/** Largest bump any of the commit messages asks for. Non-feat commits are a patch. */
export function bumpFromCommits(messages: readonly string[]): Bump {
	let bump: Bump = "patch"
	for (const message of messages) {
		if (BREAKING_SUBJECT.test(message) || BREAKING_FOOTER.test(message)) return "major"
		if (FEAT.test(message)) bump = "minor"
	}
	return bump
}

/** Parts of a stable version, or null for a prerelease or malformed version. */
export function parseStable(version: string): StableParts | null {
	const match = STABLE.exec(version)
	if (match === null) return null
	return Object.freeze({
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	})
}

/**
 * Next stable version after `last` (null = never released). While on 0.x an
 * inferred breaking change bumps minor, per semver's 0.x convention; pass
 * `explicit` to take a major bump literally (e.g. to cut 1.0.0).
 */
export function nextStable(last: string | null, bump: Bump, explicit = false): string {
	const parts = parseStable(last ?? "0.0.0")
	if (parts === null) throw new Error(`Last release is not a stable semver version: ${last}`)
	const { major, minor, patch } = parts
	const effective = bump === "major" && major === 0 && !explicit ? "minor" : bump
	switch (effective) {
		case "major":
			return `${major + 1}.0.0`
		case "minor":
			return `${major}.${minor + 1}.0`
		case "patch":
			return `${major}.${minor}.${patch + 1}`
	}
}

/** `<base>-alpha.<n>`, one past the highest alpha of `base` already published. */
export function nextAlpha(base: string, published: readonly string[]): string {
	const prefix = `${base}-alpha.`
	let next = 0
	for (const version of published) {
		if (!version.startsWith(prefix)) continue
		const n = Number(version.slice(prefix.length))
		if (Number.isInteger(n) && n >= next) next = n + 1
	}
	return `${prefix}${next}`
}
