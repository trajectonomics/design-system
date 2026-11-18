import { describe, expect, it } from "bun:test"
import { documentedTag, parseDocumentation, requestedPackages } from "./published-docs"
import {
	checkDocumentation,
	contractVersionOfModule,
	formatFinding,
	type PackedPackage,
} from "./published-docs-check"

/** A Markdown document whose body is one fenced block of the given language. */
function fenced(language: string, body: string): string {
	return `# Document\n\n\`\`\`${language}\n${body}\n\`\`\`\n`
}

/** The documentation of one README built from a fenced block. */
function documentation(language: string, body: string) {
	return parseDocumentation([{ path: "README.md", markdown: fenced(language, body) }])
}

/** A README whose install block names `theme@alpha` and whose body follows in one more block. */
function themePage(language: string, body: string) {
	return parseDocumentation([
		{
			path: "README.md",
			markdown:
				fenced("bash", "bun add @trajectonomics/design-system-theme@alpha") +
				fenced(language, body),
		},
	])
}

function formatAll(findings: ReturnType<typeof checkDocumentation>): readonly string[] {
	return findings.map(formatFinding)
}

/** The published `theme` tarball a test compares against, unless it overrides a field. */
function theme(overrides: Partial<PackedPackage> = {}): PackedPackage {
	return {
		name: "@trajectonomics/design-system-theme",
		tag: "alpha",
		version: "0.1.0-alpha.5",
		exports: { "./themes/light.css": "./dist/themes/light.css" },
		files: ["dist/themes/light.css"],
		...overrides,
	}
}

/** The published `core` tarball a test compares against, unless it overrides a field. */
function core(overrides: Partial<PackedPackage> = {}): PackedPackage {
	return {
		name: "@trajectonomics/design-system",
		tag: "alpha",
		version: "0.1.0-alpha.4",
		exports: { ".": { import: { default: "./dist/index.mjs" } } },
		files: ["dist/index.mjs"],
		contractVersion: 3,
		...overrides,
	}
}

describe("documented installs", () => {
	it("reads the tag on every install argument, and a bare package name as latest", () => {
		const docs = documentation(
			"bash",
			"bun add @trajectonomics/design-system @trajectonomics/design-system-theme@alpha",
		)

		expect(docs.installLines).toHaveLength(1)
		expect(docs.installLines[0]?.arguments).toEqual([
			{ name: "@trajectonomics/design-system", tag: "latest" },
			{ name: "@trajectonomics/design-system-theme", tag: "alpha" },
		])
	})

	it("ignores a trailing comment on an install line", () => {
		const docs = documentation(
			"bash",
			"bun add @trajectonomics/design-system-assets@alpha # only for the stylesheet below",
		)

		expect(docs.installLines[0]?.arguments).toEqual([
			{ name: "@trajectonomics/design-system-assets", tag: "alpha" },
		])
	})

	it("resolves a documented subpath at the tag its install line names", () => {
		const docs = documentation("bash", "bun add @trajectonomics/design-system-theme@alpha")

		expect(documentedTag(docs, "@trajectonomics/design-system-theme")).toBe("alpha")
		expect(documentedTag(docs, "@trajectonomics/design-system-assets")).toBe("latest")
	})

	it("reads a subpath from a css import and a typescript import, and no bare package name", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					`${fenced("css", '@import "@trajectonomics/design-system-theme/themes/light.css";')}\n` +
					`${fenced("typescript", 'import { lightTheme } from "@trajectonomics/design-system"\nimport mark from "@trajectonomics/design-system-assets/logo/mark.svg"')}`,
			},
		])

		expect(docs.specifiers.map(({ packageName, subpath }) => ({ packageName, subpath }))).toEqual([
			{
				packageName: "@trajectonomics/design-system-theme",
				subpath: "./themes/light.css",
			},
			{
				packageName: "@trajectonomics/design-system-assets",
				subpath: "./logo/mark.svg",
			},
		])
	})

	it("requests every install line's tag, so a tag no publish carries is still resolved", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown: fenced("bash", "bun add @trajectonomics/design-system-theme@alpha"),
			},
			{
				path: "packages/theme/README.md",
				markdown: fenced("bash", "bun add @trajectonomics/design-system-theme@beta"),
			},
		])

		expect(requestedPackages(docs)).toEqual([
			{ name: "@trajectonomics/design-system-theme", tag: "alpha" },
			{ name: "@trajectonomics/design-system-theme", tag: "beta" },
		])
	})

	it("reads a subpath whose import specifier sits on a later line", () => {
		const docs = documentation(
			"typescript",
			'import markOnLight from\n  "@trajectonomics/design-system-assets/logo/mark-on-light.svg"',
		)

		expect(docs.specifiers.map(({ packageName, subpath }) => ({ packageName, subpath }))).toEqual([
			{
				packageName: "@trajectonomics/design-system-assets",
				subpath: "./logo/mark-on-light.svg",
			},
		])
	})

	it("requests the core package when the README prints its Contract version", () => {
		const docs = documentation("typescript", "console.log(semanticTokenContract.version) // 3")

		expect(requestedPackages(docs)).toEqual([
			{ name: "@trajectonomics/design-system", tag: "latest" },
		])
	})

	it("reads no relative path, URL or prose mention as a documented subpath", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					"Import the `./fonts/inter.css` file, see https://example.com/@trajectonomics/design-system/logo/mark.svg.\n\n" +
					fenced("css", '@import "./local.css";'),
			},
		])

		expect(docs.specifiers).toEqual([])
	})
})

