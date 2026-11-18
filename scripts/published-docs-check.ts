/**
 * Checks what the READMEs document against what a published tag actually ships: an install line, a
 * package entrypoint or subpath the README imports, and the Semantic Token Contract version a README
 * prints. Pure: the documentation and the packed tarballs in, findings out.
 */
import {
	CORE_PACKAGE,
	type Documentation,
	type DocumentedContractVersion,
	type DocumentedSpecifier,
	documentedTag,
	type InstallArgument,
} from "./published-docs"

/** One tarball the documentation is checked against, at the tag the documentation named. */
export interface PackedPackage {
	readonly name: string
	readonly tag: string
	readonly exports: unknown
	/** Package-relative paths the tarball ships, such as `dist/themes/light.css`. */
	readonly files: readonly string[]
	readonly contractVersion?: number
}

/** One documented statement a tag does not ship, with the source that made it. */
export interface Finding {
	readonly readme: string
	readonly line: number
	readonly packageName: string
	readonly tag: string
	readonly message: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

const EXPORT_CONDITIONS: readonly string[] = ["import", "svelte", "default", "require", "types"]

function exportTarget(value: unknown): string | undefined {
	if (typeof value === "string") return value
	if (!isRecord(value)) return undefined
	for (const condition of EXPORT_CONDITIONS) {
		const target = exportTarget(value[condition])
		if (target !== undefined) return target
	}
	for (const [condition, nested] of Object.entries(value)) {
		if (EXPORT_CONDITIONS.includes(condition)) continue
		const target = exportTarget(nested)
		if (target !== undefined) return target
	}
	return undefined
}

/** The file an `exports` map resolves a subpath to, or undefined when it resolves none. */
export function resolveExportTarget(exportsMap: unknown, subpath: string): string | undefined {
	if (typeof exportsMap === "string") return subpath === "." ? exportsMap : undefined
	if (!isRecord(exportsMap)) return undefined
	return exportTarget(exportsMap[subpath])
}

/** The Semantic Token Contract version an imported module reports, if it reports one. */
export function contractVersionOfModule(value: unknown): number | undefined {
	if (!isRecord(value)) return undefined
	const contract = value["semanticTokenContract"]
	const version = isRecord(contract) ? contract["version"] : undefined
	return typeof version === "number" ? version : undefined
}

function installTagConflicts(documentation: Documentation): readonly Finding[] {
	const firstSeen = new Map<string, InstallArgument & { readonly line: number }>()
	const findings: Finding[] = []
	for (const line of documentation.installLines) {
		for (const argument of line.arguments) {
			const seen = firstSeen.get(`${line.readme}:${argument.name}`)
			if (seen === undefined) {
				firstSeen.set(`${line.readme}:${argument.name}`, { ...argument, line: line.line })
				continue
			}
			if (seen.tag === argument.tag) continue
			findings.push({
				readme: line.readme,
				line: line.line,
				packageName: argument.name,
				tag: argument.tag,
				message: `names ${argument.name}@${argument.tag}, but line ${seen.line} names ${argument.name}@${seen.tag}`,
			})
		}
	}
	return findings
}

function specifierFinding(
	documentation: Documentation,
	published: ReadonlyMap<string, PackedPackage>,
	documented: DocumentedSpecifier,
): Finding | undefined {
	const tag = documentedTag(documentation, documented.packageName, documented.readme)
	const base = {
		readme: documented.readme,
		line: documented.line,
		packageName: documented.packageName,
		tag,
	}
	const package_ = published.get(`${documented.packageName}@${tag}`)
	if (package_ === undefined) {
		return {
			...base,
			message: `${documented.packageName}@${tag} was not resolved, so ${JSON.stringify(documented.subpath)} cannot be checked`,
		}
	}
	const target = resolveExportTarget(package_.exports, documented.subpath)
	if (target === undefined) {
		return {
			...base,
			message: `${documented.packageName}@${tag} does not export ${JSON.stringify(documented.subpath)}`,
		}
	}
	if (package_.files.includes(target.replace(/^\.\//, ""))) return undefined
	return {
		...base,
		message: `${documented.packageName}@${tag} exports ${JSON.stringify(documented.subpath)} to ${target}, which the packed files do not contain`,
	}
}

function contractVersionFinding(
	documentation: Documentation,
	published: ReadonlyMap<string, PackedPackage>,
	printed: DocumentedContractVersion,
): Finding | undefined {
	const tag = documentedTag(documentation, CORE_PACKAGE, printed.readme)
	const base = { readme: printed.readme, line: printed.line, packageName: CORE_PACKAGE, tag }
	const package_ = published.get(`${CORE_PACKAGE}@${tag}`)
	if (package_ === undefined) {
		return {
			...base,
			message: `${CORE_PACKAGE}@${tag} was not resolved, so its Contract version is unknown`,
		}
	}
	if (package_.contractVersion === printed.version) return undefined
	const reported = package_.contractVersion ?? "no Contract version"
	return {
		...base,
		message: `prints Contract version ${printed.version}, but ${CORE_PACKAGE}@${tag} reports ${reported}`,
	}
}

/** Every documented install, specifier and Contract version a tag does not ship, named in a message. */
export function checkDocumentation(
	documentation: Documentation,
	packages: readonly PackedPackage[],
): readonly Finding[] {
	const published = new Map(packages.map((entry) => [`${entry.name}@${entry.tag}`, entry]))
	const findings: Finding[] = [...installTagConflicts(documentation)]
	for (const documented of documentation.specifiers) {
		const finding = specifierFinding(documentation, published, documented)
		if (finding !== undefined) findings.push(finding)
	}
	for (const printed of documentation.contractVersions) {
		const finding = contractVersionFinding(documentation, published, printed)
		if (finding !== undefined) findings.push(finding)
	}
	return findings
}

/** The line the CLI prints for a finding. */
export function formatFinding(finding: Finding): string {
	return `${finding.readme}:${finding.line}: ${finding.message}`
}
