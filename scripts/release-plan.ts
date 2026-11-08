// Release planning for one workspace package: which tag is its last stable
// release, which bump its own commits ask for, and the version to publish.
// Pure: git and npm data arrive as arguments.

import {
	type Bump,
	bumpFromCommits,
	type Channel,
	nextAlpha,
	nextStable,
	parseStable,
	type StableParts,
} from "./semver"

/** Everything the planner needs to know, already scoped to one package. */
export interface ReleaseRequest {
	readonly channel: Channel
	readonly bump: Bump | "auto"
	readonly tagPrefix: string
	readonly lastTag: string | null
	readonly commits: readonly string[]
	readonly published: readonly string[]
}

/** The version to publish and, for a stable release, the tag to create. */
export interface ReleasePlan {
	readonly channel: Channel
	readonly bump: Bump
	readonly lastTag: string | null
	readonly version: string
	readonly tag: string | null
}

/** Highest stable tag carrying `tagPrefix`; prereleases and other packages are ignored. */
export function lastStableTag(tags: readonly string[], tagPrefix: string): string | null {
	let last: string | null = null
	let lastParts: StableParts | null = null
	for (const tag of tags) {
		if (!tag.startsWith(tagPrefix)) continue
		const parts = parseStable(tag.slice(tagPrefix.length))
		if (parts === null) continue
		if (lastParts === null || compareParts(parts, lastParts) > 0) {
			last = tag
			lastParts = parts
		}
	}
	return last
}

function compareParts(a: StableParts, b: StableParts): number {
	return a.major - b.major || a.minor - b.minor || a.patch - b.patch
}

/** The git tag for a stable release of one package, e.g. core-v1.2.3. */
export function releaseTag(tagPrefix: string, version: string): string {
	return `${tagPrefix}${version}`
}

/**
 * Version for one package, or null when no commit touched it since `lastTag`.
 * Alphas count up from what is published; a stable release produces its tag.
 */
export function planRelease(request: ReleaseRequest): ReleasePlan | null {
	if (request.commits.length === 0) return null
	const lastVersion =
		request.lastTag === null ? null : request.lastTag.slice(request.tagPrefix.length)
	const explicit = request.bump !== "auto"
	const bump = explicit ? request.bump : bumpFromCommits(request.commits)
	const base = nextStable(lastVersion, bump, explicit)
	if (request.channel === "stable") {
		const tag = releaseTag(request.tagPrefix, base)
		return { channel: "stable", bump, lastTag: request.lastTag, version: base, tag }
	}
	const version = nextAlpha(base, request.published)
	return { channel: "alpha", bump, lastTag: request.lastTag, version, tag: null }
}
