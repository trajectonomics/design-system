/**
 * Reads what this repository's documentation installs and imports: every `bun add` line, every
 * package entrypoint or subpath a README imports, and the Semantic Token Contract version a README
 * prints. Pure: the Markdown of the READMEs in, the documented packages and subpaths out.
 */

/** The core package, whose Semantic Token Contract version the root README prints. */
export const CORE_PACKAGE = "@trajectonomics/design-system"

/** One README the check reads, with the path it is named by in a finding. */
export interface Readme {
	readonly path: string
	readonly markdown: string
}

/** One package of a `bun add` line, with the dist-tag the line names. */
export interface InstallArgument {
	readonly name: string
	readonly tag: string
}

/** A `bun add` line the documentation prints. */
export interface InstallLine {
	readonly readme: string
	readonly line: number
	readonly arguments: readonly InstallArgument[]
}

/** A package entrypoint or subpath a fenced CSS or script import names, such as `./themes/light.css`. */
export interface DocumentedSpecifier {
	readonly readme: string
	readonly line: number
	readonly packageName: string
	readonly subpath: string
}

/** The Semantic Token Contract version a README prints, and where it prints it. */
export interface DocumentedContractVersion {
	readonly readme: string
	readonly line: number
	readonly version: number
}

/** Everything the READMEs document, in the form the check compares. */
export interface Documentation {
	readonly installLines: readonly InstallLine[]
	readonly specifiers: readonly DocumentedSpecifier[]
	readonly contractVersions: readonly DocumentedContractVersion[]
}

function isDesignSystemPackage(name: string): boolean {
	return name === CORE_PACKAGE || name.startsWith(`${CORE_PACKAGE}-`)
}

interface Fence {
	readonly language: string
	readonly lines: readonly string[]
	readonly firstLine: number
}

