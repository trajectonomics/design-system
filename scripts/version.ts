/**
 * Computes the version a package's release workflow publishes. Nobody edits
 * package.json "version" by hand: stable versions come from per-package git
 * tags (<prefix>X.Y.Z), the bump comes from conventional commits that touched
 * the package folder since that tag, and alphas count up from what is already
 * on npm.
 *
 *   bun scripts/version.ts --package-folder packages/core --tag-prefix core-v --channel alpha
 *   bun scripts/version.ts --package-folder packages/core --tag-prefix core-v --channel stable --bump major
 *
 * A package that ships files copied from outside its folder passes each source
 * with --extra-path (repeatable), so a change there counts as a change to the package.
 */
import { parseArgs } from "node:util"
import { $ } from "bun"
import { lastStableRelease, planRelease } from "./release-plan"
import type { BumpRequest, Channel } from "./semver"

interface PackageManifest {
	readonly name: string
}

async function gitTags(): Promise<string[]> {
	return (await $`git tag --list`.text()).split("\n").filter(Boolean)
}

async function commitsTouching(
	tag: string | null,
	packageFolder: string,
	extraPaths: readonly string[],
): Promise<string[]> {
	const range = tag ? `${tag}..HEAD` : "HEAD"
	const log = await $`git log ${range} --format=%B%x00 -- ${packageFolder} ${extraPaths}`.text()
	return log
		.split("\0")
		.map((message) => message.trim())
		.filter(Boolean)
}

async function publishedVersions(name: string): Promise<string[]> {
	const res = await $`npm view ${name} versions --json`.nothrow().quiet()
	if (res.exitCode !== 0) {
		if (res.stderr.toString().includes("E404")) return []
		throw new Error(`npm view ${name} failed:\n${res.stderr.toString()}`)
	}
	const parsed: unknown = JSON.parse(res.stdout.toString())
	return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
}

function required(value: string | undefined, flag: string): string {
	if (value === undefined || value.trim() === "") throw new Error(`${flag} is required`)
	return value
}

function parseChannel(value: string | undefined): Channel {
	if (value === "alpha" || value === "stable") return value
	throw new Error("--channel must be alpha or stable")
}

function parseBump(value: string | undefined): BumpRequest {
	if (value === "auto" || value === "major" || value === "minor" || value === "patch") return value
	throw new Error("--bump must be auto, major, minor or patch")
}

function parseExtraPaths(value: readonly string[] | undefined): string[] {
	return (value ?? []).map((path) => path.replace(/\/+$/, ""))
}

function isPackageManifest(value: unknown): value is PackageManifest {
	if (typeof value !== "object" || value === null || !("name" in value)) return false
	return typeof value.name === "string"
}

async function main(): Promise<void> {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			channel: { type: "string" },
			bump: { type: "string", default: "auto" },
			"package-folder": { type: "string" },
			"extra-path": { type: "string", multiple: true, default: [] },
			"tag-prefix": { type: "string" },
			"dry-run": { type: "boolean", default: false },
			json: { type: "boolean", default: false },
		},
		strict: true,
	})
	const channel = parseChannel(values.channel)
	const bump = parseBump(values.bump)
	const packageFolder = required(values["package-folder"], "--package-folder").replace(/\/+$/, "")
	const tagPrefix = required(values["tag-prefix"], "--tag-prefix")

	const lastRelease = lastStableRelease(await gitTags(), tagPrefix)
	const extraPaths = parseExtraPaths(values["extra-path"])
	const commits = await commitsTouching(lastRelease?.tag ?? null, packageFolder, extraPaths)
	const manifest: unknown = await Bun.file(`${packageFolder}/package.json`).json()
	if (!isPackageManifest(manifest)) {
		throw new Error(`${packageFolder}/package.json does not declare a package name`)
	}
	const published = channel === "alpha" ? await publishedVersions(manifest.name) : []
	const plan = planRelease({ channel, bump, tagPrefix, lastRelease, commits, published })
	if (plan === null) {
		if (!values["dry-run"]) {
			throw new Error(
				`Nothing to release: no commits touched ${[packageFolder, ...extraPaths].join(", ")} since ${lastRelease?.tag ?? "the first commit"}`,
			)
		}
		console.log(values.json ? "null" : "none")
		return
	}
	console.log(values.json ? JSON.stringify(plan) : plan.version)
}

if (import.meta.main) await main()
