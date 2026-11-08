/**
 * Computes the version a package's release workflow publishes. Nobody edits
 * package.json "version" by hand: stable versions come from per-package git
 * tags (<prefix>X.Y.Z), the bump comes from conventional commits that touched
 * the package folder since that tag, and alphas count up from what is already
 * on npm.
 *
 *   bun scripts/version.ts --package-dir packages/core --tag-prefix core-v --channel alpha
 *   bun scripts/version.ts --package-dir packages/core --tag-prefix core-v --channel stable --bump major
 */
import { parseArgs } from "node:util"
import { $ } from "bun"
import { lastStableTag, planRelease } from "./release-plan"
import type { BumpRequest, Channel } from "./semver"

interface PackageManifest {
	readonly name: string
}

async function gitTags(): Promise<string[]> {
	return (await $`git tag --list`.text()).split("\n").filter(Boolean)
}

async function commitsTouching(tag: string | null, packageDir: string): Promise<string[]> {
	const range = tag ? `${tag}..HEAD` : "HEAD"
	const log = await $`git log ${range} --format=%B%x00 -- ${packageDir}`.text()
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
			"package-dir": { type: "string" },
			"tag-prefix": { type: "string" },
			"dry-run": { type: "boolean", default: false },
			json: { type: "boolean", default: false },
		},
		strict: true,
	})
	const channel = parseChannel(values.channel)
	const bump = parseBump(values.bump)
	const packageDir = required(values["package-dir"], "--package-dir").replace(/\/+$/, "")
	const tagPrefix = required(values["tag-prefix"], "--tag-prefix")

	const lastRelease = lastStableTag(await gitTags(), tagPrefix)
	const commits = await commitsTouching(lastRelease?.tag ?? null, packageDir)
	const manifest: unknown = await Bun.file(`${packageDir}/package.json`).json()
	if (!isPackageManifest(manifest)) {
		throw new Error(`${packageDir}/package.json does not declare a package name`)
	}
	const published = channel === "alpha" ? await publishedVersions(manifest.name) : []
	const plan = planRelease({ channel, bump, tagPrefix, lastRelease, commits, published })
	if (plan === null) {
		if (!values["dry-run"]) {
			throw new Error(
				`Nothing to release: no commits touched ${packageDir} since ${lastRelease?.tag ?? "the first commit"}`,
			)
		}
		console.log(values.json ? "null" : "none")
		return
	}
	console.log(values.json ? JSON.stringify(plan) : plan.version)
}

if (import.meta.main) await main()