describe("documented Contract version", () => {
	it("reads the version the README prints next to semanticTokenContract.version", () => {
		const docs = documentation("typescript", "console.log(semanticTokenContract.version) // 3")

		expect(docs.contractVersion).toEqual({ readme: "README.md", version: 3 })
	})

	it("reports no Contract version when the README prints none", () => {
		expect(documentation("typescript", "console.log(lightTheme.name)").contractVersion).toBe(
			undefined,
		)
	})
})

describe("checking the documentation against a tag", () => {
	it("finds nothing when every documented install, subpath and Contract version exists", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					`${fenced("bash", "bun add @trajectonomics/design-system-theme@alpha @trajectonomics/design-system@alpha")}\n` +
					`${fenced("css", '@import "@trajectonomics/design-system-theme/themes/light.css";')}\n` +
					`${fenced("typescript", "console.log(semanticTokenContract.version) // 3")}`,
			},
		])

		expect(checkDocumentation(docs, [theme(), core()])).toEqual([])
	})

	it("fails naming the package, the subpath and the tag when no export resolves it", () => {
		const docs = themePage("css", '@import "@trajectonomics/design-system-theme/themes/dark.css";')

		const findings = formatAll(checkDocumentation(docs, [theme()]))

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain("@trajectonomics/design-system-theme@alpha")
		expect(findings[0]).toContain("./themes/dark.css")
	})

	it("fails naming the package, the subpath and the tag when the export names a file the tarball does not ship", () => {
		const docs = themePage("css", '@import "@trajectonomics/design-system-theme/themes/light.css";')

		const findings = formatAll(checkDocumentation(docs, [theme({ files: [] })]))

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain("@trajectonomics/design-system-theme@alpha")
		expect(findings[0]).toContain("./themes/light.css")
		expect(findings[0]).toContain("dist/themes/light.css")
	})

	it("fails when the printed Contract version differs from the published module's", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					`${fenced("bash", "bun add @trajectonomics/design-system@alpha")}\n` +
					`${fenced("typescript", "console.log(semanticTokenContract.version) // 2")}`,
			},
		])

		const findings = formatAll(checkDocumentation(docs, [core()]))

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain("Contract version 2")
		expect(findings[0]).toContain("@trajectonomics/design-system@alpha")
		expect(findings[0]).toContain("3")
	})

	it("fails when two install lines in one README name different tags", () => {
		const docs = documentation(
			"bash",
			"bun add @trajectonomics/design-system-theme@alpha\nbun add @trajectonomics/design-system-theme@latest",
		)

		const findings = formatAll(checkDocumentation(docs, [theme()]))

		expect(findings).toHaveLength(1)
		expect(findings[0]).toContain("@trajectonomics/design-system-theme@latest")
		expect(findings[0]).toContain("@trajectonomics/design-system-theme@alpha")
	})

	it("checks a package the branch has in flight against the local build it is passed", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					fenced("bash", "bun add @trajectonomics/design-system-assets@alpha") +
					fenced("css", '@import "@trajectonomics/design-system-assets/fonts/brand.css";'),
			},
		])
		const local = {
			name: "@trajectonomics/design-system-assets",
			tag: "alpha",
			version: "0.0.0-development",
			exports: { "./fonts/brand.css": "./dist/fonts/brand.css" },
			files: ["dist/fonts/brand.css"],
		} satisfies PackedPackage

		expect(checkDocumentation(docs, [local])).toEqual([])
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
