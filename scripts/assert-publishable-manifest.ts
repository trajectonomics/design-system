/**
 * Fails when a packed package.json carries a `workspace:` range in
 * `dependencies` or `peerDependencies`, which a consumer cannot resolve.
 *
 *   bun scripts/assert-publishable-manifest.ts <path to the packed package.json>
 */
import { workspaceRanges } from "./published-manifest"

async function main(): Promise<void> {
	const path = Bun.argv[2]
	if (path === undefined) {
		throw new Error("usage: bun scripts/assert-publishable-manifest.ts <packed package.json>")
	}
	const manifest: unknown = await Bun.file(path).json()
	const ranges = workspaceRanges(manifest)
	if (ranges.length > 0) {
		for (const { section, name, range } of ranges) {
			console.error(`${section}["${name}"] is ${range} in the published manifest`)
		}
		throw new Error("The published manifest carries workspace: ranges a consumer cannot resolve")
	}
	console.log(`${path}: dependencies and peerDependencies carry no workspace: ranges`)
}

if (import.meta.main) await main()
