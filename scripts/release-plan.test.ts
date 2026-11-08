import { describe, expect, it } from "bun:test"
import { lastStableRelease, planRelease } from "./release-plan"

const coreRequest = {
	channel: "stable" as const,
	bump: "auto" as const,
	tagPrefix: "core-v",
	lastRelease: { tag: "core-v0.1.0", version: "0.1.0" },
	published: [] as string[],
}

describe("lastStableRelease", () => {
	it("reads the highest stable release of its own package, numerically", () => {
		const tags = ["v9.9.9", "core-v0.9.0", "core-v0.10.0", "core-v0.1.0", "theme-v5.0.0"]
		expect(lastStableRelease(tags, "core-v")).toEqual({ tag: "core-v0.10.0", version: "0.10.0" })
	})

	it("ignores prerelease tags and other package prefixes", () => {
		expect(lastStableRelease(["core-v2.0.0-alpha.1", "theme-v3.0.0"], "core-v")).toBeNull()
		expect(lastStableRelease([], "core-v")).toBeNull()
	})

	it("returns a frozen release", () => {
		expect(Object.isFrozen(lastStableRelease(["core-v1.0.0"], "core-v"))).toBe(true)
	})
})

describe("planRelease", () => {
	it("bumps from the commits that touched the package since its last tag", () => {
		const plan = planRelease({ ...coreRequest, commits: ["fix(core): guard", "feat(core): token"] })
		expect(plan?.version).toBe("0.2.0")
		expect(plan?.tag).toBe("core-v0.2.0")
	})

	it("keeps an inferred breaking change on 0.x as a minor bump", () => {
		const plan = planRelease({
			...coreRequest,
			lastRelease: { tag: "core-v0.4.1", version: "0.4.1" },
			commits: ["refactor(core)!: drop"],
		})
		expect(plan?.bump).toBe("major")
		expect(plan?.version).toBe("0.5.0")
	})

	it("counts the next alpha from the versions published for this package", () => {
		const plan = planRelease({
			...coreRequest,
			channel: "alpha",
			commits: ["feat(core): token"],
			published: ["0.1.0", "0.2.0-alpha.0", "0.2.0-alpha.1"],
		})
		expect(plan?.version).toBe("0.2.0-alpha.2")
		expect(plan?.tag).toBeNull()
	})

	it("starts alpha counting after the last stable release", () => {
		const plan = planRelease({
			...coreRequest,
			channel: "alpha",
			commits: ["fix(core): guard"],
			published: ["0.1.0", "0.1.1-alpha.0"],
		})
		expect(plan?.version).toBe("0.1.1-alpha.1")
	})

	it("never regresses the base version while more commits arrive before a stable release", () => {
		const first = planRelease({ ...coreRequest, channel: "alpha", commits: ["fix(core): guard"] })
		const second = planRelease({
			...coreRequest,
			channel: "alpha",
			commits: ["fix(core): guard", "feat(core): token"],
		})
		const third = planRelease({
			...coreRequest,
			channel: "alpha",
			commits: ["fix(core): guard", "feat(core): token", "fix(core): later"],
			published: ["0.2.0-alpha.0"],
		})
		expect(first?.version).toBe("0.1.1-alpha.0")
		expect(second?.version).toBe("0.2.0-alpha.0")
		expect(third?.version).toBe("0.2.0-alpha.1")
	})

	it("returns a frozen plan", () => {
		const plan = planRelease({ ...coreRequest, commits: ["fix(core): guard"] })
		expect(Object.isFrozen(plan)).toBe(true)
	})

	it("releases nothing when no commit touched the package", () => {
		expect(planRelease({ ...coreRequest, commits: [] })).toBeNull()
	})
})
