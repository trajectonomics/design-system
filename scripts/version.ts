// Per-package release version calculator
/**
 * Computes the version a package's Release workflow publishes. Nobody edits
 * package.json "version" by hand: stable versions come from per-package git
 * tags (<prefix>X.Y.Z), the bump comes from conventional commits that touched
 * the package folder since that tag, and alphas count up from what is already
 * on npm.
 *
 *   bun scripts/version.ts --package packages/core --tag-prefix core-v --channel alpha
 *   bun scripts/version.ts --package packages/core --tag-prefix core-v --channel stable --bump major
 */
import { parseArgs } from "node:util"
import { $ } from "bun"
import { lastStableTag, planRelease } from "./release-plan"
import type { Bump } from "./semver"

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

function parseBump(value: string | undefined): Bump | "auto" {
	if (value === "auto" || value === "major" || value === "minor" || value === "patch") return value
	throw new Error("--bump must be auto, major, minor or patch")
}

async function main(): Promise<void> {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			channel: { type: "string" },
			bump: { type: "string", default: "auto" },
			package: { type: "string" },
			"tag-prefix": { type: "string" },
			"dry-run": { type: "boolean", default: false },
			json: { type: "boolean", default: false },
		},
		strict: true,
	})
	const channel = values.channel
	if (channel !== "alpha" && channel !== "stable")
		throw new Error("--channel must be alpha or stable")
	const bump = parseBump(values.bump)
	const packageDir = required(values.package, "--package").replace(/\/+$/, "")
	const tagPrefix = required(values["tag-prefix"], "--tag-prefix")

	const lastTag = lastStableTag(await gitTags(), tagPrefix)
	const commits = await commitsTouching(lastTag, packageDir)
	const pkg = (await Bun.file(`${packageDir}/package.json`).json()) as { name: string }
	const published = channel === "alpha" ? await publishedVersions(pkg.name) : []
	const plan = planRelease({ channel, bump, tagPrefix, lastTag, commits, published })
	if (plan === null) {
		if (!values["dry-run"]) {
			throw new Error(
				`Nothing to release: no commits touched ${packageDir} since ${lastTag ?? "the first commit"}`,
			)
		}
		console.log(values.json ? "null" : "none")
		return
	}
	console.log(values.json ? JSON.stringify(plan) : plan.version)
}

if (import.meta.main) await main()
