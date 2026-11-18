/**
 * Proves this repository's documentation against the tarballs its dist-tags publish: every `bun add`
 * line, every package subpath a README imports, and the Semantic Token Contract version the root
 * README prints. The parsing and comparison are pure and unit-tested offline; this CLI is the only
 * part that reads the network, so `bun run check` stays offline.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { parseArgs } from "node:util"
import {
	CORE_PACKAGE,
	type Documentation,
	parseDocumentation,
	type Readme,
	requestedPackages,
} from "./published-docs"
import {
	checkDocumentation,
	contractVersionOfModule,
	formatFinding,
	type PackedPackage,
	resolveExportTarget,
} from "./published-docs-check"

interface LocalPackage {
	readonly name: string
	readonly folder: string
	readonly directory: string
}

const temporaryDirectories: string[] = []

function temporaryDirectory(prefix: string): string {
	const directory = mkdtempSync(join(tmpdir(), prefix))
	temporaryDirectories.push(directory)
	return directory
}

function runCommand(command: readonly string[], cwd: string): string {
	const result = Bun.spawnSync({ cmd: [...command], cwd, stdout: "pipe", stderr: "pipe" })
	const stdout = result.stdout.toString()
	if (result.exitCode !== 0) {
		throw new Error(
			`${command.join(" ")} failed\n${result.stderr.toString().trim() || stdout.trim()}`,
		)
	}
	return stdout
}

function localPackages(root: string): readonly LocalPackage[] {
	const packagesDirectory = join(root, "packages")
	return readdirSync(packagesDirectory)
		.sort()
		.map((folder) => ({ folder, directory: join(packagesDirectory, folder) }))
		.filter(({ directory }) => existsSync(join(directory, "package.json")))
		.map(({ folder, directory }) => {
			const manifest: unknown = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"))
			if (typeof manifest !== "object" || manifest === null || !("name" in manifest)) {
				throw new Error(`${directory}/package.json carries no name`)
			}
			return { folder, directory, name: String(manifest.name) }
		})
}

function readDocumentation(root: string, locals: readonly LocalPackage[]): Documentation {
	const readmes: Readme[] = [
		{ path: "README.md", markdown: readFileSync(join(root, "README.md"), "utf8") },
		...locals.map(({ folder }) => ({
			path: `packages/${folder}/README.md`,
			markdown: readFileSync(join(root, "packages", folder, "README.md"), "utf8"),
		})),
	]
	return parseDocumentation(readmes)
}

/** The packages the branch's own diff touches, so their next alpha publishes on merge. */
function changedPackages(
	root: string,
	base: string,
	locals: readonly LocalPackage[],
): ReadonlySet<string> {
	const probe = Bun.spawnSync({
		cmd: ["git", "cat-file", "-e", `${base}^{commit}`],
		cwd: root,
		stdout: "pipe",
		stderr: "pipe",
	})
	if (probe.exitCode !== 0) {
		console.log(`published-docs: no base commit ${base}, so nothing is in flight`)
		return new Set()
	}
	const changed = new Set<string>()
	for (const path of runCommand(["git", "diff", "--name-only", `${base}...HEAD`], root).split(
		"\n",
	)) {
		const [parent, folder] = path.split("/")
		if (parent !== "packages" || folder === undefined) continue
		const local = locals.find((entry) => entry.folder === folder)
		if (local !== undefined) changed.add(local.name)
	}
	return changed
}

function tarballsIn(directory: string): readonly string[] {
	return readdirSync(directory)
		.filter((entry) => entry.endsWith(".tgz"))
		.map((entry) => join(directory, entry))
}

function packPublished(name: string, tag: string): string {
	const destination = temporaryDirectory("published-docs-pack-")
	const packageSpecifier = tag === "latest" ? name : `${name}@${tag}`
	runCommand(
		["npm", "pack", packageSpecifier, "--pack-destination", destination, "--loglevel=error"],
		destination,
	)
	const tarballs = tarballsIn(destination)
	if (tarballs.length !== 1) {
		throw new Error(`npm pack ${packageSpecifier} wrote ${tarballs.length} tarballs`)
	}
	return tarballs[0] as string
}

