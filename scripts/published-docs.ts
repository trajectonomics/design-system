/**
 * Reads what this repository's documentation installs and imports: every `bun add` line, every
 * package subpath a README imports, and the Semantic Token Contract version the root README prints.
 * Pure: the Markdown of the READMEs in, the documented packages and subpaths out.
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

/** A package subpath a fenced CSS or script import names, such as `./themes/light.css`. */
export interface DocumentedSpecifier {
	readonly readme: string
	readonly line: number
	readonly packageName: string
	readonly subpath: string
}

/** The Semantic Token Contract version the root README prints. */
export interface DocumentedContractVersion {
	readonly readme: string
	readonly version: number
}

/** Everything the READMEs document, in the form the check compares. */
export interface Documentation {
	readonly installLines: readonly InstallLine[]
	readonly specifiers: readonly DocumentedSpecifier[]
	readonly contractVersion?: DocumentedContractVersion
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
	for (const match of markdown.matchAll(/^```(\S*)\n([\s\S]*?)^```$/gm)) {
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

/** A package subpath a quoted specifier names, such as `./themes/light.css`; a bare name is not one. */
function specifierTarget(value: string): { packageName: string; subpath: string } | undefined {
	const [scope, folder, ...rest] = value.split("/")
	if (scope !== "@trajectonomics" || folder === undefined || rest.length === 0) return undefined
	const packageName = `@trajectonomics/${folder}`
	if (!isDesignSystemPackage(packageName)) return undefined
	return { packageName, subpath: `./${rest.join("/")}` }
}

const SCRIPT_LANGUAGES = new Set(["js", "javascript", "ts", "typescript", "svelte"])
const SCRIPT_IMPORT = /import\s+(?:[^"']*\s+from\s+)?["']([^"']+)["']/g
const CSS_IMPORT = /@import\s+["']([^"']+)["']/g
const CONTRACT_VERSION = /console\.log\(semanticTokenContract\.version\)\s*\/\/\s*(\d+)/

/** The import form a fenced block's quoted specifier can take, or none for a block that has none. */
function importPattern(language: string): RegExp | undefined {
	if (language === "css") return CSS_IMPORT
	return SCRIPT_LANGUAGES.has(language) ? SCRIPT_IMPORT : undefined
}

function printedContractVersion(markdown: string): number | undefined {
	const printed = CONTRACT_VERSION.exec(markdown)?.[1]
	return printed === undefined ? undefined : Number(printed)
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
	const pattern = importPattern(block.language)
	if (pattern === undefined) return
	const body = block.lines.join("\n")
	for (const match of body.matchAll(pattern)) {
		const target = match[1] === undefined ? undefined : specifierTarget(match[1])
		if (target === undefined) continue
		const line = block.firstLine + body.slice(0, match.index).split("\n").length - 1
		into.specifiers.push({ readme, line, ...target })
	}
}

/** The install lines, imported subpaths and printed Contract version of the given READMEs. */
export function parseDocumentation(readmes: readonly Readme[]): Documentation {
	const parsed = { installLines: [] as InstallLine[], specifiers: [] as DocumentedSpecifier[] }
	let contractVersion: DocumentedContractVersion | undefined
	for (const readme of readmes) {
		for (const block of fencedBlocks(readme.markdown)) parseBlock(readme.path, block, parsed)
		const printed = printedContractVersion(readme.markdown)
		if (printed !== undefined && contractVersion === undefined) {
			contractVersion = { readme: readme.path, version: printed }
		}
	}
	return { ...parsed, ...(contractVersion === undefined ? {} : { contractVersion }) }
}

/** The tag the documentation installs a package at; a package it only imports is read as `latest`. */
export function documentedTag(documentation: Documentation, name: string): string {
	for (const line of documentation.installLines) {
		for (const argument of line.arguments) {
			if (argument.name === name) return argument.tag
		}
	}
	return "latest"
}

/** Every tag the documentation installs or imports, so a tag no publish carries is still resolved. */
export function requestedPackages(documentation: Documentation): readonly InstallArgument[] {
	const requested = new Map<string, InstallArgument>()
	const add = (argument: InstallArgument) =>
		requested.set(`${argument.name}@${argument.tag}`, argument)
	for (const line of documentation.installLines)
		for (const argument of line.arguments) add(argument)
	for (const documented of documentation.specifiers) {
		add({ name: documented.packageName, tag: documentedTag(documentation, documented.packageName) })
	}
	if (documentation.contractVersion !== undefined) {
		add({ name: CORE_PACKAGE, tag: documentedTag(documentation, CORE_PACKAGE) })
	}
	return [...requested.values()]
}
