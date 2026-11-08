import { describe, expect, it } from "bun:test"
import { lastStableTag, planRelease, releaseTag } from "./release-plan"

const stable = {
	channel: "stable" as const,
	bump: "auto" as const,
	tagPrefix: "core-v",
	lastTag: "core-v0.1.0",
	published: [] as string[],
}

describe("lastStableTag", () => {
	it("reads the highest stable release of its own package, numerically", () => {
		const tags = ["v9.9.9", "core-v0.9.0", "core-v0.10.0", "core-v0.1.0", "theme-v5.0.0"]
		expect(lastStableTag(tags, "core-v")).toBe("core-v0.10.0")
	})

	it("ignores prerelease tags and other package prefixes", () => {
		expect(lastStableTag(["core-v2.0.0-alpha.1", "theme-v3.0.0"], "core-v")).toBeNull()
		expect(lastStableTag([], "core-v")).toBeNull()
	})
})

describe("releaseTag", () => {
	it("prefixes a stable version with the calling package's tag prefix", () => {
		expect(releaseTag("core-v", "1.2.3")).toBe("core-v1.2.3")
		expect(releaseTag("theme-v", "1.2.3")).toBe("theme-v1.2.3")
	})
})

describe("planRelease", () => {
	it("bumps from the commits that touched the package since its last tag", () => {
		const plan = planRelease({ ...stable, commits: ["fix(core): guard", "feat(core): token"] })
		expect(plan?.version).toBe("0.2.0")
		expect(plan?.tag).toBe("core-v0.2.0")
	})

	it("keeps an inferred breaking change on 0.x as a minor bump", () => {
		const plan = planRelease({
			...stable,
			lastTag: "core-v0.4.1",
			commits: ["refactor(core)!: drop"],
		})
		expect(plan?.bump).toBe("major")
		expect(plan?.version).toBe("0.5.0")
	})

	it("counts the next alpha from the versions published for this package", () => {
		const plan = planRelease({
			...stable,
			channel: "alpha",
			commits: ["feat(core): token"],
			published: ["0.1.0", "0.2.0-alpha.0", "0.2.0-alpha.1"],
		})
		expect(plan?.version).toBe("0.2.0-alpha.2")
		expect(plan?.tag).toBeNull()
	})

	it("releases nothing when no commit touched the package", () => {
		expect(planRelease({ ...stable, commits: [] })).toBeNull()
	})
})
