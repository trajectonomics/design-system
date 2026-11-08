import { afterEach, describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

const VERSION_SCRIPT = resolve(import.meta.dir, "version.ts")
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
		const cwd = repoWithFiles(["packages/core/package.json", "packages/theme/package.json"])
		git(cwd, "add", ".")
		git(cwd, "commit", "-q", "-m", "chore: scaffold packages")
		git(cwd, "tag", "core-v0.1.0")
		commit(cwd, "feat(theme): add theme data", "packages/theme/src/index.ts")
		commit(cwd, "fix(core): guard token name", "packages/core/src/index.ts")

		const args = ["--package", "packages/core", "--tag-prefix", "core-v", "--channel", "stable"]
		expect(version(cwd, ...args)).toBe("0.1.1")
		expect(JSON.parse(version(cwd, ...args, "--json"))).toMatchObject({
			version: "0.1.1",
			tag: "core-v0.1.1",
		})
	})

	it("reads only the tags carrying that package's prefix", () => {
		const cwd = repoWithFiles(["packages/core/package.json"])
		git(cwd, "add", ".")
		git(cwd, "commit", "-q", "-m", "chore: scaffold package")
		git(cwd, "tag", "theme-v2.0.0")
		commit(cwd, "feat(core): add tokens", "packages/core/src/index.ts")

		const args = ["--package", "packages/core", "--tag-prefix", "core-v", "--channel", "stable"]
		expect(version(cwd, ...args)).toBe("0.1.0")
	})

	it("reports nothing to release in a dry run when the folder is unchanged", () => {
		const cwd = repoWithFiles(["packages/core/package.json"])
		git(cwd, "add", ".")
		git(cwd, "commit", "-q", "-m", "chore: scaffold package")
		git(cwd, "tag", "core-v0.1.0")
		commit(cwd, "docs: describe the package", "README.md")

		const args = ["--package", "packages/core", "--tag-prefix", "core-v", "--channel", "stable"]
		expect(version(cwd, ...args, "--dry-run")).toBe("none")
		expect(() => version(cwd, ...args)).toThrow("Nothing to release")
	})
})
