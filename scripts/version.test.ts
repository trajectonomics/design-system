import { afterEach, describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

const VERSION_SCRIPT = resolve(import.meta.dir, "version.ts")
const CORE_ARGS = [
	"--package-folder",
	"packages/core",
	"--tag-prefix",
	"core-v",
	"--channel",
	"stable",
]
const repos: string[] = []

function git(cwd: string, ...args: string[]): string {
	const result = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
	if (result.exitCode !== 0) throw new Error(result.stderr.toString())
	return result.stdout.toString().trim()
}

function write(cwd: string, file: string, content: string): void {
	const path = join(cwd, file)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, content)
}

function commit(cwd: string, message: string, file: string): void {
	write(cwd, file, `${message}\n`)
	git(cwd, "add", ".")
	git(cwd, "commit", "-q", "-m", message)
}

function repoWithFiles(files: readonly string[]): string {
	const cwd = mkdtempSync(join(tmpdir(), "design-system-version-"))
	repos.push(cwd)
	git(cwd, "init", "-q")
	git(cwd, "config", "user.email", "release@example.com")
	git(cwd, "config", "user.name", "Release Test")
	for (const file of files)
		write(cwd, file, JSON.stringify({ name: "@test/package", version: "0.0.0" }))
	return cwd
}

function taggedPackage(tag: string, files = ["packages/core/package.json"]): string {
	const cwd = repoWithFiles(files)
	git(cwd, "add", ".")
	git(cwd, "commit", "-q", "-m", "chore: scaffold packages")
	git(cwd, "tag", tag)
	return cwd
}

function version(cwd: string, ...args: string[]): string {
	const result = Bun.spawnSync(["bun", VERSION_SCRIPT, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	})
	if (result.exitCode !== 0) throw new Error(result.stderr.toString())
	return result.stdout.toString().trim()
}

afterEach(() => {
	for (const cwd of repos.splice(0)) rmSync(cwd, { recursive: true, force: true })
})

describe("version for one workspace package", () => {
	it("counts only commits that touched that package's folder", () => {
		const cwd = taggedPackage("core-v0.1.0", [
			"packages/core/package.json",
			"packages/theme/package.json",
		])
		commit(cwd, "feat(theme): add theme data", "packages/theme/src/index.ts")
		commit(cwd, "fix(core): guard token name", "packages/core/src/index.ts")

		expect(version(cwd, ...CORE_ARGS)).toBe("0.1.1")
		expect(JSON.parse(version(cwd, ...CORE_ARGS, "--json"))).toMatchObject({
			version: "0.1.1",
			tag: "core-v0.1.1",
		})
	})

	it("reads only the tags carrying that package's prefix", () => {
		const cwd = taggedPackage("theme-v2.0.0")
		commit(cwd, "feat(core): add tokens", "packages/core/src/index.ts")

		expect(version(cwd, ...CORE_ARGS)).toBe("0.1.0")
	})

	it("reports nothing to release in a dry run when the folder is unchanged", () => {
		const cwd = taggedPackage("core-v0.1.0")
		commit(cwd, "docs: describe the package", "README.md")

		expect(version(cwd, ...CORE_ARGS, "--dry-run")).toBe("none")
	})

	it("refuses a real release when the folder is unchanged", () => {
		const cwd = taggedPackage("core-v0.1.0")
		commit(cwd, "docs: describe the package", "README.md")

		expect(() => version(cwd, ...CORE_ARGS)).toThrow("Nothing to release")
	})
})

describe("version argument rules", () => {
	it("requires a channel of alpha or stable", () => {
		expect(() =>
			version(
				repoWithFiles([]),
				"--package-folder",
				"packages/core",
				"--tag-prefix",
				"core-v",
				"--channel",
				"beta",
			),
		).toThrow("--channel must be alpha or stable")
	})

	it("requires a bump of auto, major, minor or patch", () => {
		expect(() => version(repoWithFiles([]), ...CORE_ARGS, "--bump", "huge")).toThrow(
			"--bump must be auto, major, minor or patch",
		)
	})

	it("requires a package folder", () => {
		expect(() =>
			version(repoWithFiles([]), "--tag-prefix", "core-v", "--channel", "stable"),
		).toThrow("--package-folder is required")
	})

	it("requires a tag prefix", () => {
		expect(() =>
			version(repoWithFiles([]), "--package-folder", "packages/core", "--channel", "stable"),
		).toThrow("--tag-prefix is required")
	})
})
