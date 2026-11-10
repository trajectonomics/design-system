// The manifest npm publishes must carry real version ranges in `dependencies`
// and `peerDependencies`: a consumer cannot resolve the `workspace:` protocol.
// `devDependencies` are never installed from the registry, so they may keep it.
// Pure: data in, data out.

/** Manifest sections a consumer installs; a `workspace:` range here breaks the package. */
const CONSUMER_SECTIONS = ["dependencies", "peerDependencies"] as const

/** A dependency of the published manifest that a consumer cannot resolve. */
export interface WorkspaceRange {
	readonly section: (typeof CONSUMER_SECTIONS)[number]
	readonly name: string
	readonly range: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Every `dependencies` or `peerDependencies` entry whose range uses the `workspace:` protocol. */
export function workspaceRanges(manifest: unknown): readonly WorkspaceRange[] {
	if (!isRecord(manifest)) return Object.freeze([])
	const ranges: WorkspaceRange[] = []
	for (const section of CONSUMER_SECTIONS) {
		const dependencies = manifest[section]
		if (!isRecord(dependencies)) continue
		for (const [name, range] of Object.entries(dependencies)) {
			if (typeof range === "string" && range.startsWith("workspace:")) {
				ranges.push(Object.freeze({ section, name, range }))
			}
		}
	}
	return Object.freeze(ranges)
}
