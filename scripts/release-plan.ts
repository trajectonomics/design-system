// Release planning for one workspace package: which tag is its last stable
// release, which bump its own commits ask for, and the version to publish.
// Pure: git and npm data arrive as arguments.

import {
	type Bump,
	type BumpRequest,
	bumpFromCommits,
	type Channel,
	nextAlpha,
	nextStable,
	parseStable,
	type StableParts,
} from "./semver"

/** The tag and version of a package's last stable release. */
export interface StableRelease {
	readonly tag: string
	readonly version: string
}

/** Everything the planner needs to know, already scoped to one package. */
export interface ReleaseRequest {
	readonly channel: Channel
	readonly bump: BumpRequest
	readonly tagPrefix: string
	readonly lastRelease: StableRelease | null
	readonly commits: readonly string[]
	readonly published: readonly string[]
}

/** The version to publish and, for a stable release, the tag to create. */
export interface ReleasePlan {
	readonly channel: Channel
	/** The bump the commits ask for; `version` applies the 0.x major-to-minor rule. */
	readonly bump: Bump
	readonly lastTag: string | null
	readonly version: string
	readonly tag: string | null
}

/** Highest stable release carrying `tagPrefix`; prereleases and other packages are ignored. */
export function lastStableTag(tags: readonly string[], tagPrefix: string): StableRelease | null {
	let last: StableRelease | null = null
	let lastParts: StableParts | null = null
	for (const tag of tags) {
		if (!tag.startsWith(tagPrefix)) continue
		const version = tag.slice(tagPrefix.length)
		const parts = parseStable(version)
		if (parts === null) continue
		if (lastParts === null || compareParts(parts, lastParts) > 0) {
			last = Object.freeze({ tag, version })
			lastParts = parts
		}
	}
	return last
}

function compareParts(a: StableParts, b: StableParts): number {
	return a.major - b.major || a.minor - b.minor || a.patch - b.patch
}

/**
 * Version for one package, or null when no commit touched it since
 * `lastRelease`. Alphas count up from what is published; a stable release
 * produces its tag.
 */
export function planRelease(request: ReleaseRequest): ReleasePlan | null {
	if (request.commits.length === 0) return null
	const explicit = request.bump !== "auto"
	const bump = explicit ? request.bump : bumpFromCommits(request.commits)
	const base = nextStable(request.lastRelease?.version ?? null, bump, explicit)
	const lastTag = request.lastRelease?.tag ?? null
	if (request.channel === "stable") {
		const tag = `${request.tagPrefix}${base}`
		return Object.freeze({ channel: "stable", bump, lastTag, version: base, tag })
	}
	const version = nextAlpha(base, request.published)
	return Object.freeze({ channel: "alpha", bump, lastTag, version, tag: null })
}
