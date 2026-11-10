import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { workspaceRanges } from "./published-manifest"

const ASSERT_SCRIPT = resolve(import.meta.dir, "assert-publishable-manifest.ts")
const roots: string[] = []

function manifestFile(manifest: object): string {
	const root = mkdtempSync(join(tmpdir(), "design-system-manifest-"))
	roots.push(root)
	const path = join(root, "package.json")
	writeFileSync(path, JSON.stringify(manifest))
	return path
}

function assertPublishable(path: string): { exitCode: number; stdout: string; stderr: string } {
	const result = Bun.spawnSync(["bun", ASSERT_SCRIPT, path], { stdout: "pipe", stderr: "pipe" })
	return {
		exitCode: result.exitCode,
		stdout: result.stdout.toString(),
		stderr: result.stderr.toString(),
	}
}

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("workspaceRanges", () => {
	it("rejects a dependency whose range uses the workspace protocol", () => {
		expect(
			workspaceRanges({
				dependencies: { "@trajectonomics/design-system": "workspace:*" },
			}),
		).toEqual([
			{
				section: "dependencies",
				name: "@trajectonomics/design-system",
				range: "workspace:*",
			},
		])
	})

	it("rejects a peer dependency whose range uses the workspace protocol", () => {
		expect(
			workspaceRanges({
				peerDependencies: { "@trajectonomics/design-system-theme": "workspace:^" },
			}),
		).toEqual([
			{
				section: "peerDependencies",
				name: "@trajectonomics/design-system-theme",
				range: "workspace:^",
			},
		])
	})

	it("accepts a workspace range in devDependencies, which consumers never install", () => {
		expect(
			workspaceRanges({
				devDependencies: { "@trajectonomics/design-system": "workspace:*" },
			}),
		).toEqual([])
	})

	it("accepts a published range, including one on the alpha line", () => {
		expect(
			workspaceRanges({
				peerDependencies: { "@trajectonomics/design-system": "^0.1.0-alpha.0" },
			}),
		).toEqual([])
	})

	it("accepts a manifest that declares no dependencies at all", () => {
		expect(workspaceRanges({ name: "@trajectonomics/design-system" })).toEqual([])
	})
})

describe("assert-publishable-manifest", () => {
	it("fails and names the field when the packed manifest carries a workspace range", () => {
		const path = manifestFile({
			dependencies: { "@trajectonomics/design-system-theme": "workspace:*" },
		})

		const result = assertPublishable(path)

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain(
			'dependencies["@trajectonomics/design-system-theme"] is workspace:*',
		)
	})

	it("accepts the manifest the release workflow packs", () => {
		const path = manifestFile({
			peerDependencies: { "@trajectonomics/design-system": "^0.1.0-alpha.0" },
			devDependencies: { "@trajectonomics/design-system": "workspace:*" },
		})

		expect(assertPublishable(path).exitCode).toBe(0)
	})
})