function packLocal(local: LocalPackage): string {
	const tarball = join(temporaryDirectory("published-docs-local-"), `${local.folder}.tgz`)
	runCommand(["bun", "pm", "pack", "--filename", tarball, "--quiet"], local.directory)
	return tarball
}

function tarballManifest(tarball: string): Record<string, unknown> {
	const parsed: unknown = JSON.parse(
		runCommand(["tar", "xzf", tarball, "-O", "package/package.json"], process.cwd()),
	)
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${tarball}: package.json is not an object`)
	}
	return parsed as Record<string, unknown>
}

function tarballFiles(tarball: string): readonly string[] {
	return runCommand(["tar", "tzf", tarball], process.cwd())
		.split("\n")
		.map((entry) => entry.trim())
		.filter((entry) => entry !== "" && !entry.endsWith("/"))
		.map((entry) => entry.replace(/^package\//, ""))
}

/** The Contract version the package's entrypoint reports, or undefined when it ships none. */
async function publishedContractVersion(
	tarball: string,
	entrypoint: string | undefined,
): Promise<number | undefined> {
	if (entrypoint === undefined) return undefined
	const file = `package/${entrypoint.replace(/^\.\//, "")}`
	const directory = temporaryDirectory("published-docs-contract-")
	runCommand(["tar", "xzf", tarball, "-C", directory, file], process.cwd())
	const module: unknown = await import(pathToFileURL(join(directory, file)).href)
	return contractVersionOfModule(module)
}

async function packedPackage(tarball: string, tag: string): Promise<PackedPackage> {
	const manifest = tarballManifest(tarball)
	const name = manifest["name"]
	if (typeof name !== "string") throw new Error(`${tarball}: package.json carries no name`)
	const exportsMap = manifest["exports"]
	const contractVersion =
		name === CORE_PACKAGE
			? await publishedContractVersion(tarball, resolveExportTarget(exportsMap, "."))
			: undefined
	return {
		name,
		tag,
		exports: exportsMap,
		files: tarballFiles(tarball),
		...(contractVersion === undefined ? {} : { contractVersion }),
	}
}

interface ResolvedPackages {
	readonly packages: readonly PackedPackage[]
	readonly inFlight: ReadonlySet<string>
}

/** Pack each documented tag from npm, or from the local build when the branch touches the package. */
async function resolvePackages(
	documentation: Documentation,
	locals: readonly LocalPackage[],
	changed: ReadonlySet<string>,
): Promise<ResolvedPackages> {
	const packages: PackedPackage[] = []
	const inFlight = new Set<string>()
	for (const { name, tag } of requestedPackages(documentation)) {
		const local = locals.find((entry) => entry.name === name)
		if (local !== undefined && changed.has(name)) {
			inFlight.add(name)
			packages.push(await packedPackage(packLocal(local), tag))
		} else {
			packages.push(await packedPackage(packPublished(name, tag), tag))
		}
	}
	return { packages, inFlight }
}

async function main(): Promise<void> {
	const { values } = parseArgs({ options: { base: { type: "string" } } })
	const base = values.base ?? "origin/main"
	const root = process.cwd()
	const locals = localPackages(root)
	const documentation = readDocumentation(root, locals)
	const changed = changedPackages(root, base, locals)
	try {
		const { packages, inFlight } = await resolvePackages(documentation, locals, changed)
		for (const name of inFlight) console.log(`in flight: ${name}, its alpha publishes on merge`)
		const findings = checkDocumentation(documentation, packages)
		for (const finding of findings) console.error(formatFinding(finding))
		if (findings.length > 0) {
			throw new Error(
				`${findings.length} documented statement(s) do not exist in what the tag publishes`,
			)
		}
		console.log(
			`published-docs: ${packages.length} package tag(s), ${documentation.installLines.length} install line(s) and ${documentation.specifiers.length} subpath(s) checked`,
		)
	} finally {
		for (const directory of temporaryDirectories.splice(0)) {
			rmSync(directory, { recursive: true, force: true })
		}
	}
}

if (import.meta.main) {
	await main().catch((error: unknown) => {
		console.error(`published-docs: ${error instanceof Error ? error.message : String(error)}`)
		process.exitCode = 1
	})
}