/** The fenced code blocks of a Markdown document, in source order, with their first body line. */
function fencedBlocks(markdown: string): readonly Fence[] {
	const blocks: Fence[] = []
	for (const match of markdown.matchAll(
		/^[ \t]*```(\S*)[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*$/gm,
	)) {
		const start = match.index ?? 0
		blocks.push({
			language: (match[1] ?? "").toLowerCase(),
			lines: (match[2] ?? "").split("\n"),
			firstLine: markdown.slice(0, start).split("\n").length + 1,
		})
	}
	return blocks
}

/** The design-system arguments of a `bun add` line; a bare package name installs `latest`. */
function installArguments(text: string): readonly InstallArgument[] {
	const words = text.replace(/#.*$/, "").trim().split(/\s+/)
	if (words[0] !== "bun" || words[1] !== "add") return []
	return words.slice(2).flatMap((word) => {
		const at = word.lastIndexOf("@")
		const name = at > 0 ? word.slice(0, at) : word
		if (!isDesignSystemPackage(name)) return []
		return [{ name, tag: at > 0 ? word.slice(at + 1) : "latest" }]
	})
}

/** The package a quoted specifier names, and its entrypoint (`.`) or subpath (`./themes/light.css`). */
function specifierTarget(value: string): { packageName: string; subpath: string } | undefined {
	const [scope, folder, ...rest] = value.split("/")
	if (scope !== "@trajectonomics" || folder === undefined) return undefined
	const packageName = `@trajectonomics/${folder}`
	if (!isDesignSystemPackage(packageName)) return undefined
	return { packageName, subpath: rest.length === 0 ? "." : `./${rest.join("/")}` }
}

const SCRIPT_LANGUAGES = new Set([
	"js",
	"javascript",
	"ts",
	"typescript",
	"tsx",
	"jsx",
	"mts",
	"mjs",
	"svelte",
])
const SCRIPT_IMPORT = /import\s*(?:\(\s*|(?:[^"']*\s+from\s+))?["']([^"']+)["']/g
const CSS_IMPORT = /@import\s+["']([^"']+)["']/g
const CONTRACT_VERSION = /console\.log\(semanticTokenContract\.version\)\s*\/\/\s*(\d+)/

/** The import forms a fenced block can carry; a Svelte block carries both a script and a stylesheet. */
function importPatterns(language: string): readonly RegExp[] {
	if (language === "css") return [CSS_IMPORT]
	if (language === "svelte") return [SCRIPT_IMPORT, CSS_IMPORT]
	return SCRIPT_LANGUAGES.has(language) ? [SCRIPT_IMPORT] : []
}

/** The Contract version a README prints, with the line it prints it on. */
function printedContractVersion(markdown: string): { version: number; line: number } | undefined {
	const match = CONTRACT_VERSION.exec(markdown)
	if (match?.[1] === undefined) return undefined
	const line = markdown.slice(0, match.index).split("\n").length
	return { version: Number(match[1]), line }
}

function parseBlock(
	readme: string,
	block: Fence,
	into: { installLines: InstallLine[]; specifiers: DocumentedSpecifier[] },
): void {
	block.lines.forEach((text, index) => {
		const arguments_ = installArguments(text)
		if (arguments_.length > 0) {
			into.installLines.push({ readme, line: block.firstLine + index, arguments: arguments_ })
		}
	})
	const body = block.lines.join("\n")
	for (const pattern of importPatterns(block.language)) {
		for (const match of body.matchAll(pattern)) {
			const target = match[1] === undefined ? undefined : specifierTarget(match[1])
			if (target === undefined) continue
			const line = block.firstLine + body.slice(0, match.index).split("\n").length - 1
			into.specifiers.push({ readme, line, ...target })
		}
	}
}

/** Drop a specifier a Svelte block reads twice, once as a script import and once as a style import. */
function uniqueSpecifiers(
	specifiers: readonly DocumentedSpecifier[],
): readonly DocumentedSpecifier[] {
	const byLocation = new Map<string, DocumentedSpecifier>()
	for (const specifier of specifiers) {
		const key = `${specifier.readme}:${specifier.line}:${specifier.packageName}:${specifier.subpath}`
		byLocation.set(key, specifier)
	}
	return [...byLocation.values()]
}

/** The install lines, imported specifiers and printed Contract versions of the given READMEs. */
export function parseDocumentation(readmes: readonly Readme[]): Documentation {
	const installLines: InstallLine[] = []
	const specifiers: DocumentedSpecifier[] = []
	const contractVersions: DocumentedContractVersion[] = []
	for (const readme of readmes) {
		for (const block of fencedBlocks(readme.markdown)) {
			parseBlock(readme.path, block, { installLines, specifiers })
		}
		const printed = printedContractVersion(readme.markdown)
		if (printed !== undefined) {
			contractVersions.push({ readme: readme.path, line: printed.line, version: printed.version })
		}
	}
	return { installLines, specifiers: uniqueSpecifiers(specifiers), contractVersions }
}

/**
 * The tag the documentation installs a package at, preferring the README a statement came from; a
 * package it only imports is read as `latest`.
 */
export function documentedTag(documentation: Documentation, name: string, readme?: string): string {
	for (const line of documentation.installLines) {
		if (readme !== undefined && line.readme !== readme) continue
		for (const argument of line.arguments) {
			if (argument.name === name) return argument.tag
		}
	}
	return readme === undefined ? "latest" : documentedTag(documentation, name)
}

/** Every tag the documentation installs or imports, so a tag no publish carries is still resolved. */
export function requestedPackages(documentation: Documentation): readonly InstallArgument[] {
	const requested = new Map<string, InstallArgument>()
	const add = (argument: InstallArgument) =>
		requested.set(`${argument.name}@${argument.tag}`, argument)
	for (const line of documentation.installLines)
		for (const argument of line.arguments) add(argument)
	for (const documented of documentation.specifiers) {
		const tag = documentedTag(documentation, documented.packageName, documented.readme)
		add({ name: documented.packageName, tag })
	}
	for (const printed of documentation.contractVersions) {
		add({ name: CORE_PACKAGE, tag: documentedTag(documentation, CORE_PACKAGE, printed.readme) })
	}
	return [...requested.values()]
}
