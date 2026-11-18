import { describe, expect, it } from "bun:test"
import { parseDocumentation } from "./published-docs"
import {
	checkDocumentation,
	contractVersionOfModule,
	formatFinding,
	type PackedPackage,
	resolveExportTarget,
} from "./published-docs-check"

const THEME = "@trajectonomics/design-system-theme"
const CORE = "@trajectonomics/design-system"

/** A Markdown document whose body is one fenced block of the given language. */
function fenced(language: string, body: string): string {
	return `# Document\n\n\`\`\`${language}\n${body}\n\`\`\`\n`
}

/** A README that installs `theme@alpha` and then documents the given block. */
function themePage(language: string, body: string) {
	return parseDocumentation([
		{
			path: "README.md",
			markdown: fenced("bash", `bun add ${THEME}@alpha`) + fenced(language, body),
		},
	])
}

function formatAll(findings: ReturnType<typeof checkDocumentation>): readonly string[] {
	return findings.map(formatFinding)
}

/** The published `theme` tarball a test compares against, unless it overrides a field. */
function theme(overrides: Partial<PackedPackage> = {}): PackedPackage {
	return {
		name: THEME,
		tag: "alpha",
		exports: { "./themes/light.css": "./dist/themes/light.css" },
		files: ["dist/themes/light.css"],
		...overrides,
	}
}

/** The published `core` tarball a test compares against, unless it overrides a field. */
function core(overrides: Partial<PackedPackage> = {}): PackedPackage {
	return {
		name: CORE,
		tag: "alpha",
		exports: { ".": { import: { default: "./dist/index.mjs" } } },
		files: ["dist/index.mjs"],
		contractVersion: 3,
		...overrides,
	}
}

/** A README that installs `core` at `alpha` and prints a Contract version. */
function corePage(version: number) {
	return parseDocumentation([
		{
			path: "README.md",
			markdown:
				fenced("bash", `bun add ${CORE}@alpha`) +
				fenced("typescript", `console.log(semanticTokenContract.version) // ${version}`),
		},
	])
}

describe("checking the documentation against a tag", () => {
	it("finds nothing when every documented install, specifier and Contract version exists", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					fenced("bash", `bun add ${THEME}@alpha ${CORE}@alpha`) +
					fenced("css", `@import "${THEME}/themes/light.css";`) +
					fenced("typescript", "console.log(semanticTokenContract.version) // 3"),
			},
		])

		expect(checkDocumentation(docs, [theme(), core()])).toEqual([])
	})

	it("fails naming the package, the specifier and the tag when no export resolves it", () => {
		const findings = formatAll(
			checkDocumentation(themePage("css", `@import "${THEME}/themes/dark.css";`), [theme()]),
		)

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain(`${THEME}@alpha`)
		expect(findings[0]).toContain("./themes/dark.css")
		expect(findings[0]).toMatch(/^README\.md:\d+: /)
	})

	it("fails naming the package, the specifier and the tag when the export names a file the tarball does not ship", () => {
		const findings = formatAll(
			checkDocumentation(themePage("css", `@import "${THEME}/themes/light.css";`), [
				theme({ files: [] }),
			]),
		)

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain(`${THEME}@alpha`)
		expect(findings[0]).toContain("./themes/light.css")
		expect(findings[0]).toContain("dist/themes/light.css")
	})

	it("fails on a bare package import when the package has no entrypoint export", () => {
		const docs = themePage("typescript", `import { Button } from "${THEME}"`)

		const findings = formatAll(
			checkDocumentation(docs, [
				theme({ exports: { "./themes/light.css": "./dist/themes/light.css" } }),
			]),
		)

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain(`${THEME}@alpha`)
		expect(findings[0]).toContain('"."')
	})

	it("checks a README's specifier at the tag that README installs, not another README's tag", () => {
		const docs = parseDocumentation([
			{ path: "README.md", markdown: fenced("bash", `bun add ${THEME}@alpha`) },
			{
				path: "packages/theme/README.md",
				markdown:
					fenced("bash", `bun add ${THEME}`) + fenced("css", `@import "${THEME}/typography.css";`),
			},
		])

		const findings = formatAll(
			checkDocumentation(docs, [theme(), theme({ tag: "latest", exports: {}, files: [] })]),
		)

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain(`${THEME}@latest`)
		expect(findings[0]).toContain("./typography.css")
	})

	it("fails when the printed Contract version differs from the published module's", () => {
		const findings = formatAll(checkDocumentation(corePage(2), [core()]))

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain("Contract version 2")
		expect(findings[0]).toContain(`${CORE}@alpha`)
		expect(findings[0]).toContain("3")
	})

	it("fails when two install lines in one README name different tags", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown: fenced("bash", `bun add ${THEME}@alpha\nbun add ${THEME}@latest`),
			},
		])

		const findings = formatAll(checkDocumentation(docs, [theme()]))

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain(`${THEME}@latest`)
		expect(findings[0]).toContain(`${THEME}@alpha`)
		expect(findings[0]).toMatch(/^README\.md:\d+: names/)
	})
})

describe("resolving a package export", () => {
	it("resolves a subpath through a condition object to its import file", () => {
		const exports = {
			".": { import: { default: "./dist/index.mjs" }, require: "./dist/index.cjs" },
		}

		expect(resolveExportTarget(exports, ".")).toBe("./dist/index.mjs")
	})

	it("resolves no target for a subpath the map does not name", () => {
		expect(
			resolveExportTarget({ "./themes/light.css": "./dist/themes/light.css" }, "./nope.css"),
		).toBe(undefined)
	})
})

describe("a published module's Contract version", () => {
	it("reads semanticTokenContract.version from an imported module", () => {
		expect(contractVersionOfModule({ semanticTokenContract: { version: 3 } })).toBe(3)
	})

	it("reports no version from a module that does not export the Contract", () => {
		expect(contractVersionOfModule({ lightTheme: { name: "light" } })).toBe(undefined)
	})
})
