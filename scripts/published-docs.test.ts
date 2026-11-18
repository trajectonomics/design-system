import { describe, expect, it } from "bun:test"
import { documentedTag, parseDocumentation, requestedPackages } from "./published-docs"

/** A Markdown document whose body is one fenced block of the given language. */
function fenced(language: string, body: string): string {
	return `# Document\n\n\`\`\`${language}\n${body}\n\`\`\`\n`
}

/** The documentation of one README built from a fenced block. */
function documentation(language: string, body: string) {
	return parseDocumentation([{ path: "README.md", markdown: fenced(language, body) }])
}

const THEME = "@trajectonomics/design-system-theme"
const ASSETS = "@trajectonomics/design-system-assets"
const CORE = "@trajectonomics/design-system"

describe("documented installs", () => {
	it("reads the tag on every install argument, and a bare package name as latest", () => {
		const docs = documentation("bash", `bun add ${CORE} ${THEME}@alpha`)

		expect(docs.installLines).toHaveLength(1)
		expect(docs.installLines[0]?.arguments).toEqual([
			{ name: CORE, tag: "latest" },
			{ name: THEME, tag: "alpha" },
		])
	})

	it("ignores a trailing comment on an install line", () => {
		const docs = documentation("bash", `bun add ${ASSETS}@alpha # only for the stylesheet below`)

		expect(docs.installLines[0]?.arguments).toEqual([{ name: ASSETS, tag: "alpha" }])
	})

	it("prefers the README's own tag when two READMEs disagree", () => {
		const docs = parseDocumentation([
			{ path: "README.md", markdown: fenced("bash", `bun add ${THEME}@alpha`) },
			{ path: "packages/theme/README.md", markdown: fenced("bash", `bun add ${THEME}`) },
		])

		expect(documentedTag(docs, THEME)).toBe("alpha")
		expect(documentedTag(docs, THEME, "README.md")).toBe("alpha")
		expect(documentedTag(docs, THEME, "packages/theme/README.md")).toBe("latest")
	})

	it("requests every install line's tag, so a tag no publish carries is still resolved", () => {
		const docs = parseDocumentation([
			{ path: "README.md", markdown: fenced("bash", `bun add ${THEME}@alpha`) },
			{ path: "packages/theme/README.md", markdown: fenced("bash", `bun add ${THEME}@beta`) },
		])

		expect(requestedPackages(docs)).toEqual([
			{ name: THEME, tag: "alpha" },
			{ name: THEME, tag: "beta" },
		])
	})

	it("requests the core package when a README prints its Contract version", () => {
		const docs = documentation("typescript", "console.log(semanticTokenContract.version) // 3")

		expect(requestedPackages(docs)).toEqual([{ name: CORE, tag: "latest" }])
	})
})

describe("documented specifiers", () => {
	it("reads a css import and a script import, and a bare package name as the entrypoint", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					`${fenced("css", `@import "${THEME}/themes/light.css";`)}\n` +
					`${fenced("typescript", `import { lightTheme } from "${CORE}"\nimport mark from "${ASSETS}/logo/mark.svg"`)}`,
			},
		])

		expect(docs.specifiers.map(({ packageName, subpath }) => ({ packageName, subpath }))).toEqual([
			{ packageName: THEME, subpath: "./themes/light.css" },
			{ packageName: CORE, subpath: "." },
			{ packageName: ASSETS, subpath: "./logo/mark.svg" },
		])
	})

	it("reads a subpath whose import specifier sits on a later line", () => {
		const docs = documentation(
			"typescript",
			`import markOnLight from\n  "${ASSETS}/logo/mark-on-light.svg"`,
		)

		expect(docs.specifiers.map(({ subpath }) => subpath)).toEqual(["./logo/mark-on-light.svg"])
	})

	it("reads a dynamic import and a stylesheet inside a Svelte block", () => {
		const docs = documentation(
			"svelte",
			`<script>\n  const theme = await import("${THEME}/themes/dark.css")\n</script>\n\n<style>\n  @import "${ASSETS}/fonts/brand.css";\n</style>`,
		)

		expect(docs.specifiers.map(({ subpath }) => subpath)).toEqual([
			"./themes/dark.css",
			"./fonts/brand.css",
		])
	})

	it("reads no relative path, URL or prose mention as a documented specifier", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown:
					`Import the \`./fonts/inter.css\` file, see https://example.com/${ASSETS}/logo/mark.svg.\n\n` +
					fenced("css", '@import "./local.css";'),
			},
		])

		expect(docs.specifiers).toEqual([])
	})
})

describe("documented Contract version", () => {
	it("reads the version a README prints next to semanticTokenContract.version, and its line", () => {
		const docs = documentation("typescript", "console.log(semanticTokenContract.version) // 3")

		expect(docs.contractVersions).toEqual([{ readme: "README.md", line: 4, version: 3 }])
	})

	it("collects the version each README prints", () => {
		const docs = parseDocumentation([
			{
				path: "README.md",
				markdown: fenced("typescript", "console.log(semanticTokenContract.version) // 3"),
			},
			{
				path: "packages/core/README.md",
				markdown: fenced("typescript", "console.log(semanticTokenContract.version) // 2"),
			},
		])

		expect(docs.contractVersions).toEqual([
			{ readme: "README.md", line: 4, version: 3 },
			{ readme: "packages/core/README.md", line: 4, version: 2 },
		])
	})

	it("reports no Contract version when no README prints one", () => {
		expect(documentation("typescript", "console.log(lightTheme.name)").contractVersions).toEqual([])
	})
})
